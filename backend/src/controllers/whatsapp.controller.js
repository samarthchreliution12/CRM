const WhatsAppService = require("../services/whatsapp.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class WhatsAppController {
  /**
   * POST /api/whatsapp/getWhatsAppAccountInfo
   * Check account info with ChatterPillar.
   */
  static async getWhatsAppAccountInfo(req, res) {
    try {
      const { mobile } = req.body || {};
      const result = await WhatsAppService.getWhatsAppAccountInfo(mobile);
      return sendSuccess(res, 200, result.message || "WhatsApp business account verified.", result.accounts || result.data);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * GET /api/whatsapp/templates
   * Get saved templates from CRM database with filtering and pagination.
   */
  static async getTemplateList(req, res) {
    try {
      const { search, category, status, language, page, limit } = req.query || {};
      const result = await WhatsAppService.getTemplateList({
        search,
        category,
        status,
        language,
        page,
        limit,
      });
      return sendSuccess(res, 200, "WhatsApp templates retrieved successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * POST /api/whatsapp/templates/sync
   * Fetch templates from ChatterPillar API and upsert into CRM database.
   */
  static async syncTemplates(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await WhatsAppService.syncTemplates({ userId });
      return sendSuccess(res, 200, result.message || "WhatsApp templates synced successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 502, error.message);
    }
  }

  /**
   * POST /api/whatsapp/templates/birthday-select
   * Designate an approved template as the active Birthday Template.
   */
  static async selectBirthdayTemplate(req, res) {
    try {
      const { template_id } = req.body || {};
      const userId = req.user ? req.user.id : null;
      const result = await WhatsAppService.selectBirthdayTemplate({
        templateId: template_id,
        userId,
      });
      return sendSuccess(res, 200, result.message || "Birthday template updated successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 400, error.message);
    }
  }

  /**
   * POST /api/whatsapp/send-test
   * Send a test WhatsApp message using a selected template.
   */
  static async sendTestMessage(req, res) {
    try {
      const {
        template_id,
        mobile,
        full_name,
        body_variable_values,
        header_variable_values,
        button_variable_values,
      } = req.body || {};
      const userId = req.user ? req.user.id : null;

      const result = await WhatsAppService.sendTestMessage({
        template_id,
        mobile,
        full_name,
        body_variable_values,
        header_variable_values,
        button_variable_values,
        userId,
      });

      return sendSuccess(res, 200, result.message || "Test WhatsApp message sent successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * POST /api/whatsapp/send-template
   * Send a WhatsApp template message (backward compatible).
   */
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
}

module.exports = WhatsAppController;
