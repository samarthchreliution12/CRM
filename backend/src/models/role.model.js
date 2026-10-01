const pool = require("../config/database");

class RoleModel {
  static async findAll() {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM roles
      WHERE status = 'active'
      ORDER BY 
        CASE 
          WHEN LOWER(name) = 'admin' THEN 1
          WHEN LOWER(name) = 'staff' THEN 2
          WHEN LOWER(name) = 'client' THEN 99
          ELSE 3
        END,
        id ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM roles
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM roles
      WHERE name = $1
    `;
    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }
}

module.exports = RoleModel;
