const express = require("express");
const router = express.Router();
const ClientTypeController = require("../controllers/clientType.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", requirePermission("client_type.view"), ClientTypeController.listClientTypes);
router.get("/:id", requirePermission("client_type.view"), ClientTypeController.getClientType);
router.post("/", requirePermission("client_type.create"), ClientTypeController.createClientType);
router.patch("/:id", requirePermission("client_type.edit"), ClientTypeController.updateClientType);
router.delete("/:id", requirePermission("client_type.delete"), ClientTypeController.deleteClientType);

module.exports = router;
