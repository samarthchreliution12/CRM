const pool = require("../config/database");

class PermissionModel {
  static async getPermissionsByRoleId(roleId) {
    const query = `
      SELECT p.id, p.permission_key AS name, p.permission_key, p.module, p.action, p.description, p.created_at, p.updated_at
      FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = $1
      ORDER BY p.module ASC, p.id ASC
    `;
    const result = await pool.query(query, [roleId]);
    return result.rows;
  }

  static async findAll({ search = "", module = "", page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(p.permission_key ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.module ILIKE $${params.length})`);
    }

    if (module && module.toLowerCase() !== "all") {
      params.push(module.trim());
      conditions.push(`p.module ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM permissions p ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT p.id, p.permission_key AS name, p.permission_key, p.module, p.action, p.description, p.created_at, p.updated_at
      FROM permissions p
      ${whereClause}
      ORDER BY p.module ASC, p.id ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, dataParams);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      permissions: dataResult.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages,
      },
    };
  }

  static async findById(id) {
    const query = `
      SELECT id, permission_key AS name, permission_key, module, action, description, created_at, updated_at
      FROM permissions
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByKey(key) {
    const query = `
      SELECT id, permission_key AS name, permission_key, module, action, description, created_at, updated_at
      FROM permissions
      WHERE LOWER(permission_key) = LOWER($1)
    `;
    const result = await pool.query(query, [key]);
    return result.rows[0] || null;
  }

  static async findByModuleAndAction(module, action) {
    const query = `
      SELECT id, permission_key AS name, permission_key, module, action, description, created_at, updated_at
      FROM permissions
      WHERE LOWER(module) = LOWER($1) AND LOWER(action) = LOWER($2)
    `;
    const result = await pool.query(query, [module, action]);
    return result.rows[0] || null;
  }

  static async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const query = `
      SELECT id, permission_key AS name, permission_key, module, action, description
      FROM permissions
      WHERE id = ANY($1::int[])
    `;
    const result = await pool.query(query, [ids]);
    return result.rows;
  }

  static async create({ name, module, action, description }) {
    const permission_key = name.trim().toLowerCase();
    const query = `
      INSERT INTO permissions (permission_key, module, action, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, permission_key AS name, permission_key, module, action, description, created_at, updated_at
    `;
    const result = await pool.query(query, [permission_key, module.trim().toLowerCase(), action.trim().toLowerCase(), description.trim()]);
    return result.rows[0];
  }

  static async update(id, { name, module, action, description }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`permission_key = $${idx++}`);
      values.push(name.trim().toLowerCase());
    }
    if (module !== undefined) {
      fields.push(`module = $${idx++}`);
      values.push(module.trim().toLowerCase());
    }
    if (action !== undefined) {
      fields.push(`action = $${idx++}`);
      values.push(action.trim().toLowerCase());
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description.trim());
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE permissions
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, permission_key AS name, permission_key, module, action, description, created_at, updated_at
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async countRoleAssignments(permissionId) {
    const query = `SELECT COUNT(*) AS total FROM role_permissions WHERE permission_id = $1`;
    const result = await pool.query(query, [permissionId]);
    return parseInt(result.rows[0].total, 10);
  }

  static async delete(id) {
    const query = `DELETE FROM permissions WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async replaceRolePermissions(roleId, permissionIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Clear existing mappings for this role
      await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

      // 2. Insert new mappings if provided
      if (permissionIds && permissionIds.length > 0) {
        const uniqueIds = [...new Set(permissionIds)];
        for (const permId of uniqueIds) {
          await client.query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
            [roleId, permId]
          );
        }
      }

      await client.query("COMMIT");

      // 3. Fetch updated permissions for response
      const updatedRes = await client.query(
        `SELECT p.id, p.permission_key AS name, p.permission_key, p.module, p.action, p.description
         FROM permissions p
         INNER JOIN role_permissions rp ON rp.permission_id = p.id
         WHERE rp.role_id = $1
         ORDER BY p.module ASC, p.id ASC`,
        [roleId]
      );

      return updatedRes.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = PermissionModel;
