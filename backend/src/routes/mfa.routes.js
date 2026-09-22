const express = require("express");
const MfaController = require("../controllers/mfa.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @route   POST /api/auth/mfa/login-verify
 * @desc    Verify TOTP passcode during login flow
 * @access  Public
 */
router.post("/login-verify", MfaController.verifyLoginMfa);

/**
 * Enforce authentication for setup, activation, and status endpoints
 */
router.use(authenticate);

/**
 * @route   GET /api/auth/mfa/status
 * @desc    Check MFA status for currently authenticated user
 * @access  Private
 */
router.get("/status", MfaController.getMfaStatus);

/**
 * @route   GET /api/auth/mfa/setup
 * @desc    Generate secret and QR code for Authenticator app
 * @access  Private
 */
router.get("/setup", MfaController.setupMfa);

/**
 * @route   POST /api/auth/mfa/verify-step1
 * @desc    Verify the first passcode from authenticator app
 * @access  Private
 */
router.post("/verify-step1", MfaController.verifyStep1);

/**
 * @route   POST /api/auth/mfa/activate
 * @desc    Verify second rotated passcode and activate MFA
 * @access  Private
 */
router.post("/activate", MfaController.activateMfa);

/**
 * @route   POST /api/auth/mfa/disable
 * @desc    Disable MFA for current user
 * @access  Private
 */
router.post("/disable", MfaController.disableMfa);

module.exports = router;
