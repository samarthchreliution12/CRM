const WhatsAppSettingsModel = require("../models/whatsappSettings.model");
const WhatsAppTemplateModel = require("../models/whatsappTemplate.model");
const ChatterPillarService = require("./chatterpillar.service");

class WhatsAppService {
  /**
   * Helper to retrieve active decrypted credentials from database settings.
   */
  static async getDecryptedCredentials() {
    const settingRow = await WhatsAppSettingsModel.getSettings();
    if (!settingRow) {
      const err = new Error("WhatsApp integration is not configured. Please configure your CP API key in WhatsApp Settings.");
      err.statusCode = 400;
      throw err;
    }

    const apiKey = WhatsAppSettingsModel.decryptApiKey(settingRow);
    if (!apiKey) {
      const err = new Error("Valid CP API key is not configured. Please update your WhatsApp Settings.");
      err.statusCode = 400;
      throw err;
    }

    return {
      settingsId: settingRow.id,
      apiKey,
      whatsappAccountId: settingRow.whatsapp_account_id,
      whatsappMobile: settingRow.whatsapp_mobile,
      isConnected: Boolean(settingRow.is_connected),
      settingRow,
    };
  }

  /**
   * Check business WhatsApp account information.
   */
  static async getWhatsAppAccountInfo(mobile = null) {
    const creds = await this.getDecryptedCredentials();
    return ChatterPillarService.getWhatsAppAccountInfo({
      apiKey: creds.apiKey,
      mobile: mobile || creds.whatsappMobile,
    });
  }

  /**
   * Synchronize templates from ChatterPillar and cache/upsert into database.
   */
  static async syncTemplates({ userId = null } = {}) {
    const creds = await this.getDecryptedCredentials();

    const response = await ChatterPillarService.getTemplateList({
      apiKey: creds.apiKey,
      whatsappAccountId: creds.whatsappAccountId,
    });

    const rawTemplates = response.templates || [];
    const savedTemplates = await WhatsAppTemplateModel.upsertMany(rawTemplates);

    return {
      success: true,
      message: `Successfully synchronized ${savedTemplates.length} templates from ChatterPillar.`,
      synced_count: savedTemplates.length,
      templates: savedTemplates,
    };
  }

  /**
   * Retrieve saved WhatsApp templates with search, filter, and pagination.
   */
  static async getTemplateList(queryParams = {}) {
    const { search, category, status, language, page = 1, limit = 50 } = queryParams;
    return WhatsAppTemplateModel.findAll({
      search,
      category,
      status,
      language,
      page,
      limit,
    });
  }

  /**
   * Select an approved template as the active Birthday Template.
   */
  static async selectBirthdayTemplate({ templateId, userId = null }) {
    if (!templateId || !String(templateId).trim()) {
      const err = new Error("template_id is required.");
      err.statusCode = 400;
      throw err;
    }

    const cleanId = String(templateId).trim();
    const template = await WhatsAppTemplateModel.findByTemplateId(cleanId);

    if (!template) {
      const err = new Error(`Template with ID '${cleanId}' was not found in CRM. Please sync templates first.`);
      err.statusCode = 404;
      throw err;
    }

    if (String(template.status).toUpperCase() !== "APPROVED") {
      const err = new Error(`Cannot select template '${template.template_name}' because its status is ${template.status}. Only APPROVED templates can be designated as Birthday Template.`);
      err.statusCode = 400;
      throw err;
    }

    const settingRow = await WhatsAppSettingsModel.getSettings();
    if (!settingRow) {
      const err = new Error("WhatsApp settings not configured. Please save your API key first.");
      err.statusCode = 400;
      throw err;
    }

    let parsedVariables = [];
    if (template.variables) {
      try {
        parsedVariables = typeof template.variables === "string" ? JSON.parse(template.variables) : template.variables;
      } catch (e) {
        parsedVariables = [];
      }
    }

    const templateSummary = {
      template_id: template.template_id,
      template_name: template.template_name,
      category: template.category,
      language: template.language,
      body_content: template.body_content,
      header_content: template.header_content,
      variable_count: template.variable_count,
      variables: parsedVariables,
    };

    const updatedRow = await WhatsAppSettingsModel.update(settingRow.id, {
      birthday_template_id: template.template_id,
      birthday_template_data: templateSummary,
    });

    return {
      success: true,
      message: `Template '${template.template_name}' successfully set as Birthday Template.`,
      birthday_template_id: updatedRow.birthday_template_id,
      birthday_template_data: templateSummary,
    };
  }

  /**
   * Send a test WhatsApp message using a selected template.
   */
  static async sendTestMessage({
    template_id,
    mobile,
    full_name,
    body_variable_values = null,
    header_variable_values = null,
    button_variable_values = null,
    userId = null,
  }) {
    const creds = await this.getDecryptedCredentials();

    if (!template_id || !String(template_id).trim()) {
      const err = new Error("template_id is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!mobile || !String(mobile).trim()) {
      const err = new Error("Recipient mobile number is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!full_name || !String(full_name).trim()) {
      const err = new Error("Recipient full name is required.");
      err.statusCode = 400;
      throw err;
    }

    // Call ChatterPillar API
    const result = await ChatterPillarService.sendTemplateMessage({
      apiKey: creds.apiKey,
      whatsappAccountId: creds.whatsappAccountId,
      templateId: String(template_id).trim(),
      mobile: String(mobile).trim(),
      fullName: String(full_name).trim(),
      bodyVariables: body_variable_values,
      headerVariables: header_variable_values,
      buttonVariables: button_variable_values,
    });

    return {
      success: true,
      message: result.message || "Test WhatsApp message sent successfully.",
      provider_response: result,
    };
  }

  /**
   * Generic Send Template Message (backward compatibility & CRM usage).
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
    const creds = await this.getDecryptedCredentials();

    const accountId = whatsapp_account_id || creds.whatsappAccountId;

    return ChatterPillarService.sendTemplateMessage({
      apiKey: creds.apiKey,
      whatsappAccountId: accountId,
      templateId: template_id,
      mobile,
      fullName: full_name,
      bodyVariables: body_variable_values,
      headerVariables: header_variable_values,
      buttonVariables: button_variable_values,
    });
  }
}

module.exports = WhatsAppService;
