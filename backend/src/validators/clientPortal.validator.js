const { validateUploadedFile } = require("../utils/fileValidation.util");
const { sendError } = require("../utils/response.util");

/**
 * Validator for Client Login request.
 */
function validateClientLogin(req, res, next) {
  const { mobile_no, mobile } = req.body || {};
  const rawMobile = mobile_no || mobile;

  if (!rawMobile || typeof rawMobile !== "string" && typeof rawMobile !== "number") {
    return sendError(res, 400, "Registered mobile number is required", [
      { field: "mobile_no", message: "Mobile number is required" },
    ]);
  }

  const digits = String(rawMobile).replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return sendError(res, 400, "Please provide a valid 10 to 15 digit mobile number", [
      { field: "mobile_no", message: "Mobile number must be between 10 and 15 digits" },
    ]);
  }

  next();
}

/**
 * Validator for Client Document Upload request.
 */
function validateDocumentUpload(req, res, next) {
  if (req.params.documentId) {
    const docId = parseInt(req.params.documentId, 10);
    if (isNaN(docId) || docId <= 0) {
      return sendError(res, 400, "Invalid document ID parameter", [
        { field: "documentId", message: "Document ID must be a positive integer" },
      ]);
    }
  }

  if (!req.file) {
    return sendError(res, 400, "No file uploaded. Please select a valid document file.", [
      { field: "file", message: "File is required" },
    ]);
  }

  try {
    validateUploadedFile(req.file);
    next();
  } catch (err) {
    return sendError(res, err.statusCode || 400, err.message, [
      { field: "file", message: err.message },
    ]);
  }
}

/**
 * Validator for checking documentId URL param.
 */
function validateDocumentIdParam(req, res, next) {
  const docId = parseInt(req.params.documentId, 10);
  if (isNaN(docId) || docId <= 0) {
    return sendError(res, 400, "Invalid document ID parameter", [
      { field: "documentId", message: "Document ID must be a positive integer" },
    ]);
  }
  next();
}

module.exports = {
  validateClientLogin,
  validateDocumentUpload,
  validateDocumentIdParam,
};
