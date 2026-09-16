const { sendError } = require("../utils/response.util");

const validateAccountInfoQuery = (req, res, next) => {
  const { mobile } = req.body || {};

  if (mobile !== undefined && mobile !== null && String(mobile).trim() !== "") {
    const cleanMobile = String(mobile).trim().replace(/[\s\-()]/g, "");
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      return sendError(res, 400, "Invalid mobile number format. Mobile number must contain 10 to 15 digits.");
    }
  }

  next();
};

const validateSendTemplate = (req, res, next) => {
  const { template_id, mobile, full_name } = req.body || {};

  if (!template_id || String(template_id).trim() === "") {
    return sendError(res, 400, "template_id is required.");
  }

  if (!mobile || String(mobile).trim() === "") {
    return sendError(res, 400, "mobile is required.");
  }

  if (!full_name || String(full_name).trim() === "") {
    return sendError(res, 400, "full_name is required.");
  }

  const cleanMobile = String(mobile).trim().replace(/[\s\-()]/g, "");
  if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
    return sendError(res, 400, "Invalid mobile number format. Mobile number must contain 10 to 15 digits.");
  }

  next();
};

const validateCreateSettings = (req, res, next) => {
  const { cp_api_key, whatsapp_mobile } = req.body || {};

  if (!cp_api_key || String(cp_api_key).trim() === "") {
    return sendError(res, 400, "CP API key is required.");
  }

  if (whatsapp_mobile !== undefined && whatsapp_mobile !== null && String(whatsapp_mobile).trim() !== "") {
    const cleanMobile = String(whatsapp_mobile).trim().replace(/[\s\-()+]/g, "");
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      return sendError(res, 400, "Invalid WhatsApp mobile number format. Mobile number must contain 10 to 15 digits.");
    }
  }

  next();
};

const validateUpdateSettings = (req, res, next) => {
  const { whatsapp_mobile } = req.body || {};

  if (whatsapp_mobile !== undefined && whatsapp_mobile !== null && String(whatsapp_mobile).trim() !== "") {
    const cleanMobile = String(whatsapp_mobile).trim().replace(/[\s\-()+]/g, "");
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      return sendError(res, 400, "Invalid WhatsApp mobile number format. Mobile number must contain 10 to 15 digits.");
    }
  }

  next();
};

module.exports = {
  validateAccountInfoQuery,
  validateSendTemplate,
  validateCreateSettings,
  validateUpdateSettings,
};
