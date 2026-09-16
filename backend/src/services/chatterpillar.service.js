const axios = require("axios");

class ChatterPillarService {
  /**
   * Get configured API Base URL.
   */
  static getBaseUrl() {
    const rawUrl =
      process.env.CHATTERPILLAR_BASE_URL ||
      process.env.CP_API_BASE_URL ||
      "https://cp.chatterpillar.in/cp_api/public/cpapi";
    return rawUrl.replace(/\/$/, "");
  }

  /**
   * Get configured request timeout in milliseconds.
   */
  static getTimeout() {
    const timeout = parseInt(process.env.CHATTERPILLAR_API_TIMEOUT, 10);
    return !isNaN(timeout) && timeout > 0 ? timeout : 15000;
  }

  /**
   * Build default ChatterPillar HTTP headers.
   */
  static buildHeaders(apiKey, whatsappAccountId = null) {
    const headers = {
      "Content-Type": "text/plain",
      "CP-API-KEY": apiKey ? String(apiKey).trim() : "",
      "lang-code": "en",
      Accept: "application/json",
    };

    if (whatsappAccountId) {
      headers["WHATSAPP-ACCOUNT-ID"] = String(whatsappAccountId).trim();
    }

    return headers;
  }

  /**
   * Verify WhatsApp account information with ChatterPillar.
   * Calls: POST /getWhatsAppAccountInfo
   * @param {Object} params
   * @param {string} params.apiKey - CP API key
   * @param {string} [params.mobile] - Optional mobile number
   */
  static async getWhatsAppAccountInfo({ apiKey, mobile = null }) {
    if (!apiKey || !String(apiKey).trim()) {
      const err = new Error("ChatterPillar API key is required.");
      err.statusCode = 400;
      throw err;
    }

    const baseUrl = this.getBaseUrl();
    const headers = this.buildHeaders(apiKey);
    const timeout = this.getTimeout();

    const payloadObj = mobile ? { mobile: String(mobile).trim() } : {};
    const rawBody = JSON.stringify(payloadObj);

    try {
      const response = await axios.post(`${baseUrl}/getWhatsAppAccountInfo`, rawBody, {
        headers,
        timeout,
      });

      const resData = response.data || {};
      const accountList = Array.isArray(resData.data) ? resData.data : [];

      return {
        success: true,
        message: resData.message || (accountList.length > 0 ? "WhatsApp business account verified successfully." : "No matching WhatsApp business account found."),
        accounts: accountList,
        raw: resData,
      };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to communicate with ChatterPillar API.";
      const error = new Error(`ChatterPillar connection verification failed: ${errorMsg}`);
      error.statusCode = err.response?.status || 502;
      error.details = err.response?.data || null;
      throw error;
    }
  }

  /**
   * Retrieve WhatsApp Template list from ChatterPillar.
   * Calls: POST /getTemplateList (or GET /getTemplateList)
   */
  static async getTemplateList({ apiKey, whatsappAccountId = null }) {
    if (!apiKey || !String(apiKey).trim()) {
      const err = new Error("ChatterPillar API key is required.");
      err.statusCode = 400;
      throw err;
    }

    const baseUrl = this.getBaseUrl();
    const headers = this.buildHeaders(apiKey, whatsappAccountId);
    const timeout = this.getTimeout();

    try {
      const response = await axios.post(`${baseUrl}/getTemplateList`, "{}", {
        headers,
        timeout,
      });

      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch template list.";
      const error = new Error(`ChatterPillar template list request failed: ${errorMsg}`);
      error.statusCode = err.response?.status || 502;
      throw error;
    }
  }

  /**
   * Send WhatsApp template message through ChatterPillar.
   * Calls: POST /sendMessage
   */
  static async sendTemplateMessage({
    apiKey,
    whatsappAccountId = null,
    templateId,
    mobile,
    fullName,
    bodyVariables = null,
    headerVariables = null,
    buttonVariables = null,
  }) {
    if (!apiKey || !String(apiKey).trim()) {
      const err = new Error("ChatterPillar API key is required.");
      err.statusCode = 400;
      throw err;
    }

    const baseUrl = this.getBaseUrl();
    const headers = this.buildHeaders(apiKey, whatsappAccountId);
    const timeout = this.getTimeout();

    const payloadObj = {
      message_type: "template",
      template_id: String(templateId).trim(),
      send_to_type: "individual",
      send_to: [
        {
          mobile: String(mobile).trim(),
          full_name: String(fullName).trim(),
        },
      ],
    };

    if (Array.isArray(bodyVariables)) payloadObj.body_variable_values = bodyVariables;
    if (Array.isArray(headerVariables)) payloadObj.header_variable_values = headerVariables;
    if (Array.isArray(buttonVariables)) payloadObj.button_variable_values = buttonVariables;

    const rawBody = JSON.stringify(payloadObj);

    try {
      const response = await axios.post(`${baseUrl}/sendMessage`, rawBody, {
        headers,
        timeout,
      });

      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to send message.";
      const error = new Error(`ChatterPillar send message failed: ${errorMsg}`);
      error.statusCode = err.response?.status || 502;
      throw error;
    }
  }

  /**
   * Media upload foundation method (for future media attachment support).
   * Calls: POST /uploadMedia
   */
  static async uploadMedia({ apiKey, whatsappAccountId = null, fileBuffer, mimeType, fileName }) {
    if (!apiKey || !String(apiKey).trim()) {
      const err = new Error("ChatterPillar API key is required.");
      err.statusCode = 400;
      throw err;
    }

    const error = new Error("Media upload feature architecture ready for future integration.");
    error.statusCode = 501;
    throw error;
  }
}

module.exports = ChatterPillarService;
