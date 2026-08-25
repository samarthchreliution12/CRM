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

// Enforce JWT Authentication and Admin Authorization across all Staff Management endpoints
router.use(authenticate);
router.use(requireRole("Admin"));

/**
 * @route   GET /api/admin/staff
 * @desc    Fetch all Staff users with search, status filtering, and pagination
 * @access  Private (Admin Only)
 */
router.get("/", AdminStaffController.listStaff);

/**
 * @route   GET /api/admin/staff/:id
 * @desc    Fetch single Staff user details
 * @access  Private (Admin Only)
 */
router.get("/:id", validateStaffIdParam, AdminStaffController.getStaffById);

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
 * @route   DELETE /api/admin/staff/:id
 * @desc    Admin deletes a Staff user account
 * @access  Private (Admin Only)
 */
router.delete("/:id", validateStaffIdParam, AdminStaffController.deleteStaff);

module.exports = router;
