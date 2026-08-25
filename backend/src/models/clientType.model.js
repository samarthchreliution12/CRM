const pool = require("../config/database");

class ClientTypeModel {
  static async findAll() {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM client_types
      WHERE status = 'active'
      ORDER BY id ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM client_types
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

module.exports = ClientTypeModel;
