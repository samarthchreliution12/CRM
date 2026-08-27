const pool = require("../config/database");

class GroupModel {
  // Check if role/group name exists
  static async findByName(name) {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM roles
      WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name.trim()]);
    return result.rows[0] || null;
  }

  // Find custom group by ID
  static async findById(id) {
    const query = `
      SELECT 
        r.id, 
        r.name, 
        r.description, 
        r.status, 
        r.created_at, 
        r.updated_at,
        COALESCE(COUNT(u.id)::int, 0) AS member_count
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      WHERE r.id = $1 AND r.status = 'active'
      GROUP BY r.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find all custom groups (excluding system roles Admin, Staff, Client)
  static async findAllCustomGroups() {
    const query = `
      SELECT 
        r.id, 
        r.name, 
        r.description, 
        r.status, 
        r.created_at, 
        r.updated_at,
        COALESCE(COUNT(u.id)::int, 0) AS member_count,
        COALESCE(COUNT(u.id)::int, 0) AS "memberCount"
      FROM roles r
      LEFT JOIN users u ON u.role_id = r.id
      WHERE r.status = 'active' 
        AND r.id NOT IN (1, 2, 3) 
        AND LOWER(r.name) NOT IN ('admin', 'staff', 'client')
      GROUP BY r.id
      ORDER BY r.id ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Create a new group role
  static async createGroup({ name, description }) {
    const query = `
      INSERT INTO roles (name, description, status)
      VALUES ($1, $2, 'active')
      RETURNING id, name, description, status, created_at, updated_at
    `;
    const result = await pool.query(query, [name.trim(), description ? description.trim() : null]);
    return {
      ...result.rows[0],
      member_count: 0,
      memberCount: 0,
    };
  }

  // Get members of a group
  static async getGroupMembers(groupId) {
    const query = `
      SELECT 
        u.id, 
        u.id AS user_id,
        u.name, 
        u.email, 
        r.name AS role, 
        u.status, 
        u.created_at
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.role_id = $1
      ORDER BY u.name ASC
    `;
    const result = await pool.query(query, [groupId]);
    return result.rows;
  }

  // Add members (reassign users' role_id to groupId)
  static async addMembers(groupId, userIds) {
    const query = `
      UPDATE users
      SET role_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2::int[])
      RETURNING id, name, email, status
    `;
    const result = await pool.query(query, [groupId, userIds]);
    return result.rows;
  }

  // Remove member (reassign user's role_id back to default Staff role)
  static async removeMember(groupId, userId, defaultStaffRoleId = 2) {
    const query = `
      UPDATE users
      SET role_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND role_id = $3
      RETURNING id, name, email, status
    `;
    const result = await pool.query(query, [userId, defaultStaffRoleId, groupId]);
    return result.rows[0] || null;
  }

  // Get default Staff role ID
  static async getDefaultStaffRoleId() {
    const query = `SELECT id FROM roles WHERE LOWER(name) = 'staff' LIMIT 1`;
    const result = await pool.query(query);
    return result.rows[0] ? result.rows[0].id : 2;
  }

  // Delete a group role and its role_permissions records
  static async deleteGroup(groupId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM role_permissions WHERE role_id = $1", [groupId]);
      const res = await client.query("DELETE FROM roles WHERE id = $1 RETURNING id", [groupId]);
      await client.query("COMMIT");
      return res.rowCount > 0;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = GroupModel;
