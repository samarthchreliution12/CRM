const pool = require("../config/database");

class UserModel {
  /**
   * Find user by email including password_hash for authentication.
   */
  static async findByEmail(email) {
    const query = `
      SELECT u.id, u.name, u.email, u.password_hash, u.mobile, u.role_id, u.status, u.last_login, u.created_at, u.updated_at,
             r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.email) = LOWER($1)
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID.
   */
  static async findById(id) {
    return this.findByIdWithRoleAndPermissions(id);
  }

  /**
   * Find user by ID with role name and assigned permissions (excluding password_hash).
   */
  static async findByIdWithRoleAndPermissions(id) {
    const userQuery = `
      SELECT u.id, u.name, u.email, u.mobile, u.role_id, u.status, u.last_login, u.created_at, u.updated_at,
             r.name AS role_name, r.description AS role_description
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
    `;
    const userResult = await pool.query(userQuery, [id]);
    const user = userResult.rows[0];

    if (!user) return null;

    const permQuery = `
      SELECT p.id, p.permission_key, p.description, p.module
      FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `;
    const permResult = await pool.query(permQuery, [user.role_id]);
    
    user.role = {
      id: user.role_id,
      name: user.role_name,
      description: user.role_description,
    };
    user.permissions = permResult.rows.map((p) => p.permission_key);
    user.permission_details = permResult.rows;

    // Clean up top-level duplicate fields
    delete user.role_name;
    delete user.role_description;

    return user;
  }

  /**
   * Fetch all Staff users with optional search, status filtering, and pagination.
   */
  static async findAllStaff({ search, status, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = [`r.name = 'Staff'`];
    const queryParams = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      whereConditions.push(`(LOWER(u.name) LIKE $${paramIndex} OR LOWER(u.email) LIKE $${paramIndex} OR u.mobile LIKE $${paramIndex})`);
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      paramIndex++;
    }

    if (status && status.trim()) {
      whereConditions.push(`LOWER(u.status) = $${paramIndex}`);
      queryParams.push(status.trim().toLowerCase());
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Count Total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch Paginated List
    const dataQueryParams = [...queryParams, limitNum, offset];
    const dataQuery = `
      SELECT u.id, u.name, u.email, u.mobile, u.role_id, u.status, u.last_login, u.created_at, u.updated_at,
             r.name AS role_name, r.description AS role_description
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE ${whereClause}
      ORDER BY u.id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataResult = await pool.query(dataQuery, dataQueryParams);

    const staff = dataResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      role: {
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
      },
      status: row.status,
      last_login: row.last_login,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      staff,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * Find single Staff user by ID.
   */
  static async findStaffById(id) {
    const query = `
      SELECT u.id, u.name, u.email, u.mobile, u.role_id, u.status, u.last_login, u.created_at, u.updated_at,
             r.name AS role_name, r.description AS role_description
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1 AND r.name = 'Staff'
    `;
    const result = await pool.query(query, [id]);
    const row = result.rows[0];

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      role: {
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
      },
      status: row.status,
      last_login: row.last_login,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Update user profile fields (name, email, mobile).
   */
  static async updateProfile(id, { name, email, mobile, role_id }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined && name !== null) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (email !== undefined && email !== null) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.trim().toLowerCase());
    }

    if (mobile !== undefined) {
      updates.push(`mobile = $${paramIndex++}`);
      values.push(mobile ? mobile.trim() : null);
    }

    if (role_id !== undefined && role_id !== null) {
      const parsedRoleId = parseInt(role_id, 10);
      if (!isNaN(parsedRoleId)) {
        updates.push(`role_id = $${paramIndex++}`);
        values.push(parsedRoleId);
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, mobile, role_id, status, last_login, created_at, updated_at
    `;

    await pool.query(query, values);
    return this.findByIdWithRoleAndPermissions(id);
  }

  /**
   * Update Staff status (active / inactive).
   */
  static async updateStaffStatus(id, status) {
    const query = `
      UPDATE users
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, updated_at
    `;
    await pool.query(query, [status, id]);
    return this.findStaffById(id);
  }

  /**
   * Delete Staff user from users table.
   */
  static async deleteStaff(id) {
    const query = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update user's last login timestamp.
   */
  static async updateLastLogin(id) {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING last_login
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Update user's password_hash.
   */
  static async updatePassword(id, password_hash) {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, updated_at
    `;
    const result = await pool.query(query, [password_hash, id]);
    return result.rows[0];
  }

  /**
   * Create a new user (helper for testing/seeding).
   */
  static async createUser({ name, email, password_hash, mobile, role_id, status = "active" }) {
    const query = `
      INSERT INTO users (name, email, password_hash, mobile, role_id, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, mobile, role_id, status, created_at, updated_at
    `;
    const result = await pool.query(query, [
      name,
      email.toLowerCase(),
      password_hash,
      mobile || null,
      role_id,
      status,
    ]);
    return result.rows[0];
  }
}

module.exports = UserModel;
