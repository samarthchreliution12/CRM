const pool = require("../config/database");

class ClientModel {
  static async findAll({ search = "", status = "", client_type_id = "", page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const pIdx = params.length;
      conditions.push(`(
        c.name ILIKE $${pIdx} OR
        c.business_name ILIKE $${pIdx} OR
        c.ucc_no ILIKE $${pIdx} OR
        c.mobile_no ILIKE $${pIdx} OR
        c.whatsapp_no ILIKE $${pIdx} OR
        c.email ILIKE $${pIdx} OR
        c.pan ILIKE $${pIdx}
      )`);
    }

    if (status && status.trim() && status.toLowerCase() !== "all") {
      params.push(status.trim().toLowerCase());
      conditions.push(`c.status = $${params.length}`);
    }

    if (client_type_id && parseInt(client_type_id, 10)) {
      params.push(parseInt(client_type_id, 10));
      conditions.push(`c.client_type_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM clients c ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT
        c.id, c.ucc_no, c.name, c.business_name, c.mobile_no, c.whatsapp_no, c.email, c.pan, c.dob, c.gender, c.occupation,
        c.client_type_id, ct.name AS client_type_name,
        c.status, c.services,
        c.created_at, c.updated_at
      FROM clients c
      INNER JOIN client_types ct ON ct.id = c.client_type_id
      ${whereClause}
      ORDER BY c.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, dataParams);
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedClients = dataResult.rows.map((row) => ({
      id: row.id,
      ucc_no: row.ucc_no,
      name: row.name,
      business_name: row.business_name,
      mobile_no: row.mobile_no,
      whatsapp_no: row.whatsapp_no,
      email: row.email,
      pan: row.pan,
      dob: row.dob,
      gender: row.gender,
      occupation: row.occupation,
      client_type: {
        id: row.client_type_id,
        name: row.client_type_name,
      },
      status: row.status,
      services: Array.isArray(row.services) ? row.services : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return {
      clients: formattedClients,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages,
      },
    };
  }

  static async findById(id) {
    const clientQuery = `
      SELECT
        c.id, c.ucc_no, c.name, c.business_name, c.mobile_no, c.whatsapp_no, c.email, c.pan, c.dob, c.gender, c.occupation,
        c.client_type_id, ct.name AS client_type_name, ct.description AS client_type_desc,
        c.status, c.services,
        c.created_at, c.updated_at
      FROM clients c
      INNER JOIN client_types ct ON ct.id = c.client_type_id
      WHERE c.id = $1
    `;
    const clientResult = await pool.query(clientQuery, [id]);
    if (clientResult.rows.length === 0) return null;

    const row = clientResult.rows[0];

    // Fetch family members
    const familyQuery = `
      SELECT id, client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
      FROM client_family_members
      WHERE client_id = $1
      ORDER BY id ASC
    `;
    const familyResult = await pool.query(familyQuery, [id]);

    return {
      id: row.id,
      ucc_no: row.ucc_no,
      name: row.name,
      business_name: row.business_name,
      mobile_no: row.mobile_no,
      whatsapp_no: row.whatsapp_no,
      email: row.email,
      pan: row.pan,
      dob: row.dob,
      gender: row.gender,
      occupation: row.occupation,
      client_type: {
        id: row.client_type_id,
        name: row.client_type_name,
        description: row.client_type_desc,
      },
      status: row.status,
      services: Array.isArray(row.services) ? row.services : [],
      family_members: familyResult.rows,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async findByUcc(ucc_no) {
    const query = `SELECT id, ucc_no, name FROM clients WHERE LOWER(ucc_no) = LOWER($1)`;
    const result = await pool.query(query, [ucc_no.trim()]);
    return result.rows[0] || null;
  }

  static async create({
    ucc_no,
    name,
    business_name,
    mobile_no,
    whatsapp_no,
    email,
    pan,
    dob,
    gender,
    occupation,
    client_type_id,
    status = "active",
    services = [],
  }) {
    const query = `
      INSERT INTO clients (
        ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation,
        client_type_id, status, services
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
      RETURNING id, ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation,
                client_type_id, status, services, created_at, updated_at
    `;
    const values = [
      ucc_no.trim().toUpperCase(),
      name.trim(),
      business_name ? business_name.trim() : null,
      mobile_no ? mobile_no.trim() : null,
      whatsapp_no ? whatsapp_no.trim() : null,
      email ? email.trim().toLowerCase() : null,
      pan ? pan.trim().toUpperCase() : null,
      dob || null,
      gender ? gender.trim() : null,
      occupation ? occupation.trim() : null,
      client_type_id,
      status ? status.trim().toLowerCase() : "active",
      JSON.stringify(Array.isArray(services) ? services : []),
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      services: Array.isArray(row.services) ? row.services : [],
    };
  }

  static async update(
    id,
    {
      ucc_no,
      name,
      business_name,
      mobile_no,
      whatsapp_no,
      email,
      pan,
      dob,
      gender,
      occupation,
      client_type_id,
      status,
      services,
    }
  ) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (ucc_no !== undefined) {
      fields.push(`ucc_no = $${idx++}`);
      values.push(ucc_no.trim().toUpperCase());
    }
    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (business_name !== undefined) {
      fields.push(`business_name = $${idx++}`);
      values.push(business_name ? business_name.trim() : null);
    }
    if (mobile_no !== undefined) {
      fields.push(`mobile_no = $${idx++}`);
      values.push(mobile_no ? mobile_no.trim() : null);
    }
    if (whatsapp_no !== undefined) {
      fields.push(`whatsapp_no = $${idx++}`);
      values.push(whatsapp_no ? whatsapp_no.trim() : null);
    }
    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email ? email.trim().toLowerCase() : null);
    }
    if (pan !== undefined) {
      fields.push(`pan = $${idx++}`);
      values.push(pan ? pan.trim().toUpperCase() : null);
    }
    if (dob !== undefined) {
      fields.push(`dob = $${idx++}`);
      values.push(dob || null);
    }
    if (gender !== undefined) {
      fields.push(`gender = $${idx++}`);
      values.push(gender ? gender.trim() : null);
    }
    if (occupation !== undefined) {
      fields.push(`occupation = $${idx++}`);
      values.push(occupation ? occupation.trim() : null);
    }
    if (client_type_id !== undefined) {
      fields.push(`client_type_id = $${idx++}`);
      values.push(client_type_id);
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status.trim().toLowerCase());
    }
    if (services !== undefined) {
      fields.push(`services = $${idx++}::jsonb`);
      values.push(JSON.stringify(Array.isArray(services) ? services : []));
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE clients
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation,
                client_type_id, status, services, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      services: Array.isArray(row.services) ? row.services : [],
    };
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE clients
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, ucc_no, name, status, updated_at
    `;
    const result = await pool.query(query, [status.trim().toLowerCase(), id]);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Delete family members first
      await client.query("DELETE FROM client_family_members WHERE client_id = $1", [id]);
      // Delete client
      const res = await client.query("DELETE FROM clients WHERE id = $1 RETURNING id", [id]);
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

module.exports = ClientModel;
