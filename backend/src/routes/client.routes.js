const express = require("express");
const router = express.Router();
const ClientController = require("../controllers/client.controller");
const clientFamilyMemberRoutes = require("./clientFamilyMember.routes");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.use(authenticate);

// Mount family member sub-routes under /api/clients/:clientId/family-members
router.use("/:clientId/family-members", clientFamilyMemberRoutes);

router.get("/", requirePermission("client.view"), ClientController.listClients);
router.get("/:id", requirePermission("client.view"), ClientController.getClient);
router.post("/", requirePermission("client.create"), ClientController.createClient);
router.patch("/:id", requirePermission("client.edit"), ClientController.updateClient);
router.patch("/:id/status", requirePermission("client.edit"), ClientController.updateClientStatus);
router.delete("/:id", requirePermission("client.delete"), ClientController.deleteClient);

module.exports = router;
