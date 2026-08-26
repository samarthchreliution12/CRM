const axios = require("axios");

class WhatsAppService {
  static getBaseUrl() {
    return (process.env.CP_API_BASE_URL || "https://cp.chatterpillar.in/cp_api/public/cpapi").replace(/\/$/, "");
  }

  static getApiKey() {
    return process.env.CP_API_KEY || "";
  }

  /**
   * Check business WhatsApp account information in ChatterPillar.
   * @param {string|null} mobile - Optional mobile number
   */
  static async getWhatsAppAccountInfo(mobile = null) {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const headers = {
      "Content-Type": "text/plain",
      "CP-API-KEY": apiKey,
      "lang-code": "en",
      Accept: "application/json",
    };

    const payloadObj = mobile ? { mobile: String(mobile).trim() } : {};
    const rawBody = JSON.stringify(payloadObj);

    try {
      const response = await axios.post(`${baseUrl}/getWhatsAppAccountInfo`, rawBody, {
        headers,
        timeout: 15000,
      });

      const resData = response.data || {};
      const accountData = Array.isArray(resData.data) ? resData.data : [];

      return {
        message: resData.message || (accountData.length > 0 ? "WhatsApp business account verified." : "No matching WhatsApp business account found."),
        data: accountData,
      };
    } catch (err) {
      console.error("ChatterPillar getWhatsAppAccountInfo Error:", err.response ? err.response.data : err.message);
      const error = new Error("Failed to verify WhatsApp business account with provider.");
      error.statusCode = 502;
      error.details = err.response?.data || null;
      throw error;
    }
  }

  /**
   * Send a WhatsApp template message through ChatterPillar.
   */
  static async sendTemplateMessage({
    whatsapp_account_id = null,
    template_id,
    mobile,
    full_name,
    body_variable_values = null,
    header_variable_values = null,
    button_variable_values = null,
  }) {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const headers = {
      "Content-Type": "text/plain",
      "CP-API-KEY": apiKey,
      "lang-code": "en",
      Accept: "application/json",
    };

    if (whatsapp_account_id) {
      headers["WHATSAPP-ACCOUNT-ID"] = String(whatsapp_account_id);
    }

    const payloadObj = {
      message_type: "template",
      template_id: String(template_id).trim(),
      send_to_type: "individual",
      send_to: [
        {
          mobile: String(mobile).trim(),
          full_name: String(full_name).trim(),
        },
      ],
    };

    if (Array.isArray(body_variable_values)) {
      payloadObj.body_variable_values = body_variable_values;
    }

    if (Array.isArray(header_variable_values)) {
      payloadObj.header_variable_values = header_variable_values;
    }

    if (Array.isArray(button_variable_values)) {
      payloadObj.button_variable_values = button_variable_values;
    }

    const rawBody = JSON.stringify(payloadObj);

    try {
      const response = await axios.post(`${baseUrl}/sendMessage`, rawBody, {
        headers,
        timeout: 15000,
      });

      return response.data;
    } catch (err) {
      console.error("ChatterPillar sendMessage Error:", err.response ? err.response.data : err.message);
      const error = new Error("Failed to send WhatsApp template message through provider.");
      error.statusCode = 502;
      error.details = err.response?.data || null;
      throw error;
    }
  }

  /**
   * Fetch WhatsApp template list from ChatterPillar.
   */
  static async getTemplateList() {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const headers = {
      "CP-API-KEY": apiKey,
      "lang-code": "en",
      Accept: "application/json",
    };

    try {
      const response = await axios.get(`${baseUrl}/getTemplateList`, {
        headers,
        timeout: 15000,
      });

      return response.data;
    } catch (err) {
      console.error("ChatterPillar getTemplateList Error:", err.response ? err.response.data : err.message);
      const error = new Error("Failed to fetch WhatsApp template list from provider.");
      error.statusCode = 502;
      error.details = err.response?.data || null;
      throw error;
    }
  }
}

module.exports = WhatsAppService;
