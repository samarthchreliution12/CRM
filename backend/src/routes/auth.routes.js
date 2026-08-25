const express = require("express");
const AuthController = require("../controllers/auth.controller");
const {
  validateLoginInput,
  validateSignupInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateUpdateProfileInput,
} = require("../validators/auth.validator");
const { authenticate } = require("../middleware/auth.middleware");
const { checkSignupEnabled } = require("../middleware/signup.middleware");

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
router.post("/login", validateLoginInput, AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile & permissions
 * @access  Private
 */
router.get("/me", authenticate, AuthController.getMe);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update current authenticated user profile (name, email, mobile)
 * @access  Private
 */
router.patch("/profile", authenticate, validateUpdateProfileInput, AuthController.updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Stateless logout
 * @access  Private
 */
router.post("/logout", authenticate, AuthController.logout);

/**
 * @route   POST /api/auth/signup
 * @desc    Future signup / account creation endpoint (Disabled by default)
 * @access  Disabled publicly / Admin only when restricted
 */
router.post("/signup", checkSignupEnabled, validateSignupInput, AuthController.signup);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset link & token
 * @access  Public
 */
router.post("/forgot-password", validateForgotPasswordInput, AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using valid reset token & matching new passwords
 * @access  Public
 */
router.post("/reset-password", validateResetPasswordInput, AuthController.resetPassword);

module.exports = router;
