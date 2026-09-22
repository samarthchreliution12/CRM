const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserModel = require("../models/user.model");
const RoleModel = require("../models/role.model");
const RefreshSessionModel = require("../models/refreshSession.model");
const SystemSettingModel = require("../models/systemSetting.model");
const AuditService = require("./audit.service");
const config = require("../config/env");

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateRawRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

class AuthService {
  /**
   * Authenticates user email and password.
   */
  static async login(email, password, context = {}) {
    const user = await UserModel.findByEmail(email);

    // Generic response message to prevent email/mobile user enumeration
    const genericError = new Error("Invalid email/mobile or password");
    genericError.statusCode = 401;

    if (!user) {
      throw genericError;
    }

    if (user.status !== "active") {
      const error = new Error("Your account is currently inactive. Please contact support.");
      error.statusCode = 403;
      throw error;
    }

    // Check brute force account lockout
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lock_until) - new Date()) / 60000);
      const error = new Error(`Account is temporarily locked due to consecutive failed attempts. Please try again in ${remainingMinutes} minute(s).`);
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Record failed login attempt and enforce static default threshold (5 failed attempts -> 15 min lockout)
      const maxAttempts = 5;
      const nextAttempts = (user.failed_login_attempts || 0) + 1;

      let lockUntil = null;
      if (nextAttempts >= maxAttempts) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }

      await UserModel.recordFailedLogin(user.id, nextAttempts, lockUntil);

      if (lockUntil) {
        const error = new Error("Too many failed password attempts. Your account has been locked for 15 minutes.");
        error.statusCode = 403;
        throw error;
      }

      throw genericError;
    }

    // Reset failed login attempts upon successful password verification
    if (user.failed_login_attempts > 0 || user.lock_until) {
      await UserModel.resetFailedLogins(user.id);
    }

    // If MFA is enabled on this account, pause and request 6-digit TOTP passcode
    if (user.mfa_enabled && user.mfa_secret) {
      return {
        mfaRequired: true,
        userId: user.id,
        email: user.email,
      };
    }

    // Update last login timestamp in PostgreSQL database
    await UserModel.updateLastLogin(user.id);

    // Fetch sanitized profile with assigned permissions
    const userProfile = await UserModel.findByIdWithRoleAndPermissions(user.id);

    // 1. Sign short-lived 30-minute Access Token with token_version
    const accessToken = jwt.sign(
      {
        id: userProfile.id,
        user_id: userProfile.id,
        role_id: userProfile.role.id,
        email: userProfile.email,
        token_version: userProfile.token_version || 1,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // 2. Generate 7-day Refresh Token string & store hash in database
    const rawRefreshToken = generateRawRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshSessionModel.createSession({
      userId: userProfile.id,
      tokenHash,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt,
    });

    await AuditService.log({
      userId: userProfile.id,
      action: "LOGIN",
      module: "AUTH",
      entityType: "USER",
      entityId: userProfile.id,
      description: `User logged in: ${userProfile.email}`,
      ipAddress: context.ipAddress,
    });

    return {
      token: accessToken,
      refreshToken: rawRefreshToken,
      user: userProfile,
    };
  }

  /**
   * Rotates refresh token and issues a new 30-minute access token.
   */
  static async refreshToken(rawRefreshToken, context = {}) {
    if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
      const error = new Error("Refresh token required");
      error.statusCode = 401;
      throw error;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const session = await RefreshSessionModel.findByTokenHash(tokenHash);

    // Token reuse / theft detection: If session does not exist or was already revoked
    if (!session || session.revoked_at) {
      if (session && session.user_id) {
        // Potential security breach: Revoke ALL active sessions for this user!
        await RefreshSessionModel.revokeAllUserSessions(session.user_id);
        await AuditService.log({
          userId: session.user_id,
          action: "REFRESH_TOKEN_REUSE_DETECTED",
          module: "AUTH",
          entityType: "USER",
          entityId: session.user_id,
          description: `Revoked all refresh sessions due to attempted reuse of revoked token.`,
          ipAddress: context.ipAddress,
        });
      }
      const error = new Error("Invalid or revoked refresh session. Please log in again.");
      error.statusCode = 401;
      throw error;
    }

    // Check expiration
    if (new Date(session.expires_at).getTime() < Date.now()) {
      await RefreshSessionModel.revokeSession(session.id);
      const error = new Error("Refresh session expired. Please log in again.");
      error.statusCode = 401;
      throw error;
    }

    // Fetch active user profile
    const userProfile = await UserModel.findByIdWithRoleAndPermissions(session.user_id);
    if (!userProfile || userProfile.status !== "active") {
      await RefreshSessionModel.revokeSession(session.id);
      const error = new Error("User account is inactive or no longer exists");
      error.statusCode = 401;
      throw error;
    }

    // 1. Revoke current refresh session (Rotation)
    await RefreshSessionModel.revokeSession(session.id);

    // 2. Issue NEW 7-day Refresh Token string & store hash in database
    const newRawRefreshToken = generateRawRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshSessionModel.createSession({
      userId: userProfile.id,
      tokenHash: newTokenHash,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt: newExpiresAt,
    });

    // 3. Issue NEW 30-minute Access Token
    const newAccessToken = jwt.sign(
      {
        id: userProfile.id,
        user_id: userProfile.id,
        role_id: userProfile.role.id,
        email: userProfile.email,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: userProfile,
    };
  }

  /**
   * Fetches profile and permissions of authenticated user by ID.
   */
  static async getCurrentUserProfile(userId) {
    const userProfile = await UserModel.findByIdWithRoleAndPermissions(userId);
    if (!userProfile) {
      const error = new Error("Authenticated user profile not found");
      error.statusCode = 404;
      throw error;
    }
    return userProfile;
  }

  /**
   * Updates profile of authenticated user (name, email, mobile).
   */
  static async updateProfile(userId, { name, email, mobile }) {
    const currentUser = await UserModel.findByIdWithRoleAndPermissions(userId);
    if (!currentUser) {
      const error = new Error("Authenticated user profile not found");
      error.statusCode = 404;
      throw error;
    }

    // Email uniqueness check if email is modified
    if (email && email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      const existingUser = await UserModel.findByEmail(email.trim());
      if (existingUser && Number(existingUser.id) !== Number(userId)) {
        const error = new Error("Email is already registered by another user");
        error.statusCode = 400;
        error.errors = [{ field: "email", message: "Email is already registered by another user" }];
        throw error;
      }
    }

    const updatedUser = await UserModel.updateProfile(userId, { name, email, mobile });
    return updatedUser;
  }

  /**
   * Revokes refresh token session on logout.
   */
  static async logout(rawRefreshToken, userId = null) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      const session = await RefreshSessionModel.findByTokenHash(tokenHash);
      if (session) {
        await RefreshSessionModel.revokeSession(session.id);
      }
    }

    if (userId) {
      await RefreshSessionModel.revokeAllUserSessions(userId);
    }

    return true;
  }

  /**
   * Prepared future signup business logic.
   */
  static async signup({ name, email, password, mobile, role_id }, requester = null) {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 400;
      throw error;
    }

    const targetRole = await RoleModel.findById(role_id);
    if (!targetRole) {
      const error = new Error("Specified role does not exist");
      error.statusCode = 400;
      throw error;
    }

    if (targetRole.name === "Admin") {
      const isRequesterAdmin = requester && requester.role && requester.role.name === "Admin";
      if (!isRequesterAdmin) {
        const error = new Error("Creating Admin accounts via public signup is forbidden");
        error.statusCode = 403;
        throw error;
      }
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await UserModel.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      mobile: mobile ? mobile.trim() : null,
      role_id: Number(role_id),
      status: "active",
    });

    const createdProfile = await UserModel.findByIdWithRoleAndPermissions(newUser.id);
    return createdProfile;
  }

  /**
   * Generates a password reset token and link for a valid user.
   */
  static async forgotPassword(email, clientOrigin = null) {
    const user = await UserModel.findByEmail(email.trim());
    const genericMessage = "If an account with that email exists, a password reset link has been created.";

    if (!user || user.status !== "active") {
      console.log(`\n[AUTH] Password reset requested for non-existent or inactive email: ${email}\n`);
      return { message: genericMessage };
    }

    const resetPayload = {
      id: user.id,
      email: user.email,
      type: "password_reset",
    };

    const resetToken = jwt.sign(resetPayload, config.jwtSecret, {
      expiresIn: "15m",
    });

    const baseUrl = (clientOrigin && clientOrigin !== "null") ? clientOrigin.replace(/\/$/, "") : config.clientUrl.replace(/\/$/, "");
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    console.log(`\n======================================================================`);
    console.log(`🔑 PASSWORD RESET LINK GENERATED (Expires in 15 mins):`);
    console.log(`User:       ${user.name} (${user.email})`);
    console.log(`Reset URL:  ${resetLink}`);
    console.log(`======================================================================\n`);

    return {
      message: genericMessage,
      reset_token: resetToken,
      reset_link: resetLink,
    };
  }

  /**
   * Verifies reset token and updates password in database after confirming password match.
   */
  static async resetPassword({ token, password, confirm_password }) {
    if (password !== confirm_password) {
      const error = new Error("Password and confirmation password do not match");
      error.statusCode = 400;
      throw error;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        const error = new Error("Password reset token has expired. Please request a new link.");
        error.statusCode = 400;
        throw error;
      }
      const error = new Error("Invalid password reset token");
      error.statusCode = 400;
      throw error;
    }

    if (!decoded || decoded.type !== "password_reset" || !decoded.id) {
      const error = new Error("Invalid password reset token payload");
      error.statusCode = 400;
      throw error;
    }

    const user = await UserModel.findByIdWithRoleAndPermissions(decoded.id);
    if (!user || user.status !== "active") {
      const error = new Error("User account is inactive or no longer exists");
      error.statusCode = 400;
      throw error;
    }

    const password_hash = await bcrypt.hash(password, 10);
    await UserModel.updatePassword(user.id, password_hash);

    return {
      message: "Password has been reset successfully. You can now log in with your new password.",
    };
  }

  /**
   * Authenticated user changes their own password with old password verification.
   */
  static async changePassword(userId, oldPassword, newPassword, ipAddress) {
    if (!oldPassword || !newPassword) {
      const error = new Error("Both current password and new password are required");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error("New password must be at least 6 characters long");
      error.statusCode = 400;
      throw error;
    }

    const user = await UserModel.findByEmail(
      (await UserModel.findById(userId))?.email || ""
    );

    if (!user) {
      const error = new Error("User account not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      const error = new Error("Current password entered is incorrect");
      error.statusCode = 400;
      throw error;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(userId, newHash);
    await RefreshSessionModel.revokeAllUserSessions(userId);

    await AuditService.log({
      userId,
      action: "PASSWORD_CHANGE",
      module: "AUTH",
      entityType: "USER",
      entityId: userId,
      description: `User changed password: ${user.email}`,
      ipAddress,
    });

    return { message: "Password updated successfully. Please log in with your new password." };
  }

  /**
   * Terminate all sessions for currently logged in user across all devices.
   */
  static async logoutAllDevices(userId, ipAddress) {
    await UserModel.incrementTokenVersion(userId);
    await RefreshSessionModel.revokeAllUserSessions(userId);

    await AuditService.log({
      userId,
      action: "LOGOUT_ALL_DEVICES",
      module: "AUTH",
      entityType: "USER",
      entityId: userId,
      description: `User terminated all device sessions`,
      ipAddress,
    });

    return { message: "Successfully logged out from all devices." };
  }
}

module.exports = AuthService;
