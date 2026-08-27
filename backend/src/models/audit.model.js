const pool = require("../config/database");

class AuditModel {
  /**
   * Create a new audit log record.
   */
  static async create({
    user_id,
    action,
    module,
    entity_type,
    entity_id,
    description,
    old_values,
    new_values,
    ip_address,
  }, dbClient = null) {
    const client = dbClient || pool;
    const query = `
      INSERT INTO audit_logs (
        user_id, action, module, entity_type, entity_id, description, old_values, new_values, ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, user_id, action, module, entity_type, entity_id, description, old_values, new_values, ip_address, created_at
    `;

    const values = [
      user_id || null,
      action ? action.toUpperCase() : "UNKNOWN",
      module ? module.toUpperCase() : "GENERAL",
      entity_type ? entity_type.toUpperCase() : "ENTITY",
      entity_id ? parseInt(entity_id, 10) || null : null,
      description || null,
      old_values ? JSON.stringify(old_values) : null,
      new_values ? JSON.stringify(new_values) : null,
      ip_address || null,
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  /**
   * Fetch paginated audit logs with search, user, module, action, and date range filters.
   */
  static async findAll({
    page = 1,
    limit = 20,
    search = "",
    user_id = null,
    module = "",
    action = "",
    start_date = "",
    end_date = "",
  } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const pIdx = params.length;
      conditions.push(`(
        a.description ILIKE $${pIdx} OR
        a.module ILIKE $${pIdx} OR
        a.action ILIKE $${pIdx} OR
        a.entity_type ILIKE $${pIdx} OR
        u.name ILIKE $${pIdx} OR
        u.email ILIKE $${pIdx}
      )`);
    }

    if (user_id && parseInt(user_id, 10)) {
      params.push(parseInt(user_id, 10));
      conditions.push(`a.user_id = $${params.length}`);
    }

    if (module && module.trim() && module.toLowerCase() !== "all") {
      params.push(module.trim().toUpperCase());
      conditions.push(`a.module = $${params.length}`);
    }

    if (action && action.trim() && action.toLowerCase() !== "all") {
      params.push(action.trim().toUpperCase());
      conditions.push(`a.action = $${params.length}`);
    }

    if (start_date && start_date.trim()) {
      params.push(start_date.trim());
      conditions.push(`a.created_at >= $${params.length}::timestamp`);
    }

    if (end_date && end_date.trim()) {
      params.push(end_date.trim());
      conditions.push(`a.created_at <= $${params.length}::timestamp`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT
        a.id,
        a.user_id,
        u.name AS user_name,
        u.email AS user_email,
        a.action,
        a.module,
        a.entity_type,
        a.entity_id,
        a.description,
        a.old_values,
        a.new_values,
        a.ip_address,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ${whereClause}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, dataParams);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedLogs = dataResult.rows.map((row) => ({
      id: row.id,
      user: row.user_id
        ? {
            id: row.user_id,
            name: row.user_name || "Unknown User",
            email: row.user_email || "",
          }
        : null,
      action: row.action,
      module: row.module,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      description: row.description,
      old_values: row.old_values,
      new_values: row.new_values,
      ip_address: row.ip_address,
      created_at: row.created_at,
    }));

    return {
      audit_logs: formattedLogs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages,
      },
    };
  }
}

module.exports = AuditModel;
