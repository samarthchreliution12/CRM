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

module.exports = {
  encryptBuffer,
  decryptBuffer,
  ENCRYPTION_VERSION,
  KEY_ID,
};
