const AuthService = require("../services/auth.service");
const { sendSuccess } = require("../utils/response.util");

function getRefreshTokenCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
}

class AuthController {
  /**
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const context = {
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
      };
      const result = await AuthService.login(email.trim(), password, context);

      // Set HttpOnly refresh token cookie
      res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

      // Strip raw refreshToken from JSON body payload
      delete result.refreshToken;

      return sendSuccess(res, 200, "Login successful", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Rotates refresh token cookie and issues a new 30-minute access token.
   */
  static async refreshToken(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken;
      const context = {
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
      };

      const result = await AuthService.refreshToken(rawRefreshToken, context);

      // Set rotated HttpOnly refresh token cookie
      res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

      delete result.refreshToken;

      return sendSuccess(res, 200, "Token refreshed successfully", result);
    } catch (error) {
      // Clear cookie if refresh failed
      res.clearCookie("refreshToken", { path: "/api/auth" });
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const userProfile = await AuthService.getCurrentUserProfile(req.user.id);
      return sendSuccess(res, 200, "User profile retrieved successfully", { user: userProfile });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { name, email, mobile } = req.body;
      const updatedUser = await AuthService.updateProfile(req.user.id, { name, email, mobile });
      return sendSuccess(res, 200, "Profile updated successfully", { user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const rawRefreshToken = req.cookies.refreshToken;
      await AuthService.logout(rawRefreshToken, req.user ? req.user.id : null);
      
      res.clearCookie("refreshToken", { path: "/api/auth" });
      res.clearCookie("token", { path: "/api/auth" });

      return sendSuccess(res, 200, "Logout successful");
    } catch (error) {
      res.clearCookie("refreshToken", { path: "/api/auth" });
      next(error);
    }
  }

  /**
   * POST /api/auth/signup (Prepared endpoint)
   */
  static async signup(req, res, next) {
    try {
      const newUserProfile = await AuthService.signup(req.body, req.user || null);
      return sendSuccess(res, 201, "User registered successfully", { user: newUserProfile });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const clientOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
      const result = await AuthService.forgotPassword(req.body.email, clientOrigin);
      return sendSuccess(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const result = await AuthService.resetPassword(req.body);
      return sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { oldPassword, currentPassword, newPassword } = req.body;
      const currentPwd = oldPassword || currentPassword;
      const ipAddress = req.ip || req.headers["x-forwarded-for"];

      const result = await AuthService.changePassword(req.user.id, currentPwd, newPassword, ipAddress);
      
      // Clear refresh cookie since sessions are revoked
      res.clearCookie("refreshToken", { path: "/api/auth" });

      return sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout-all
   */
  static async logoutAllDevices(req, res, next) {
    try {
      const ipAddress = req.ip || req.headers["x-forwarded-for"];
      const result = await AuthService.logoutAllDevices(req.user.id, ipAddress);

      res.clearCookie("refreshToken", { path: "/api/auth" });
      res.clearCookie("token", { path: "/api/auth" });

      return sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
