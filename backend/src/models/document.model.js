const pool = require("../config/database");

class DocumentModel {
  /**
   * Create new client document metadata record.
   */
  static async create({
    client_id,
    document_type,
    document_name = null,
    original_file_name,
    stored_file_name,
    mime_type,
    file_size,
    storage_path,
    encryption_version = "v1",
    encryption_key_id = "default",
    iv,
    auth_tag,
    uploaded_by,
  }) {
    const query = `
      INSERT INTO client_documents (
        client_id, document_type, document_name, original_file_name, stored_file_name, mime_type,
        file_size, storage_path, encryption_version, encryption_key_id, iv, auth_tag,
        status, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', $13)
      RETURNING id, client_id, document_type, document_name, original_file_name, mime_type, file_size, status, uploaded_by, created_at, updated_at
    `;

    const values = [
      client_id,
      document_type.toUpperCase(),
      document_name ? document_name.trim() : null,
      original_file_name,
      stored_file_name,
      mime_type,
      file_size,
      storage_path,
      encryption_version,
      encryption_key_id,
      iv,
      auth_tag,
      uploaded_by || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * List documents belonging to a specific client with pagination & filters.
   */
  static async findByClientId(client_id, { status = "", document_type = "", search = "", page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const conditions = ["client_id = $1"];
    const values = [client_id];
    let paramIdx = 2;

    if (status && status !== "all") {
      conditions.push(`LOWER(status) = LOWER($${paramIdx})`);
      values.push(status.trim());
      paramIdx++;
    }

    if (document_type && document_type !== "all") {
      conditions.push(`UPPER(document_type) = UPPER($${paramIdx})`);
      values.push(document_type.trim());
      paramIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(original_file_name ILIKE $${paramIdx} OR document_type ILIKE $${paramIdx} OR document_name ILIKE $${paramIdx})`);
      values.push(`%${search.trim()}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(" AND ");

    const countQuery = `SELECT COUNT(*) FROM client_documents WHERE ${whereClause}`;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataQuery = `
      SELECT
        cd.id,
        cd.client_id,
        cd.document_type,
        cd.document_name,
        cd.original_file_name,
        cd.mime_type,
        cd.file_size,
        cd.status,
        cd.uploaded_by,
        u.name AS uploaded_by_name,
        cd.verified_by,
        cd.verified_at,
        cd.rejection_reason,
        cd.created_at,
        cd.updated_at
      FROM client_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE ${whereClause.replace(/(\b)(client_id|status|document_type|original_file_name|document_name)(\b)/g, 'cd.$2')}
      ORDER BY cd.id DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    values.push(limitNum, offset);
    const dataRes = await pool.query(dataQuery, values);

    return {
      documents: dataRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * List all documents across all clients for Admin/Staff document management.
   */
  static async findAllAdmin({ search = "", status = "", document_type = "", client_id = "", page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (client_id) {
      conditions.push(`cd.client_id = $${paramIdx}`);
      values.push(parseInt(client_id, 10));
      paramIdx++;
    }

    if (status && status !== "all") {
      conditions.push(`LOWER(cd.status) = LOWER($${paramIdx})`);
      values.push(status.trim());
      paramIdx++;
    }

    if (document_type && document_type !== "all") {
      conditions.push(`UPPER(cd.document_type) = UPPER($${paramIdx})`);
      values.push(document_type.trim());
      paramIdx++;
    }

    if (search && search.trim()) {
      conditions.push(`(c.name ILIKE $${paramIdx} OR c.ucc_no ILIKE $${paramIdx} OR cd.original_file_name ILIKE $${paramIdx} OR cd.document_type ILIKE $${paramIdx} OR cd.document_name ILIKE $${paramIdx})`);
      values.push(`%${search.trim()}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*)
      FROM client_documents cd
      JOIN clients c ON cd.client_id = c.id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataQuery = `
      SELECT
        cd.id,
        cd.client_id,
        c.name AS client_name,
        c.ucc_no AS client_ucc,
        cd.document_type,
        cd.document_name,
        cd.original_file_name,
        cd.mime_type,
        cd.file_size,
        cd.status,
        cd.uploaded_by,
        u.name AS uploaded_by_name,
        cd.verified_by,
        cd.verified_at,
        cd.rejection_reason,
        cd.created_at,
        cd.updated_at
      FROM client_documents cd
      JOIN clients c ON cd.client_id = c.id
      LEFT JOIN users u ON cd.uploaded_by = u.id
      ${whereClause}
      ORDER BY cd.id DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    values.push(limitNum, offset);
    const dataRes = await pool.query(dataQuery, values);

    return {
      documents: dataRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Find document record by ID.
   */
  static async findById(id) {
    const query = `
      SELECT
        id, client_id, document_type, document_name, original_file_name, stored_file_name, mime_type, file_size,
        storage_path, encryption_version, encryption_key_id, iv, auth_tag, status, uploaded_by,
        verified_by, verified_at, rejection_reason, created_at, updated_at
      FROM client_documents
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Update/Replace document record. Always resets status to PENDING and clears verified/rejected fields.
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIdx = 1;

    // Build dynamic update SET clause
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${paramIdx}`);
      values.push(value);
      paramIdx++;
    }

    // Always reset status to PENDING and clear verified/rejection info on document replacement
    fields.push(`status = 'PENDING'`);
    fields.push(`verified_by = NULL`);
    fields.push(`verified_at = NULL`);
    fields.push(`rejection_reason = NULL`);
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const query = `
      UPDATE client_documents
      SET ${fields.join(", ")}
      WHERE id = $${paramIdx}
      RETURNING id, client_id, document_type, document_name, original_file_name, mime_type, file_size, status, uploaded_by, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Approve a PENDING document.
   */
  static async approve(id, verified_by) {
    const query = `
      UPDATE client_documents
      SET
        status = 'VERIFIED',
        verified_by = $1,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND UPPER(status) = 'PENDING'
      RETURNING id, client_id, document_type, document_name, status, verified_by, verified_at, updated_at
    `;
    const result = await pool.query(query, [verified_by, id]);
    return result.rows[0] || null;
  }

  /**
   * Reject a PENDING document.
   */
  static async reject(id, verified_by, rejection_reason) {
    const query = `
      UPDATE client_documents
      SET
        status = 'REJECTED',
        verified_by = $1,
        verified_at = CURRENT_TIMESTAMP,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND UPPER(status) = 'PENDING'
      RETURNING id, client_id, document_type, document_name, status, verified_by, verified_at, rejection_reason, updated_at
    `;
    const result = await pool.query(query, [verified_by, rejection_reason, id]);
    return result.rows[0] || null;
  }

  /**
   * Delete a document record.
   */
  static async delete(id) {
    const query = `DELETE FROM client_documents WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Log action into document_audit_logs.
   */
  static async logAudit({ user_id, client_id, document_id, action }) {
    const query = `
      INSERT INTO document_audit_logs (user_id, client_id, document_id, action)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    await pool.query(query, [user_id || null, client_id, document_id || null, action]);
  }
}

module.exports = DocumentModel;
