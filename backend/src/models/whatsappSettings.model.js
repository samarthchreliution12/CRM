const pool = require("../config/database");
const { encryptString, decryptString, maskApiKey } = require("../utils/encryption.util");

class WhatsAppSettingsModel {
  /**
   * Find the current active WhatsApp settings configuration.
   */
  static async getSettings() {
    const query = `
      SELECT id, provider, cp_api_key_encrypted, cp_api_key_iv, cp_api_key_tag,
             whatsapp_account_id, whatsapp_mobile, is_connected, created_by,
             created_at, updated_at
      FROM whatsapp_settings
      ORDER BY id DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Decrypt the stored ChatterPillar API Key for internal service usage.
   * NEVER expose this plaintext value in API responses.
   */
  static decryptApiKey(row) {
    if (!row || !row.cp_api_key_encrypted || !row.cp_api_key_iv || !row.cp_api_key_tag) {
      return null;
    }
    try {
      return decryptString(row.cp_api_key_encrypted, row.cp_api_key_iv, row.cp_api_key_tag);
    } catch (error) {
      console.error("Failed to decrypt WhatsApp CP_API_KEY:", error.message);
      return null;
    }
  }

  /**
   * Create a new WhatsApp settings record with encrypted credentials.
   */
  static async create({
    provider = "ChatterPillar",
    cp_api_key,
    whatsapp_mobile = null,
    whatsapp_account_id = null,
    is_connected = false,
    created_by = null,
  }) {
    if (!cp_api_key || !cp_api_key.trim()) {
      throw new Error("CP API key is required");
    }

    const { encryptedText, iv, authTag } = encryptString(cp_api_key.trim());

    const query = `
      INSERT INTO whatsapp_settings (
        provider, cp_api_key_encrypted, cp_api_key_iv, cp_api_key_tag,
        whatsapp_account_id, whatsapp_mobile, is_connected, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, provider, cp_api_key_encrypted, cp_api_key_iv, cp_api_key_tag, whatsapp_account_id, whatsapp_mobile, is_connected, created_by, created_at, updated_at
    `;

    const values = [
      provider || "ChatterPillar",
      encryptedText,
      iv,
      authTag,
      whatsapp_account_id ? String(whatsapp_account_id).trim() : null,
      whatsapp_mobile ? String(whatsapp_mobile).trim() : null,
      Boolean(is_connected),
      created_by || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update an existing WhatsApp settings record.
   */
  static async update(id, {
    cp_api_key = null,
    whatsapp_mobile = null,
    whatsapp_account_id = null,
    is_connected = null,
  }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (cp_api_key && cp_api_key.trim() !== "") {
      const { encryptedText, iv, authTag } = encryptString(cp_api_key.trim());
      updates.push(`cp_api_key_encrypted = $${paramIndex++}`);
      values.push(encryptedText);
      updates.push(`cp_api_key_iv = $${paramIndex++}`);
      values.push(iv);
      updates.push(`cp_api_key_tag = $${paramIndex++}`);
      values.push(authTag);
    }

    if (whatsapp_mobile !== undefined && whatsapp_mobile !== null) {
      updates.push(`whatsapp_mobile = $${paramIndex++}`);
      values.push(String(whatsapp_mobile).trim());
    }

    if (whatsapp_account_id !== undefined && whatsapp_account_id !== null) {
      updates.push(`whatsapp_account_id = $${paramIndex++}`);
      values.push(String(whatsapp_account_id).trim());
    }

    if (is_connected !== undefined && is_connected !== null) {
      updates.push(`is_connected = $${paramIndex++}`);
      values.push(Boolean(is_connected));
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const query = `
      UPDATE whatsapp_settings
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, provider, cp_api_key_encrypted, cp_api_key_iv, cp_api_key_tag, whatsapp_account_id, whatsapp_mobile, is_connected, created_by, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Format a settings row for public API responses, guaranteeing masked API key.
   */
  static formatResponse(row) {
    if (!row) {
      return {
        provider: "ChatterPillar",
        whatsapp_mobile: null,
        whatsapp_account_id: null,
        is_connected: false,
        cp_api_key: "",
        created_at: null,
        updated_at: null,
      };
    }

    const plaintextKey = this.decryptApiKey(row);
    const maskedKey = plaintextKey ? maskApiKey(plaintextKey) : "";

    return {
      id: row.id,
      provider: row.provider || "ChatterPillar",
      whatsapp_mobile: row.whatsapp_mobile || null,
      whatsapp_account_id: row.whatsapp_account_id || null,
      is_connected: Boolean(row.is_connected),
      cp_api_key: maskedKey,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

module.exports = WhatsAppSettingsModel;
