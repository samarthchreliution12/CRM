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
   * POST /api/whatsapp/templates/otp-select
   * Designate an approved template as the active Client Portal OTP Template.
   */
  static async selectOtpTemplate(req, res) {
    try {
      const { template_id } = req.body || {};
      const userId = req.user ? req.user.id : null;
      const result = await WhatsAppService.selectOtpTemplate({
        templateId: template_id,
        userId,
      });
      return sendSuccess(res, 200, result.message || "OTP template updated successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 400, error.message);
    }
  }

  /**
   * GET /api/whatsapp/birthday/preview/:clientId
   * Retrieve calculated client info, mapped template variables, and send validation.
   */
  static async getBirthdayPreview(req, res) {
    try {
      const { clientId } = req.params;
      const { reference_date } = req.query || {};
      const result = await WhatsAppService.getBirthdayPreview({
        clientId: parseInt(clientId, 10),
        referenceDate: reference_date || null,
      });
      return sendSuccess(res, 200, "Birthday preview loaded successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * POST /api/whatsapp/birthday/send
   * Explicit manual send of birthday greeting to a single client.
   */
  static async sendBirthdayWish(req, res) {
    try {
      const { client_id, reference_date } = req.body || {};
      const userId = req.user ? req.user.id : null;

      if (!client_id) {
        return sendError(res, 400, "client_id is required.");
      }

      const result = await WhatsAppService.sendBirthdayWish({
        clientId: parseInt(client_id, 10),
        userId,
        referenceDate: reference_date || null,
      });

      return sendSuccess(res, 200, result.message, result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * GET /api/whatsapp/messages/client/:clientId
   * Retrieve sent WhatsApp message history for a specific client.
   */
  static async getClientMessageHistory(req, res) {
    try {
      const { clientId } = req.params;
      const result = await WhatsAppService.getClientMessageHistory(parseInt(clientId, 10));
      return sendSuccess(res, 200, "Client WhatsApp message history retrieved.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
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

  /**
   * GET /api/whatsapp/manual-recipients/count
   * Returns count of eligible active clients for manual send.
   */
  static async getManualRecipientsCount(req, res) {
    try {
      const { send_to_type, client_type_id, client_ids } = req.query;
      let parsedClientIds = [];
      if (client_ids) {
        if (Array.isArray(client_ids)) {
          parsedClientIds = client_ids.map((id) => parseInt(id, 10)).filter(Boolean);
        } else if (typeof client_ids === "string") {
          parsedClientIds = client_ids
            .split(",")
            .map((id) => parseInt(id.trim(), 10))
            .filter(Boolean);
        }
      }

      const result = await WhatsAppService.getManualRecipientsCount({
        sendToType: send_to_type,
        clientTypeId: client_type_id ? parseInt(client_type_id, 10) : null,
        clientIds: parsedClientIds,
      });

      return sendSuccess(res, 200, "Recipients count fetched successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * POST /api/whatsapp/manual-send
   * Dispatches approved template to selected clients.
   */
  static async sendManualTemplateMessage(req, res) {
    try {
      const { template_id, send_to_type, client_type_id, client_ids, variable_mappings } =
        req.body || {};
      const userId = req.user ? req.user.id : null;

      const result = await WhatsAppService.sendManualTemplateMessage({
        templateId: template_id,
        sendToType: send_to_type,
        clientTypeId: client_type_id ? parseInt(client_type_id, 10) : null,
        clientIds: Array.isArray(client_ids) ? client_ids : [],
        variableMappings: variable_mappings || {},
        userId,
      });

      return sendSuccess(res, 200, result.message || "Manual WhatsApp send completed.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = WhatsAppController;

