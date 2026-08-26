const express = require("express");
const router = express.Router();
const WhatsAppController = require("../controllers/whatsapp.controller");
const { validateAccountInfoQuery, validateSendTemplate } = require("../validators/whatsapp.validator");
const { authenticate } = require("../middleware/auth.middleware");

// Require authenticated CRM user for all WhatsApp endpoints
router.use(authenticate);

router.post("/getWhatsAppAccountInfo", validateAccountInfoQuery, WhatsAppController.getWhatsAppAccountInfo);
router.post("/send-template", validateSendTemplate, WhatsAppController.sendTemplateMessage);
router.get("/templates", WhatsAppController.getTemplateList);

module.exports = router;
