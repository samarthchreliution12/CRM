const express = require("express");
const SystemSettingController = require("../controllers/systemSetting.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

// Require Authentication & Admin Role for System Settings
router.use(authenticate);
router.use(requireRole("Admin"));

/**
 * @route   GET /api/admin/settings
 * @desc    Get all system security settings
 * @access  Private (Admin Only)
 */
router.get("/", SystemSettingController.getSettings);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update system security settings (timeout, lockout attempts, etc.)
 * @access  Private (Admin Only)
 */
router.put("/", SystemSettingController.updateSettings);

module.exports = router;
