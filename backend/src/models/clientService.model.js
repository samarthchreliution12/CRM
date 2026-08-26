const pool = require("../config/database");

class ClientServiceModel {
  static async findAll({ search = "", status = "", page, limit } = {}) {
    const params = [];
    const conditions = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      conditions.push(`(LOWER(name) LIKE LOWER($${idx}) OR LOWER(description) LIKE LOWER($${idx}))`);
    }

    if (status && status.trim() && status.toLowerCase() !== "all") {
      params.push(status.trim().toLowerCase());
      conditions.push(`LOWER(status) = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count Total Records
    const countQuery = `SELECT COUNT(*) AS total FROM client_services ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    let dataQuery = `
      SELECT id, name, description, status, created_at, updated_at
      FROM client_services
      ${whereClause}
      ORDER BY id ASC
    `;

    let pageNum = page ? parseInt(page, 10) : null;
    let limitNum = limit ? parseInt(limit, 10) : null;

    if (pageNum && limitNum) {
      const offset = (pageNum - 1) * limitNum;
      dataQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
    }

    const dataResult = await pool.query(dataQuery, params);
    const clientServices = dataResult.rows;

    if (pageNum && limitNum) {
      const totalPages = Math.ceil(total / limitNum) || 1;
      return {
        client_services: clientServices,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      };
    }

    return clientServices;
  }

  static async findById(id) {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM client_services
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM client_services
      WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name.trim()]);
    return result.rows[0] || null;
  }

  static async findByIds(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const query = `
      SELECT id, name, description, status, created_at, updated_at
      FROM client_services
      WHERE id = ANY($1::int[])
    `;
    const result = await pool.query(query, [ids]);
    return result.rows;
  }

  static async countAssignments(id) {
    const query = `SELECT COUNT(*) AS count FROM client_service_assignments WHERE service_id = $1`;
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count, 10);
  }

  static async create({ name, description = null, status = "active" }) {
    const query = `
      INSERT INTO client_services (name, description, status)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, status, created_at, updated_at
    `;
    const values = [
      name.trim(),
      description ? description.trim() : null,
      status ? status.trim().toLowerCase() : "active",
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, { name, description, status }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined && name !== null) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }

    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description ? description.trim() : null);
    }

    if (status !== undefined && status !== null) {
      fields.push(`status = $${idx++}`);
      values.push(status.trim().toLowerCase());
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE client_services
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, name, description, status, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `DELETE FROM client_services WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = ClientServiceModel;
