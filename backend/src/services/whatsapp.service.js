const pool = require("../config/database");
const WhatsAppSettingsModel = require("../models/whatsappSettings.model");
const WhatsAppTemplateModel = require("../models/whatsappTemplate.model");
const WhatsAppMessageModel = require("../models/whatsappMessage.model");
const ChatterPillarService = require("./chatterpillar.service");
const { formatForWhatsAppApi } = require("../utils/phone.util");

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
      birthdayTemplateId: settingRow.birthday_template_id,
      birthdayTemplateData: settingRow.birthday_template_data,
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
      footer_content: template.footer_content,
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
   * Select an approved template as the active Client Portal OTP Template.
   */
  static async selectOtpTemplate({ templateId, userId = null }) {
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
      const err = new Error(`Cannot select template '${template.template_name}' because its status is ${template.status}. Only APPROVED templates can be designated as OTP Template.`);
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
      footer_content: template.footer_content,
      variable_count: template.variable_count,
      variables: parsedVariables,
    };

    const updatedRow = await WhatsAppSettingsModel.update(settingRow.id, {
      otp_template_id: template.template_id,
      otp_template_data: templateSummary,
    });

    return {
      success: true,
      message: `Template '${template.template_name}' successfully set as Client Portal OTP Template.`,
      otp_template_id: updatedRow.otp_template_id,
      otp_template_data: templateSummary,
    };
  }

  /**
   * Prepare and validate birthday preview for a specific client.
   * Calculates age, verifies birthday is today, loads the selected template,
   * replaces visible variables ({{1}} -> client name, {{2}} -> client age),
   * and identifies any missing variables.
   */
  static async getBirthdayPreview({ clientId, referenceDate = null }) {
    if (!clientId) {
      const err = new Error("clientId is required.");
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch client record
    const clientQuery = `
      SELECT id, name, dob, mobile_no, whatsapp_no, email, status
      FROM clients
      WHERE id = $1
      LIMIT 1
    `;
    const clientResult = await pool.query(clientQuery, [clientId]);
    if (clientResult.rows.length === 0) {
      const err = new Error(`Client with ID ${clientId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const client = clientResult.rows[0];
    const today = referenceDate ? new Date(referenceDate) : new Date();
    const currentYear = today.getFullYear();

    // 2. Check if client has DOB & calculate age
    let age = null;
    let isBirthdayToday = false;
    let dobFormatted = null;

    if (client.dob) {
      const dobDate = new Date(client.dob);
      dobFormatted = `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, "0")}-${String(dobDate.getDate()).padStart(2, "0")}`;

      isBirthdayToday =
        dobDate.getMonth() === today.getMonth() &&
        dobDate.getDate() === today.getDate();

      // Calculate exact age
      age = today.getFullYear() - dobDate.getFullYear();
      const hasHadBirthday =
        today.getMonth() > dobDate.getMonth() ||
        (today.getMonth() === dobDate.getMonth() && today.getDate() >= dobDate.getDate());
      if (!hasHadBirthday) {
        age--;
      }
    }

    // 3. Check WhatsApp Phone
    const recipientPhone = (client.whatsapp_no || client.mobile_no || "").trim();
    const cleanPhone = formatForWhatsAppApi(recipientPhone);
    const hasValidPhone = /^91[6-9]\d{9}$/.test(cleanPhone) || (/^[0-9]{10,15}$/.test(cleanPhone) && cleanPhone.length >= 10);

    // 4. Check if birthday message was already sent this year
    const alreadySentRecord = await WhatsAppMessageModel.hasSentBirthdayWish(client.id, currentYear);
    const alreadySentThisYear = Boolean(alreadySentRecord);

    // 5. Fetch active Birthday Template from WhatsApp Settings
    const settingRow = await WhatsAppSettingsModel.getSettings();
    const isConnected = Boolean(settingRow?.is_connected);
    const birthdayTemplateId = settingRow?.birthday_template_id;

    let template = null;
    let templateError = null;

    if (!birthdayTemplateId) {
      templateError = "No Birthday Template configured. Please select an approved template in WhatsApp Settings.";
    } else {
      template = await WhatsAppTemplateModel.findByTemplateId(birthdayTemplateId);
      if (!template) {
        templateError = `Selected template '${birthdayTemplateId}' not found in database. Please sync templates.`;
      } else if (String(template.status).toUpperCase() !== "APPROVED") {
        templateError = `The selected template '${template.template_name}' is ${template.status}. Only APPROVED templates can be sent.`;
      }
    }

    // 6. Parse and map template variables
    const variableMap = {};
    const missingVariables = [];
    let renderedBody = "";

    if (template && template.body_content) {
      // Find all {{...}} in body
      const varRegex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
      let match;
      const detectedTokens = [];

      while ((match = varRegex.exec(template.body_content)) !== null) {
        if (!detectedTokens.includes(match[1])) {
          detectedTokens.push(match[1]);
        }
      }

      // Map tokens:
      // Standard WhatsApp convention:
      // {{1}} -> Client Name
      // {{2}} -> Client Age
      detectedTokens.forEach((token) => {
        const tokenLower = token.toLowerCase();
        if (token === "1" || tokenLower === "name" || tokenLower === "client_name") {
          if (client.name && client.name.trim()) {
            variableMap[token] = client.name.trim();
          } else {
            missingVariables.push({
              token,
              label: "Client Name",
              reason: "Client name is empty.",
            });
          }
        } else if (token === "2" || tokenLower === "age" || tokenLower === "client_age") {
          if (age !== null && age >= 0) {
            variableMap[token] = String(age);
          } else {
            missingVariables.push({
              token,
              label: "Client Age",
              reason: "Client date of birth / age is not available.",
            });
          }
        } else {
          // Additional variable in template that CRM cannot auto-populate
          missingVariables.push({
            token,
            label: `Variable {{${token}}}`,
            reason: `Template requires {{${token}}}, but no automatic client field is mapped for this variable.`,
          });
        }
      });

      // Render read-only preview with variables replaced
      renderedBody = template.body_content;
      detectedTokens.forEach((token) => {
        const val = variableMap[token];
        const tokenPattern = new RegExp(`{{\\s*${token}\\s*}}`, "g");
        renderedBody = renderedBody.replace(tokenPattern, val !== undefined ? val : `{{${token}}}`);
      });
    }

    // 7. Compile blocking reasons if sending is not allowed
    const sendBlockReasons = [];
    if (!isBirthdayToday) {
      sendBlockReasons.push("Client's birthday is not today.");
    }
    if (client.status !== "active") {
      sendBlockReasons.push(`Client account is ${client.status || "inactive"}. Only active clients can receive wishes.`);
    }
    if (!hasValidPhone) {
      sendBlockReasons.push("Client does not have a valid WhatsApp phone number (10 to 15 digits required).");
    }
    if (!isConnected) {
      sendBlockReasons.push("WhatsApp connection is not active. Please connect your CP API Key in WhatsApp Settings.");
    }
    if (templateError) {
      sendBlockReasons.push(templateError);
    }
    if (alreadySentThisYear) {
      sendBlockReasons.push(`A birthday wish has already been sent to this client in ${currentYear}.`);
    }
    if (missingVariables.length > 0) {
      missingVariables.forEach((mv) => {
        sendBlockReasons.push(`Missing template variable {{${mv.token}}}: ${mv.reason}`);
      });
    }

    const canSend = sendBlockReasons.length === 0;

    return {
      client: {
        id: client.id,
        name: client.name,
        dob: dobFormatted,
        age,
        mobile_no: client.mobile_no || null,
        whatsapp_no: client.whatsapp_no || client.mobile_no || null,
        status: client.status,
      },
      template: template
        ? {
            template_id: template.template_id,
            template_name: template.template_name,
            category: template.category,
            language: template.language,
            status: template.status,
            header_content: template.header_content,
            body_content: template.body_content,
            footer_content: template.footer_content,
          }
        : null,
      rendered_body: renderedBody,
      variable_map: variableMap,
      missing_variables: missingVariables,
      is_birthday_today: isBirthdayToday,
      already_sent_this_year: alreadySentThisYear,
      already_sent_at: alreadySentRecord ? alreadySentRecord.sent_at : null,
      can_send: canSend,
      send_block_reasons: sendBlockReasons,
    };
  }

  /**
   * Send manual birthday wish to a single client.
   * Completely manual action: user must confirm before sending.
   * Performs all validations, dispatches via ChatterPillar, and logs history.
   */
  static async sendBirthdayWish({ clientId, userId = null, referenceDate = null }) {
    // 1. Run preview validation check
    const preview = await this.getBirthdayPreview({ clientId, referenceDate });

    if (!preview.can_send) {
      const firstReason = preview.send_block_reasons[0] || "Cannot send birthday wish due to validation constraints.";
      const err = new Error(firstReason);
      err.statusCode = 400;
      err.reasons = preview.send_block_reasons;
      throw err;
    }

    // 2. Fetch active credentials
    const creds = await this.getDecryptedCredentials();

    const client = preview.client;
    const template = preview.template;
    const cleanMobile = formatForWhatsAppApi(client.whatsapp_no || client.mobile_no);

    // Prepare ordered variables array
    const orderedBodyValues = Object.keys(preview.variable_map)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((k) => preview.variable_map[k]);

    const currentYear = referenceDate ? new Date(referenceDate).getFullYear() : new Date().getFullYear();

    // 3. Call ChatterPillar API
    try {
      const providerRes = await ChatterPillarService.sendTemplateMessage({
        apiKey: creds.apiKey,
        whatsappAccountId: creds.whatsappAccountId,
        templateId: template.template_id,
        mobile: cleanMobile,
        fullName: client.name,
        bodyVariables: orderedBodyValues.length > 0 ? orderedBodyValues : undefined,
      });

      // Extract provider message ID
      let providerMessageId = null;
      if (Array.isArray(providerRes?.data) && providerRes.data.length > 0) {
        providerMessageId = providerRes.data[0].id || providerRes.data[0].message_id || null;
      } else if (providerRes?.message_id || providerRes?.id) {
        providerMessageId = providerRes.message_id || providerRes.id;
      }

      // 4. Save successful message log
      const messageLog = await WhatsAppMessageModel.create({
        clientId: client.id,
        templateId: template.template_id,
        templateName: template.template_name,
        userId,
        messageType: "BIRTHDAY",
        recipientMobile: cleanMobile,
        recipientName: client.name,
        messageContent: preview.rendered_body,
        variableValues: orderedBodyValues,
        provider: "ChatterPillar",
        providerMessageId,
        status: "SENT",
        errorDetails: null,
        sentYear: currentYear,
      });

      return {
        success: true,
        message: `Birthday greeting successfully sent to ${client.name}!`,
        log: messageLog,
        provider_response: providerRes,
      };
    } catch (sendErr) {
      // 5. On failure: log FAILED record in message history and throw safe error
      const errorMsg = sendErr.message || "Failed to deliver WhatsApp message via provider.";

      await WhatsAppMessageModel.create({
        clientId: client.id,
        templateId: template.template_id,
        templateName: template.template_name,
        userId,
        messageType: "BIRTHDAY",
        recipientMobile: cleanMobile,
        recipientName: client.name,
        messageContent: preview.rendered_body,
        variableValues: orderedBodyValues,
        provider: "ChatterPillar",
        providerMessageId: null,
        status: "FAILED",
        errorDetails: errorMsg,
        sentYear: currentYear,
      });

      const userSafeError = new Error(errorMsg);
      userSafeError.statusCode = sendErr.statusCode || 502;
      throw userSafeError;
    }
  }

  /**
   * Retrieve message history for a client.
   */
  static async getClientMessageHistory(clientId) {
    if (!clientId) {
      const err = new Error("clientId is required.");
      err.statusCode = 400;
      throw err;
    }
    return WhatsAppMessageModel.findByClient(clientId);
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
