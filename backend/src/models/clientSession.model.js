const pool = require("../config/database");

class ClientSessionModel {
  /**
   * Create a new client session.
   */
  static async create({ clientId, token, ipAddress = null, userAgent = null, expiresAt }) {
    const query = `
      INSERT INTO client_sessions (client_id, token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, client_id, token, ip_address, user_agent, expires_at, revoked_at, created_at
    `;
    const values = [clientId, token, ipAddress, userAgent, expiresAt];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find a session by token.
   */
  static async findByToken(token) {
    if (!token) return null;
    const query = `
      SELECT
        s.id,
        s.client_id,
        s.token,
        s.ip_address,
        s.user_agent,
        s.expires_at,
        s.revoked_at,
        s.created_at,
        c.name AS client_name,
        c.status AS client_status,
        c.mobile_no AS client_mobile,
        c.email AS client_email,
        c.ucc_no AS client_ucc
      FROM client_sessions s
      JOIN clients c ON c.id = s.client_id
      WHERE s.token = $1
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Revoke a specific session token (Logout).
   */
  static async revokeToken(token) {
    if (!token) return false;
    const query = `
      UPDATE client_sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token = $1 AND revoked_at IS NULL
      RETURNING id, client_id, revoked_at
    `;
    const result = await pool.query(query, [token]);
    return result.rowCount > 0;
  }

  /**
   * Revoke all active sessions for a client.
   */
  static async revokeAllForClient(clientId) {
    const query = `
      UPDATE client_sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE client_id = $1 AND revoked_at IS NULL
    `;
    const result = await pool.query(query, [clientId]);
    return result.rowCount;
  }

  /**
   * Check if a token session is currently active and not revoked/expired.
   */
  static async isActiveSession(token) {
    const query = `
      SELECT id, client_id, expires_at, revoked_at
      FROM client_sessions
      WHERE token = $1
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    `;
    const result = await pool.query(query, [token]);
    return result.rows.length > 0;
  }
}

module.exports = ClientSessionModel;
