const WhatsAppService = require("../services/whatsapp.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class WhatsAppController {
  static async getWhatsAppAccountInfo(req, res) {
    try {
      const { mobile } = req.body || {};
      const result = await WhatsAppService.getWhatsAppAccountInfo(mobile);
      return sendSuccess(res, 200, result.message || "WhatsApp business account verified.", result.data);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  static async sendTemplateMessage(req, res) {
    try {
      const {
        whatsapp_account_id,
        template_id,
        mobile,
        full_name,
        body_variable_values,
        header_variable_values,
        button_variable_values,
      } = req.body || {};

      const result = await WhatsAppService.sendTemplateMessage({
        whatsapp_account_id,
        template_id,
        mobile,
        full_name,
        body_variable_values,
        header_variable_values,
        button_variable_values,
      });

      return sendSuccess(res, 200, "WhatsApp template message sent successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  static async getTemplateList(req, res) {
    try {
      const result = await WhatsAppService.getTemplateList();
      return sendSuccess(res, 200, "WhatsApp template list retrieved successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = WhatsAppController;
