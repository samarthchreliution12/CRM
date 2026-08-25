const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const RoleModel = require("../models/role.model");
const config = require("../config/env");

class AuthService {
  /**
   * Authenticates user email and password.
   */
  static async login(email, password) {
    const user = await UserModel.findByEmail(email);

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    if (user.status !== "active") {
      const error = new Error("Your account is currently inactive. Please contact support.");
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Update last login timestamp in PostgreSQL database
    await UserModel.updateLastLogin(user.id);

    // Fetch sanitized profile with assigned permissions
    const userProfile = await UserModel.findByIdWithRoleAndPermissions(user.id);

    // Sign JWT token payload
    const token = jwt.sign(
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
      token,
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
   * Prepared future signup business logic.
   * Registers a user account with role validation and password hashing.
   */
  static async signup({ name, email, password, mobile, role_id }, requester = null) {
    // 1. Check duplicate email
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 400;
      throw error;
    }

    // 2. Check target role existence
    const targetRole = await RoleModel.findById(role_id);
    if (!targetRole) {
      const error = new Error("Specified role does not exist");
      error.statusCode = 400;
      throw error;
    }

    // 3. Security check: Non-Admin users or public signup requests cannot create Admin accounts
    if (targetRole.name === "Admin") {
      const isRequesterAdmin = requester && requester.role && requester.role.name === "Admin";
      if (!isRequesterAdmin) {
        const error = new Error("Creating Admin accounts via public signup is forbidden");
        error.statusCode = 403;
        throw error;
      }
    }

    // 4. Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    // 5. Create user in database
    const newUser = await UserModel.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      mobile: mobile ? mobile.trim() : null,
      role_id: Number(role_id),
      status: "active",
    });

    // 6. Return sanitized user profile without password_hash
    const createdProfile = await UserModel.findByIdWithRoleAndPermissions(newUser.id);
    return createdProfile;
  }

  /**
   * Generates a password reset token and link for a valid user.
   */
  static async forgotPassword(email) {
    const user = await UserModel.findByEmail(email.trim());
    
    // Generic response message to prevent email enumeration
    const genericMessage = "If an account with that email exists, a password reset link has been created.";

    if (!user || user.status !== "active") {
      return {
        message: genericMessage,
      };
    }

    // Generate a 15-minute JWT password reset token
    const resetPayload = {
      id: user.id,
      email: user.email,
      type: "password_reset",
    };

    const resetToken = jwt.sign(resetPayload, config.jwtSecret, {
      expiresIn: "15m",
    });

    const resetLink = `${config.clientUrl}/reset-password?token=${resetToken}`;

    console.log("\n==================================================================");
    console.log(`🔑 [PASSWORD RESET LINK GENERATED]:`);
    console.log(`   ${resetLink}`);
    console.log("==================================================================\n");

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

    // Hash new password using bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    // Update password in database
    await UserModel.updatePassword(user.id, password_hash);

    return {
      message: "Password has been reset successfully. You can now log in with your new password.",
    };
  }
}

module.exports = AuthService;
