const path = require("path");

const ALLOWED_DOCUMENT_TYPES = ["AADHAAR", "PAN", "SIGNATURE", "CHEQUE", "PHOTO", "OTHER"];
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXTENSIONS = [".pdf", ".jpeg", ".jpg", ".png"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate document type parameter.
 */
function isValidDocumentType(type) {
  if (!type || typeof type !== "string") return false;
  return ALLOWED_DOCUMENT_TYPES.includes(type.trim().toUpperCase());
}

/**
 * Validate file Magic Bytes from buffer header.
 */
function validateMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;

  // PDF Magic Bytes: %PDF (0x25, 0x50, 0x44, 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }

  // JPEG Magic Bytes: 0xFF, 0xD8, 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG Magic Bytes: 0x89, 0x50, 0x4E, 0x47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  return false;
}

/**
 * Validate uploaded file properties.
 */
function validateUploadedFile(file) {
  if (!file) {
    const err = new Error("No file uploaded.");
    err.statusCode = 400;
    throw err;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const err = new Error(`File size exceeds maximum allowed limit of 10MB.`);
    err.statusCode = 400;
    throw err;
  }

  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    const err = new Error(`Invalid file extension '${ext}'. Allowed types: PDF, JPG, JPEG, PNG.`);
    err.statusCode = 400;
    throw err;
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const err = new Error(`Invalid MIME type '${file.mimetype}'. Allowed types: PDF, JPG, JPEG, PNG.`);
    err.statusCode = 400;
    throw err;
  }

  const detectedMime = validateMagicBytes(file.buffer);
  if (!detectedMime) {
    const err = new Error("File content validation failed. File header does not match allowed PDF, JPG, or PNG formats.");
    err.statusCode = 400;
    throw err;
  }

  return {
    valid: true,
    detectedMime,
  };
}

module.exports = {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  isValidDocumentType,
  validateMagicBytes,
  validateUploadedFile,
};
