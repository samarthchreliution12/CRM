const express = require("express");
const router = express.Router();
const ClientServiceController = require("../controllers/clientService.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", requirePermission("client_service.view"), ClientServiceController.listClientServices);
router.get("/:id", requirePermission("client_service.view"), ClientServiceController.getClientService);
router.post("/", requirePermission("client_service.create"), ClientServiceController.createClientService);
router.patch("/:id", requirePermission("client_service.edit"), ClientServiceController.updateClientService);
router.delete("/:id", requirePermission("client_service.delete"), ClientServiceController.deleteClientService);

module.exports = router;
