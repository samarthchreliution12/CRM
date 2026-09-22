const express = require("express");
const AdminStaffController = require("../controllers/adminStaff.controller");
const {
  validateStaffIdParam,
  validateCreateStaffInput,
  validateUpdateStaffInput,
  validateUpdateStaffStatusInput,
} = require("../validators/adminStaff.validator");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

// Enforce JWT Authentication across all Staff Management endpoints
router.use(authenticate);

/**
 * @route   GET /api/admin/staff & GET /api/staff
 * @desc    Fetch all Staff users with search, status filtering, and pagination
 * @access  Private (Authenticated Users)
 */
router.get("/", AdminStaffController.listStaff);

/**
 * @route   GET /api/admin/staff/:id & GET /api/staff/:id
 * @desc    Fetch single Staff user details
 * @access  Private (Authenticated Users)
 */
router.get("/:id", validateStaffIdParam, AdminStaffController.getStaffById);

// Require Admin authorization for account management mutation operations (create, update, status toggle, delete, reset password, force logout)
router.use(requireRole("Admin"));

/**
 * @route   POST /api/admin/staff/logout-all
 * @desc    Admin forces logout for all other users in the system
 * @access  Private (Admin Only)
 */
router.post("/logout-all", AdminStaffController.logoutAll);

/**
 * @route   POST /api/admin/staff
 * @desc    Admin creates a new Staff user account
 * @access  Private (Admin Only)
 */
router.post("/", validateCreateStaffInput, AdminStaffController.createStaff);

/**
 * @route   PATCH /api/admin/staff/:id
 * @desc    Admin updates Staff user details (name, email, mobile)
 * @access  Private (Admin Only)
 */
router.patch("/:id", validateStaffIdParam, validateUpdateStaffInput, AdminStaffController.updateStaff);

/**
 * @route   PATCH /api/admin/staff/:id/status
 * @desc    Admin activates or deactivates a Staff user account
 * @access  Private (Admin Only)
 */
router.patch("/:id/status", validateStaffIdParam, validateUpdateStaffStatusInput, AdminStaffController.updateStaffStatus);

/**
 * @route   POST /api/admin/staff/:id/reset-password
 * @desc    Admin resets password for a Staff user account
 * @access  Private (Admin Only)
 */
router.post("/:id/reset-password", validateStaffIdParam, AdminStaffController.resetPassword);

/**
 * @route   POST /api/admin/staff/:id/force-logout
 * @desc    Admin forces logout on all devices for a Staff user account
 * @access  Private (Admin Only)
 */
router.post("/:id/force-logout", validateStaffIdParam, AdminStaffController.forceLogout);

/**
 * @route   DELETE /api/admin/staff/:id
 * @desc    Admin deletes a Staff user account
 * @access  Private (Admin Only)
 */
router.delete("/:id", validateStaffIdParam, AdminStaffController.deleteStaff);

module.exports = router;
