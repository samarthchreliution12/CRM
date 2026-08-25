const express = require("express");
const router = express.Router();
const RolePermissionController = require("../controllers/rolePermission.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

// All role-permission routes are Admin only
router.use(authenticate, requireRole("Admin"));

router.get("/", RolePermissionController.getRoles);
router.get("/:roleId/permissions", RolePermissionController.getRolePermissions);
router.put("/:roleId/permissions", RolePermissionController.replaceRolePermissions);

module.exports = router;
