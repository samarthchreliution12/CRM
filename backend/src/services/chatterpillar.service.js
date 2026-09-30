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
      let accountList = [];

      if (Array.isArray(resData.data)) {
        accountList = resData.data;
      } else if (Array.isArray(resData)) {
        accountList = resData;
      } else if (resData.data && typeof resData.data === "object") {
        accountList = [resData.data];
      }

      return {
        success: true,
        message:
          resData.message ||
          (accountList.length > 0
            ? "WhatsApp business account verified successfully."
            : "No matching WhatsApp business account found."),
        accounts: accountList,
        raw: resData,
      };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to communicate with ChatterPillar API.";
      const error = new Error(`ChatterPillar connection verification failed: ${errorMsg}`);
      error.statusCode = err.response?.status || 502;
      error.details = err.response?.data || null;
      throw error;
    }
  }

  /**
   * Retrieve WhatsApp Template list from ChatterPillar.
   * Calls: POST /getTemplateList
   */
  static async getTemplateList({ apiKey, whatsappAccountId = null, filters = {} }) {
    if (!apiKey || !String(apiKey).trim()) {
      const err = new Error("ChatterPillar API key is required.");
      err.statusCode = 400;
      throw err;
    }

    const baseUrl = this.getBaseUrl();
    const headers = this.buildHeaders(apiKey, whatsappAccountId);
    const timeout = this.getTimeout();
    const defaultPayload = {
      filters: {
        status: "A",
        template_status: "",
        ...(filters.filters || {}),
      },
      syncronize: false,
      pagination: "true",
      ...filters,
    };
    const rawBody = JSON.stringify(defaultPayload);

    try {
      let response;
      try {
        response = await axios.post(`${baseUrl}/getTemplateList`, rawBody, {
          headers,
          timeout,
        });
      } catch (postErr) {
        // Fallback to GET if POST is not accepted
        if (postErr.response && postErr.response.status === 405) {
          response = await axios.get(`${baseUrl}/getTemplateList`, {
            headers,
            timeout,
          });
        } else {
          throw postErr;
        }
      }

      const resData = response.data || {};
      let templates = [];

      if (resData.data && Array.isArray(resData.data.template)) {
        templates = resData.data.template;
      } else if (resData.data && Array.isArray(resData.data.templates)) {
        templates = resData.data.templates;
      } else if (Array.isArray(resData.data)) {
        templates = resData.data;
      } else if (Array.isArray(resData.templates)) {
        templates = resData.templates;
      } else if (Array.isArray(resData.template)) {
        templates = resData.template;
      } else if (Array.isArray(resData)) {
        templates = resData;
      }

      return {
        success: true,
        message: resData.message || "Templates fetched successfully.",
        templates,
        raw: resData,
      };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to fetch template list.";
      const error = new Error(`ChatterPillar template list request failed: ${errorMsg}`);
      error.statusCode = err.response?.status || 502;
      error.details = err.response?.data || null;
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

    // Standardize recipient mobile with country code (ChatterPillar requires e.g. 918888888888)
    let cleanMobile = String(mobile).trim().replace(/[\s\-()+]/g, "");
    if (/^[6-9]\d{9}$/.test(cleanMobile)) {
      cleanMobile = `91${cleanMobile}`;
    }

    const payloadObj = {
      message_type: "template",
      template_id: String(templateId).trim(),
      send_to_type: "individual",
      send_to: [
        {
          mobile: cleanMobile,
          full_name: String(fullName).trim(),
        },
      ],
    };

    if (Array.isArray(bodyVariables) && bodyVariables.length > 0) {
      payloadObj.body_variable_values = bodyVariables.map((v) => String(v ?? "").trim());
    }
    if (Array.isArray(headerVariables) && headerVariables.length > 0) {
      payloadObj.header_variable_values = headerVariables.map((v) => String(v ?? "").trim());
    }
    if (Array.isArray(buttonVariables) && buttonVariables.length > 0) {
      payloadObj.button_variable_values = buttonVariables.map((v) => String(v ?? "").trim());
    }

    const rawBody = JSON.stringify(payloadObj);

    try {
      const response = await axios.post(`${baseUrl}/sendMessage`, rawBody, {
        headers,
        timeout,
      });

      const resData = response.data || {};

      // Validate response for logical error codes even on HTTP 200
      if (
        (resData.code && parseInt(resData.code, 10) >= 400) ||
        resData.status === false ||
        resData.status === "failed" ||
        resData.error
      ) {
        const errorMsg =
          resData.message ||
          (resData.errors && resData.errors[0]?.title) ||
          (resData.errors && resData.errors[0]?.message) ||
          resData.error ||
          "ChatterPillar rejected the message request.";
        const error = new Error(`ChatterPillar send message failed: ${errorMsg}`);
        error.statusCode = 400;
        error.details = resData;
        throw error;
      }

      return resData || { success: true, message: "Template message dispatched." };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors && err.response.data.errors[0]?.title) ||
        (err.response?.data?.errors && err.response.data.errors[0]?.message) ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        "Failed to send template message.";
      const error = new Error(`ChatterPillar send message failed: ${errorMsg}`);
      error.statusCode = err.response?.status || err.statusCode || 502;
      error.details = err.response?.data || err.details || null;
      throw error;
    }
  }
}

module.exports = ChatterPillarService;
