const pool = require("../config/database");

class RefreshSessionModel {
  /**
   * Insert a new refresh token session.
   */
  static async createSession({ userId, tokenHash, ipAddress, userAgent, expiresAt }) {
    const query = `
      INSERT INTO refresh_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [userId, tokenHash, ipAddress || null, userAgent || null, expiresAt];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * Find a refresh session record by hashed token.
   */
  static async findByTokenHash(tokenHash) {
    const query = `
      SELECT * FROM refresh_sessions
      WHERE token_hash = $1;
    `;
    const { rows } = await pool.query(query, [tokenHash]);
    return rows[0] || null;
  }

  /**
   * Mark a specific refresh session as revoked.
   */
  static async revokeSession(id) {
    const query = `
      UPDATE refresh_sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Revoke all active refresh sessions for a specific user (e.g. security breach / token reuse detection).
   */
  static async revokeAllUserSessions(userId) {
    const query = `
      UPDATE refresh_sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND revoked_at IS NULL;
    `;
    await pool.query(query, [userId]);
  }

  /**
   * Clean up expired session records.
   */
  static async deleteExpiredSessions() {
    const query = `
      DELETE FROM refresh_sessions
      WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at < (CURRENT_TIMESTAMP - INTERVAL '30 days');
    `;
    await pool.query(query);
  }
}

module.exports = RefreshSessionModel;
