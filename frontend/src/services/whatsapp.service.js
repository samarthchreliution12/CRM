import apiFetch from "./apiClient";

class WhatsAppService {
  static async request(endpoint, options = {}, token = null) {
    const headers = { ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return apiFetch(endpoint, {
      ...options,
      headers,
    });
  }

  /**
   * Fetch current WhatsApp settings and masked API key.
   */
  static async getSettings(token) {
    return this.request("/whatsapp/settings", { method: "GET" }, token);
  }

  /**
   * Save initial WhatsApp settings.
   */
  static async createSettings(data, token) {
    return this.request(
      "/whatsapp/settings",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Update existing WhatsApp settings.
   */
  static async updateSettings(data, token) {
    return this.request(
      "/whatsapp/settings",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Test WhatsApp API connection with ChatterPillar.
   */
  static async testConnection(token) {
    return this.request(
      "/whatsapp/settings/test-connection",
      { method: "POST" },
      token
    );
  }

  /**
   * Disconnect WhatsApp integration.
   */
  static async disconnect(token) {
    return this.request(
      "/whatsapp/settings/disconnect",
      { method: "POST" },
      token
    );
  }

  /**
   * Fetch light WhatsApp connection status.
   */
  static async getStatus(token) {
    return this.request("/whatsapp/settings/status", { method: "GET" }, token);
  }

  /**
   * Fetch saved templates with search, category, status, and pagination.
   */
  static async getTemplates(
    {
      search = "",
      category = "",
      status = "",
      language = "",
      page = 1,
      limit = 50,
    } = {},
    token
  ) {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append("search", search.trim());
    if (category && category !== "all" && category !== "ALL")
      params.append("category", category.trim());
    if (status && status !== "all" && status !== "ALL")
      params.append("status", status.trim());
    if (language && language !== "all" && language !== "ALL")
      params.append("language", language.trim());
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/whatsapp/templates${queryString}`, { method: "GET" }, token);
  }

  /**
   * Refresh / Synchronize templates directly from ChatterPillar API.
   */
  static async syncTemplates(token) {
    return this.request(
      "/whatsapp/templates/sync",
      { method: "POST" },
      token
    );
  }

  /**
   * Set an approved template as the active Birthday Template.
   */
  static async selectBirthdayTemplate(templateId, token) {
    return this.request(
      "/whatsapp/templates/birthday-select",
      {
        method: "POST",
        body: JSON.stringify({ template_id: templateId }),
      },
      token
    );
  }

  /**
   * Set an approved template as the active Client Portal OTP Template.
   */
  static async selectOtpTemplate(templateId, token) {
    return this.request(
      "/whatsapp/templates/otp-select",
      {
        method: "POST",
        body: JSON.stringify({ template_id: templateId }),
      },
      token
    );
  }

  /**
   * Load birthday preview for a specific client (variables, calculated age, validation).
   */
  static async getBirthdayPreview(clientId, token, referenceDate = null) {
    const query = referenceDate ? `?reference_date=${encodeURIComponent(referenceDate)}` : "";
    return this.request(`/whatsapp/birthday/preview/${clientId}${query}`, { method: "GET" }, token);
  }

  /**
   * Explicit manual send of birthday wish to a client.
   */
  static async sendBirthdayWish(clientId, token, referenceDate = null) {
    return this.request(
      "/whatsapp/birthday/send",
      {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          reference_date: referenceDate || undefined,
        }),
      },
      token
    );
  }

  /**
   * Fetch WhatsApp message history for a specific client.
   */
  static async getClientMessageHistory(clientId, token) {
    return this.request(`/whatsapp/messages/client/${clientId}`, { method: "GET" }, token);
  }

  /**
   * Send a test WhatsApp message using a selected template.
   */
  static async sendTestMessage(data, token) {
    return this.request(
      "/whatsapp/send-test",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }
}

export default WhatsAppService;
