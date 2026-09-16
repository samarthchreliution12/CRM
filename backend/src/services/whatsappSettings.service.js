const WhatsAppSettingsModel = require("../models/whatsappSettings.model");
const ChatterPillarService = require("./chatterpillar.service");

class WhatsAppSettingsService {
  /**
   * Get current WhatsApp connection configuration.
   */
  static async getSettings() {
    const settingRow = await WhatsAppSettingsModel.getSettings();
    return WhatsAppSettingsModel.formatResponse(settingRow);
  }

  /**
   * Create or store initial WhatsApp configuration.
   */
  static async createSettings({ cp_api_key, whatsapp_mobile, userId }) {
    if (!cp_api_key || !String(cp_api_key).trim()) {
      const err = new Error("CP API key is required.");
      err.statusCode = 400;
      throw err;
    }

    const trimmedApiKey = String(cp_api_key).trim();
    const trimmedMobile = whatsapp_mobile ? String(whatsapp_mobile).trim() : null;

    const existing = await WhatsAppSettingsModel.getSettings();
    let savedRow;

    if (existing) {
      savedRow = await WhatsAppSettingsModel.update(existing.id, {
        cp_api_key: trimmedApiKey,
        whatsapp_mobile: trimmedMobile,
      });
    } else {
      savedRow = await WhatsAppSettingsModel.create({
        provider: "ChatterPillar",
        cp_api_key: trimmedApiKey,
        whatsapp_mobile: trimmedMobile,
        is_connected: false,
        created_by: userId,
      });
    }

    return WhatsAppSettingsModel.formatResponse(savedRow);
  }

  /**
   * Update existing WhatsApp configuration.
   */
  static async updateSettings({ cp_api_key, whatsapp_mobile, userId }) {
    const existing = await WhatsAppSettingsModel.getSettings();
    if (!existing) {
      if (!cp_api_key || !String(cp_api_key).trim()) {
        const err = new Error("CP API key is required to configure WhatsApp settings.");
        err.statusCode = 400;
        throw err;
      }
      return this.createSettings({ cp_api_key, whatsapp_mobile, userId });
    }

    let updateApiKey = null;
    if (cp_api_key && String(cp_api_key).trim() !== "" && !String(cp_api_key).includes("...")) {
      updateApiKey = String(cp_api_key).trim();
    }

    const trimmedMobile = whatsapp_mobile !== undefined ? (whatsapp_mobile ? String(whatsapp_mobile).trim() : null) : undefined;

    const updatedRow = await WhatsAppSettingsModel.update(existing.id, {
      cp_api_key: updateApiKey,
      whatsapp_mobile: trimmedMobile,
    });

    return WhatsAppSettingsModel.formatResponse(updatedRow);
  }

  /**
   * Verify WhatsApp API connection with ChatterPillar.
   */
  static async testConnection({ userId = null }) {
    const settingRow = await WhatsAppSettingsModel.getSettings();

    if (!settingRow) {
      return {
        is_connected: false,
        provider: "ChatterPillar",
        whatsapp_mobile: null,
        whatsapp_account_id: null,
        message: "WhatsApp configuration required. Please save your CP API key first.",
        configured: false,
      };
    }

    const apiKey = WhatsAppSettingsModel.decryptApiKey(settingRow);
    if (!apiKey) {
      await WhatsAppSettingsModel.update(settingRow.id, { is_connected: false });
      return {
        is_connected: false,
        provider: "ChatterPillar",
        whatsapp_mobile: settingRow.whatsapp_mobile || null,
        whatsapp_account_id: settingRow.whatsapp_account_id || null,
        message: "No valid CP API key configured. Please update your API key.",
        configured: false,
      };
    }

    try {
      const verification = await ChatterPillarService.getWhatsAppAccountInfo({
        apiKey,
        mobile: settingRow.whatsapp_mobile,
      });

      let detectedAccountId = settingRow.whatsapp_account_id;
      let detectedMobile = settingRow.whatsapp_mobile;

      if (Array.isArray(verification.accounts) && verification.accounts.length > 0) {
        const firstAccount = verification.accounts[0];
        if (firstAccount.whatsapp_account_id) {
          detectedAccountId = String(firstAccount.whatsapp_account_id);
        }
        if (firstAccount.mobile) {
          detectedMobile = String(firstAccount.mobile);
        }
      }

      const updatedRow = await WhatsAppSettingsModel.update(settingRow.id, {
        is_connected: true,
        whatsapp_account_id: detectedAccountId,
        whatsapp_mobile: detectedMobile,
      });

      return {
        is_connected: true,
        provider: updatedRow.provider || "ChatterPillar",
        whatsapp_mobile: updatedRow.whatsapp_mobile,
        whatsapp_account_id: updatedRow.whatsapp_account_id,
        message: verification.message || "WhatsApp connection verified successfully.",
        last_checked_at: updatedRow.updated_at,
        configured: true,
      };
    } catch (err) {
      await WhatsAppSettingsModel.update(settingRow.id, { is_connected: false });

      const cleanErrorMsg = err.message || "Failed to verify connection with ChatterPillar.";
      const error = new Error(cleanErrorMsg);
      error.statusCode = err.statusCode || 502;
      error.is_connected = false;
      throw error;
    }
  }

  /**
   * Get public connection status without exposing sensitive credentials.
   */
  static async getStatus() {
    const settingRow = await WhatsAppSettingsModel.getSettings();

    if (!settingRow) {
      return {
        is_connected: false,
        provider: "ChatterPillar",
        whatsapp_mobile: null,
        whatsapp_account_id: null,
        last_checked_at: null,
      };
    }

    return {
      is_connected: Boolean(settingRow.is_connected),
      provider: settingRow.provider || "ChatterPillar",
      whatsapp_mobile: settingRow.whatsapp_mobile || null,
      whatsapp_account_id: settingRow.whatsapp_account_id || null,
      last_checked_at: settingRow.updated_at || null,
    };
  }
}

module.exports = WhatsAppSettingsService;
