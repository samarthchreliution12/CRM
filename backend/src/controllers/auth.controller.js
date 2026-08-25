const AuthService = require("../services/auth.service");
const { sendSuccess } = require("../utils/response.util");

class AuthController {
  /**
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email.trim(), password);
      return sendSuccess(res, 200, "Login successful", result);
    } catch (error) {
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
      res.clearCookie("token");
      return sendSuccess(res, 200, "Logout successful");
    } catch (error) {
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
      const result = await AuthService.forgotPassword(req.body.email);
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
}

module.exports = AuthController;
