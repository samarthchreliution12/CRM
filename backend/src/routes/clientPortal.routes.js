const express = require("express");
const multer = require("multer");
const router = express.Router();

const ClientPortalController = require("../controllers/clientPortal.controller");
const { clientAuthMiddleware } = require("../middleware/clientAuth.middleware");
const { clientLoginLimiter } = require("../middleware/rateLimiter.middleware");
const {
  validateClientLogin,
  validateDocumentUpload,
  validateDocumentIdParam,
} = require("../validators/clientPortal.validator");

// Configure Multer with memory storage & 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// 1. Client Authentication
router.post("/login", clientLoginLimiter, validateClientLogin, ClientPortalController.login);
router.post("/auth/login", clientLoginLimiter, validateClientLogin, ClientPortalController.login);

router.post("/logout", clientAuthMiddleware, ClientPortalController.logout);
router.post("/auth/logout", clientAuthMiddleware, ClientPortalController.logout);

// 2. Client Profile
router.get("/profile", clientAuthMiddleware, ClientPortalController.getProfile);

// 3. Client Documents
router.get("/documents", clientAuthMiddleware, ClientPortalController.getDocuments);

// 4. Secure Document Upload
router.post(
  "/documents/:documentId/upload",
  clientAuthMiddleware,
  upload.single("file"),
  validateDocumentUpload,
  ClientPortalController.uploadDocument
);

router.post(
  "/documents/upload",
  clientAuthMiddleware,
  upload.single("file"),
  validateDocumentUpload,
  ClientPortalController.uploadDocument
);

// 5. Secure Document Access / Download
router.get(
  "/documents/:documentId",
  clientAuthMiddleware,
  validateDocumentIdParam,
  ClientPortalController.getDocument
);

module.exports = router;
