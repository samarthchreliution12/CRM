const express = require("express");
const router = express.Router();
const AdminAuditLogController = require("../controllers/adminAuditLog.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

router.use(authenticate);

// GET /api/admin/audit-logs (Admin only)
router.get("/", requireRole("Admin"), AdminAuditLogController.getAuditLogs);

module.exports = router;
