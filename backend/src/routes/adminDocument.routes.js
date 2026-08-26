const express = require("express");
const router = express.Router();
const DocumentController = require("../controllers/document.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

// Require JWT authentication for all admin document routes
router.use(authenticate);

// 1. Get All Client Documents Across Clients (Admin / Staff Document Management)
router.get(
  "/",
  requirePermission("document.view"),
  DocumentController.listAllAdminDocuments
);

// 2. Approve a Pending Document
router.patch(
  "/:documentId/approve",
  requirePermission("document.verify"),
  DocumentController.approveDocument
);

// 3. Reject a Pending Document
router.patch(
  "/:documentId/reject",
  requirePermission("document.verify"),
  DocumentController.rejectDocument
);

module.exports = router;
