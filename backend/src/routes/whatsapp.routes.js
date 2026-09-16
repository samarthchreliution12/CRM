const express = require("express");
const router = express.Router();
const WhatsAppController = require("../controllers/whatsapp.controller");
const WhatsAppSettingsController = require("../controllers/whatsappSettings.controller");
const {
  validateAccountInfoQuery,
  validateSendTemplate,
  validateCreateSettings,
  validateUpdateSettings,
} = require("../validators/whatsapp.validator");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

// Require authenticated CRM user for all WhatsApp endpoints
router.use(authenticate);

// 1. WhatsApp Settings Endpoints
router.get(
  "/settings",
  requirePermission(["whatsapp.view", "whatsapp.read", "whatsapp.edit"]),
  WhatsAppSettingsController.getSettings
);

router.post(
  "/settings",
  requirePermission(["whatsapp.create", "whatsapp.edit", "whatsapp.update"]),
  validateCreateSettings,
  WhatsAppSettingsController.createSettings
);

router.put(
  "/settings",
  requirePermission(["whatsapp.update", "whatsapp.edit"]),
  validateUpdateSettings,
  WhatsAppSettingsController.updateSettings
);

router.post(
  "/settings/test-connection",
  requirePermission(["whatsapp.update", "whatsapp.edit", "whatsapp.view"]),
  WhatsAppSettingsController.testConnection
);

router.get(
  "/settings/status",
  requirePermission(["whatsapp.view", "whatsapp.read", "whatsapp.edit"]),
  WhatsAppSettingsController.getStatus
);

// 2. Existing WhatsApp Messaging & Template Endpoints
router.post("/getWhatsAppAccountInfo", validateAccountInfoQuery, WhatsAppController.getWhatsAppAccountInfo);
router.post("/send-template", validateSendTemplate, WhatsAppController.sendTemplateMessage);
router.get("/templates", WhatsAppController.getTemplateList);

module.exports = router;
