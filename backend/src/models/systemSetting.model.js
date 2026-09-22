const pool = require("../config/database");

class SystemSettingModel {
  /**
   * Get all system settings as a key-value dictionary.
   */
  static async getAllSettings() {
    const query = `SELECT key, value, description, updated_at FROM system_settings`;
    const result = await pool.query(query);
    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  /**
   * Get a single system setting value by key.
   */
  static async getSetting(key, defaultValue = null) {
    const query = `SELECT value FROM system_settings WHERE key = $1`;
    const result = await pool.query(query, [key]);
    if (result.rows.length === 0) return defaultValue;
    return result.rows[0].value;
  }

  /**
   * Update or insert system setting values.
   */
  static async updateSettings(settingsObj) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const [key, value] of Object.entries(settingsObj)) {
        await client.query(
          `INSERT INTO system_settings (key, value, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [key, String(value)]
        );
      }
      await client.query("COMMIT");
      return await this.getAllSettings();
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = SystemSettingModel;
