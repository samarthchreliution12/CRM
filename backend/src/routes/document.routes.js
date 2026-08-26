const express = require("express");
const multer = require("multer");
const router = express.Router({ mergeParams: true });
const DocumentController = require("../controllers/document.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

// Configure Multer with Memory Storage & 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Require JWT authentication for all document routes
router.use(authenticate);

// 1. List Client Documents
router.get(
  "/",
  requirePermission("document.view"),
  DocumentController.listClientDocuments
);

// 2. View / Download Single Document
router.get(
  "/:documentId",
  requirePermission("document.view"),
  DocumentController.getDocument
);

// 3. Upload New Client Document
router.post(
  "/",
  requirePermission("document.create"),
  upload.single("file"),
  DocumentController.uploadDocument
);

// 4. Update / Replace Client Document
router.patch(
  "/:documentId",
  requirePermission(["document.update", "document.edit"]),
  upload.single("file"),
  DocumentController.updateDocument
);

// 5. Explicit Replacement Endpoint (PATCH /api/clients/:clientId/documents/:documentId/replace)
router.patch(
  "/:documentId/replace",
  requirePermission(["document.update", "document.edit"]),
  upload.single("file"),
  DocumentController.updateDocument
);

// 6. Delete Client Document
router.delete(
  "/:documentId",
  requirePermission("document.delete"),
  DocumentController.deleteDocument
);

module.exports = router;
