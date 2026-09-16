const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const ENCRYPTION_VERSION = "v1";
const KEY_ID = "default";

/**
 * Get or derive 32-byte (256-bit) encryption key from environment variable.
 */
function getMasterKey() {
  const secret = process.env.DOCUMENT_ENCRYPTION_KEY || "antigravity_crm_secure_doc_encryption_key_32bytes_2026";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a Buffer using AES-256-GCM.
 * @param {Buffer} buffer - Plaintext buffer to encrypt
 * @returns {{ encryptedData: Buffer, iv: string, authTag: string, encryptionVersion: string, keyId: string }}
 */
function encryptBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Input to encryptBuffer must be a Buffer");
  }

  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedData,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    encryptionVersion: ENCRYPTION_VERSION,
    keyId: KEY_ID,
  };
}

/**
 * Decrypt an encrypted Buffer using AES-256-GCM.
 * @param {Buffer} encryptedBuffer - Encrypted binary data
 * @param {string} ivHex - Hex-encoded IV
 * @param {string} authTagHex - Hex-encoded authentication tag
 * @returns {Buffer} Plaintext buffer
 */
function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
  if (!Buffer.isBuffer(encryptedBuffer)) {
    throw new Error("Input encryptedBuffer must be a Buffer");
  }
  if (!ivHex || !authTagHex) {
    throw new Error("IV and Auth Tag are required for decryption");
  }

  const masterKey = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param {string} text - Plaintext string
 * @returns {{ encryptedText: string, iv: string, authTag: string }}
 */
function encryptString(text) {
  if (typeof text !== "string") {
    throw new Error("Input to encryptString must be a string");
  }
  const result = encryptBuffer(Buffer.from(text, "utf8"));
  return {
    encryptedText: result.encryptedData.toString("hex"),
    iv: result.iv,
    authTag: result.authTag,
  };
}

/**
 * Decrypt an encrypted hex string using AES-256-GCM.
 * @param {string} encryptedHex - Hex-encoded ciphertext
 * @param {string} ivHex - Hex-encoded IV
 * @param {string} authTagHex - Hex-encoded auth tag
 * @returns {string} Plaintext string
 */
function decryptString(encryptedHex, ivHex, authTagHex) {
  if (!encryptedHex || typeof encryptedHex !== "string") {
    throw new Error("Encrypted string is required");
  }
  const encryptedBuffer = Buffer.from(encryptedHex, "hex");
  const decryptedBuffer = decryptBuffer(encryptedBuffer, ivHex, authTagHex);
  return decryptedBuffer.toString("utf8");
}

/**
 * Mask sensitive credentials for API responses.
 * Never exposes the full API key.
 * @param {string} key - API Key or credential string
 * @returns {string} Masked string (e.g. "CP_K...cdef")
 */
function maskApiKey(key) {
  if (!key || typeof key !== "string" || key.trim() === "") {
    return "";
  }
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return "••••••••";
  }
  return `${trimmed.substring(0, 4)}...${trimmed.substring(trimmed.length - 4)}`;
}

module.exports = {
  encryptBuffer,
  decryptBuffer,
  encryptString,
  decryptString,
  maskApiKey,
  ENCRYPTION_VERSION,
  KEY_ID,
};
