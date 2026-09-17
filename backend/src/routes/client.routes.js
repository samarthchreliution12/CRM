const express = require("express");
const router = express.Router();
const ClientController = require("../controllers/client.controller");
const clientFamilyMemberRoutes = require("./clientFamilyMember.routes");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.use(authenticate);

// Mount family member sub-routes under /api/clients/:clientId/family-members
router.use("/:clientId/family-members", clientFamilyMemberRoutes);

router.get("/", requirePermission("client.view"), ClientController.listClients);
router.get("/search", requirePermission("client.view"), ClientController.searchClients);
router.post("/export", requirePermission("client.view"), ClientController.exportClients);
router.post("/import/validate", requirePermission("client.create"), upload.single("file"), ClientController.validateImport);
router.post("/import", requirePermission("client.create"), upload.single("file"), ClientController.importClients);
router.get("/:id", requirePermission("client.view"), ClientController.getClient);
router.post("/", requirePermission("client.create"), ClientController.createClient);
router.patch("/:id", requirePermission("client.edit"), ClientController.updateClient);
router.patch("/:id/category", requirePermission("client.edit"), ClientController.updateClientCategory);
router.patch("/:id/status", requirePermission("client.edit"), ClientController.updateClientStatus);
router.delete("/:id", requirePermission("client.delete"), ClientController.deleteClient);

module.exports = router;

