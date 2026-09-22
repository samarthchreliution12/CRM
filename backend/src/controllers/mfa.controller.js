const otplib = require("otplib");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserModel = require("../models/user.model");
const RefreshSessionModel = require("../models/refreshSession.model");
const AuditService = require("../services/audit.service");
const config = require("../config/env");
const { sendSuccess, sendError } = require("../utils/response.util");

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateRawRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

function getRefreshTokenCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

class MfaController {
  /**
   * GET /api/auth/mfa/status
   */
  static async getMfaStatus(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      return sendSuccess(res, 200, "MFA status retrieved", {
        mfa_enabled: Boolean(user?.mfa_enabled),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/mfa/setup
   * Generate secret and QR code for Authenticator app
   */
  static async setupMfa(req, res, next) {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      const secret = otplib.generateSecret();
      const otpauthUrl = otplib.generateURI({
        secret,
        label: userEmail,
        issuer: "Parshwa CRM",
      });

      await UserModel.setMfaSecret(userId, secret);
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      return sendSuccess(res, 200, "MFA setup initiated", {
        secret,
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/mfa/verify-step1
   * Verify the first code from authenticator
   */
  static async verifyStep1(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user.id;

      if (!code) {
        return sendError(res, 400, "Passcode is required.");
      }

      const cleanCode = String(code).trim().replace(/\s+/g, "");
      const userMfa = await UserModel.getMfaDetails(userId);

      if (!userMfa || !userMfa.mfa_secret) {
        return sendError(res, 400, "MFA setup has not been initialized.");
      }

      const result = otplib.verifySync({
        token: cleanCode,
        secret: userMfa.mfa_secret,
        window: 4,
      });

      if (!result || result.valid !== true) {
        return sendError(res, 400, "Invalid verification code. Please check your Authenticator app and try again.");
      }

      await UserModel.setMfaStep1Timestep(userId, result.timeStep || Date.now());

      return sendSuccess(res, 200, "First code verified. Please wait for code rotation to complete activation.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/mfa/activate
   * Verify second code (rotation check) and activate MFA permanently
   */
  static async activateMfa(req, res, next) {
    try {
      const { code } = req.body;
      const userId = req.user.id;

      if (!code) {
        return sendError(res, 400, "Passcode is required.");
      }

      const cleanCode = String(code).trim().replace(/\s+/g, "");
      const userMfa = await UserModel.getMfaDetails(userId);

      if (!userMfa || !userMfa.mfa_secret) {
        return sendError(res, 400, "MFA setup has not been initialized.");
      }

      if (!userMfa.mfa_step1_timestep) {
        return sendError(res, 400, "Please verify the first MFA code before proceeding to activation.");
      }

      const result = otplib.verifySync({
        token: cleanCode,
        secret: userMfa.mfa_secret,
        window: 4,
      });

      if (!result || result.valid !== true) {
        return sendError(res, 400, "Invalid verification code. Please check your app and try again.");
      }

      if (result.timeStep === parseInt(userMfa.mfa_step1_timestep, 10)) {
        return sendError(res, 400, "Please enter the next verification code after it rotates (about 30 seconds).");
      }

      await UserModel.activateMfa(userId);

      await AuditService.log({
        userId,
        action: "MFA_ACTIVATE",
        module: "SECURITY",
        entityType: "USER",
        entityId: userId,
        description: `MFA security protection activated successfully for user ID ${userId}`,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
      });

      return sendSuccess(res, 200, "Multi-Factor Authentication enabled successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/mfa/disable
   * Disable MFA for currently authenticated user
   */
  static async disableMfa(req, res, next) {
    try {
      const userId = req.user.id;
      await UserModel.disableMfa(userId);

      await AuditService.log({
        userId,
        action: "MFA_DISABLE",
        module: "SECURITY",
        entityType: "USER",
        entityId: userId,
        description: `MFA security protection disabled for user ID ${userId}`,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
      });

      return sendSuccess(res, 200, "Multi-Factor Authentication disabled successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login-mfa-verify
   * Verify TOTP code during login for MFA-enabled accounts
   */
  static async verifyLoginMfa(req, res, next) {
    try {
      const { userId, code } = req.body;
      if (!userId || !code) {
        return sendError(res, 400, "User ID and passcode are required.");
      }

      const userMfa = await UserModel.getMfaDetails(userId);
      if (!userMfa) {
        return sendError(res, 404, "User not found.");
      }

      if (!userMfa.mfa_enabled || !userMfa.mfa_secret) {
        return sendError(res, 400, "MFA is not enabled for this account.");
      }

      const cleanCode = String(code).trim().replace(/\s+/g, "");
      const result = otplib.verifySync({
        token: cleanCode,
        secret: userMfa.mfa_secret,
        window: 4,
      });

      if (!result || result.valid !== true) {
        return sendError(res, 400, "Invalid MFA code. Please check your Authenticator app and try again.");
      }

      // Reset failed attempts upon successful MFA verification
      await UserModel.resetFailedLogins(userId);
      await UserModel.updateLastLogin(userId);

      const userProfile = await UserModel.findByIdWithRoleAndPermissions(userId);

      // Sign Access Token
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

      // Sign & Store Refresh Token
      const rawRefreshToken = generateRawRefreshToken();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await RefreshSessionModel.createSession({
        userId: userProfile.id,
        tokenHash,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
        expiresAt,
      });

      res.cookie("refreshToken", rawRefreshToken, getRefreshTokenCookieOptions());

      await AuditService.log({
        userId: userProfile.id,
        action: "LOGIN_MFA_SUCCESS",
        module: "AUTH",
        entityType: "USER",
        entityId: userProfile.id,
        description: `MFA Login successful for user: ${userProfile.email}`,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
      });

      return sendSuccess(res, 200, "Login successful", {
        token: accessToken,
        user: userProfile,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MfaController;
