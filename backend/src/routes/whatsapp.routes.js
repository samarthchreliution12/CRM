const express = require("express");
const router = express.Router();
const WhatsAppController = require("../controllers/whatsapp.controller");
const WhatsAppSettingsController = require("../controllers/whatsappSettings.controller");
const {
  validateAccountInfoQuery,
  validateSendTemplate,
  validateSelectBirthdayTemplate,
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

router.post(
  "/settings/disconnect",
  requirePermission(["whatsapp.update", "whatsapp.edit"]),
  WhatsAppSettingsController.disconnect
);

router.get(
  "/settings/status",
  requirePermission(["whatsapp.view", "whatsapp.read", "whatsapp.edit"]),
  WhatsAppSettingsController.getStatus
);

// 2. WhatsApp Templates Endpoints
router.get(
  "/templates",
  requirePermission(["whatsapp.view", "whatsapp.read", "whatsapp.edit"]),
  WhatsAppController.getTemplateList
);

router.post(
  "/templates/sync",
  requirePermission(["whatsapp.template.sync", "whatsapp.update", "whatsapp.edit"]),
  WhatsAppController.syncTemplates
);

router.post(
  "/templates/birthday-select",
  requirePermission(["whatsapp.template.select", "whatsapp.update", "whatsapp.edit"]),
  validateSelectBirthdayTemplate,
  WhatsAppController.selectBirthdayTemplate
);

// 3. Birthday Greeting Flow Endpoints
router.get(
  "/birthday/preview/:clientId",
  requirePermission(["whatsapp.view", "whatsapp.send", "client.view", "client.read", "dashboard.view"]),
  WhatsAppController.getBirthdayPreview
);

router.post(
  "/birthday/send",
  requirePermission(["whatsapp.send", "whatsapp.edit", "whatsapp.update"]),
  WhatsAppController.sendBirthdayWish
);

// 4. Client Message History Endpoint
router.get(
  "/messages/client/:clientId",
  requirePermission(["whatsapp.view", "whatsapp.read", "client.view", "client.read"]),
  WhatsAppController.getClientMessageHistory
);

// 5. WhatsApp Test & Account Info Endpoints
router.post(
  "/send-test",
  requirePermission(["whatsapp.send", "whatsapp.edit", "whatsapp.update"]),
  validateSendTemplate,
  WhatsAppController.sendTestMessage
);

router.post(
  "/send-template",
  requirePermission(["whatsapp.send", "whatsapp.edit", "whatsapp.update"]),
  validateSendTemplate,
  WhatsAppController.sendTemplateMessage
);

router.post(
  "/getWhatsAppAccountInfo",
  requirePermission(["whatsapp.view", "whatsapp.read", "whatsapp.edit"]),
  validateAccountInfoQuery,
  WhatsAppController.getWhatsAppAccountInfo
);

module.exports = router;
