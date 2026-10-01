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
const { authenticate, requirePermission, requireRole } = require("../middleware/auth.middleware");

// Require authenticated CRM user for all WhatsApp endpoints
router.use(authenticate);

// 1. WhatsApp Settings Endpoints - One-time setup: Mutating actions restricted strictly to Admin
router.get(
  "/settings",
  requirePermission(["whatsapp.view", "whatsapp.read", "whatsapp.edit", "whatsapp_config.view", "whatsapp_config.edit"]),
  WhatsAppSettingsController.getSettings
);

router.post(
  "/settings",
  requireRole("Admin"),
  validateCreateSettings,
  WhatsAppSettingsController.createSettings
);

router.put(
  "/settings",
  requireRole("Admin"),
  validateUpdateSettings,
  WhatsAppSettingsController.updateSettings
);

router.post(
  "/settings/test-connection",
  requireRole("Admin"),
  WhatsAppSettingsController.testConnection
);

router.post(
  "/settings/disconnect",
  requireRole("Admin"),
  WhatsAppSettingsController.disconnect
);

router.get(
  "/settings/status",
  requireRole("Admin"),
  WhatsAppSettingsController.getStatus
);

// 2. WhatsApp Templates Endpoints
router.get(
  "/templates",
  requirePermission(["whatsapp_template.view", "whatsapp_template.edit", "whatsapp.view", "whatsapp.read", "whatsapp_config.view", "whatsapp.edit"]),
  WhatsAppController.getTemplateList
);

router.post(
  "/templates/sync",
  requirePermission(["whatsapp_template.edit", "whatsapp.template.sync", "whatsapp.update", "whatsapp.edit"]),
  WhatsAppController.syncTemplates
);

router.post(
  "/templates/birthday-select",
  requirePermission(["whatsapp_config.edit", "whatsapp.template.select", "whatsapp.update", "whatsapp.edit"]),
  validateSelectBirthdayTemplate,
  WhatsAppController.selectBirthdayTemplate
);

router.post(
  "/templates/otp-select",
  requirePermission(["whatsapp_config.edit", "whatsapp.template.select", "whatsapp.update", "whatsapp.edit"]),
  validateSelectBirthdayTemplate,
  WhatsAppController.selectOtpTemplate
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

// 6. Manual Send Endpoints
router.get(
  "/manual-recipients/count",
  requirePermission(["whatsapp_config.view", "whatsapp_config.edit", "whatsapp.view", "whatsapp.read", "whatsapp.send"]),
  WhatsAppController.getManualRecipientsCount
);

router.post(
  "/manual-send",
  requirePermission(["whatsapp_config.edit", "whatsapp.send", "whatsapp.edit", "whatsapp.update"]),
  WhatsAppController.sendManualTemplateMessage
);

module.exports = router;

