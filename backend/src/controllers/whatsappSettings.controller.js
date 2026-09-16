const WhatsAppSettingsService = require("../services/whatsappSettings.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class WhatsAppSettingsController {
  /**
   * GET /api/whatsapp/settings
   * Retrieve current WhatsApp configuration with masked credentials.
   */
  static async getSettings(req, res) {
    try {
      const data = await WhatsAppSettingsService.getSettings();
      return sendSuccess(res, 200, "WhatsApp settings retrieved successfully.", data);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * POST /api/whatsapp/settings
   * Create or store initial WhatsApp configuration.
   */
  static async createSettings(req, res) {
    try {
      const { cp_api_key, whatsapp_mobile } = req.body || {};
      const userId = req.user ? req.user.id : null;

      const data = await WhatsAppSettingsService.createSettings({
        cp_api_key,
        whatsapp_mobile,
        userId,
      });

      return sendSuccess(res, 201, "WhatsApp configuration stored successfully.", data);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * PUT /api/whatsapp/settings
   * Update existing WhatsApp configuration.
   */
  static async updateSettings(req, res) {
    try {
      const { cp_api_key, whatsapp_mobile } = req.body || {};
      const userId = req.user ? req.user.id : null;

      const data = await WhatsAppSettingsService.updateSettings({
        cp_api_key,
        whatsapp_mobile,
        userId,
      });

      return sendSuccess(res, 200, "WhatsApp configuration updated successfully.", data);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * POST /api/whatsapp/settings/test-connection
   * Test and verify connection with ChatterPillar API.
   */
  static async testConnection(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const data = await WhatsAppSettingsService.testConnection({ userId });

      const status = data.is_connected ? 200 : 400;
      return sendSuccess(res, status, data.message || "WhatsApp connection verified.", data);
    } catch (error) {
      return sendError(res, error.statusCode || 502, error.message);
    }
  }

  /**
   * GET /api/whatsapp/settings/status
   * Retrieve current WhatsApp connection status without sensitive credentials.
   */
  static async getStatus(req, res) {
    try {
      const data = await WhatsAppSettingsService.getStatus();
      return sendSuccess(res, 200, "WhatsApp connection status retrieved successfully.", data);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = WhatsAppSettingsController;
