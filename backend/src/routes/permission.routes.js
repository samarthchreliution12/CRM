const express = require("express");
const router = express.Router();
const PermissionController = require("../controllers/permission.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

// All permission routes are Admin only
router.use(authenticate, requireRole("Admin"));

router.get("/", PermissionController.listPermissions);
router.get("/:id", PermissionController.getPermission);
router.post("/", PermissionController.createPermission);
router.patch("/:id", PermissionController.updatePermission);
router.delete("/:id", PermissionController.deletePermission);

module.exports = router;
