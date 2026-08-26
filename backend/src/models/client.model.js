const pool = require("../config/database");

class ClientModel {
  /**
   * Helper to resolve and validate service IDs from service_ids or service names array.
   */
  static async resolveAndValidateServices(serviceInputs, clientObj = null) {
    if (!serviceInputs || !Array.isArray(serviceInputs) || serviceInputs.length === 0) {
      return [];
    }

    // Deduplicate inputs
    const uniqueInputs = Array.from(new Set(serviceInputs));
    const serviceIdsToValidate = [];
    const serviceNamesToResolve = [];

    for (const val of uniqueInputs) {
      if (typeof val === "number" || (typeof val === "string" && /^\d+$/.test(val.trim()))) {
        serviceIdsToValidate.push(parseInt(val, 10));
      } else if (typeof val === "string" && val.trim()) {
        serviceNamesToResolve.push(val.trim());
      }
    }

    // Resolve string names to IDs
    if (serviceNamesToResolve.length > 0) {
      const nameRes = await pool.query(
        `SELECT id, name, status FROM client_services WHERE LOWER(name) = ANY($1::text[])`,
        [serviceNamesToResolve.map((n) => n.toLowerCase())]
      );
      for (const row of nameRes.rows) {
        if (!serviceIdsToValidate.includes(row.id)) {
          serviceIdsToValidate.push(row.id);
        }
      }
    }

    if (serviceIdsToValidate.length === 0) {
      return [];
    }

    // Validate existence and active status
    const validRes = await pool.query(
      `SELECT id, name, status FROM client_services WHERE id = ANY($1::int[])`,
      [serviceIdsToValidate]
    );

    const foundIds = validRes.rows.map((r) => r.id);
    const missingIds = serviceIdsToValidate.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      const err = new Error(`Invalid service ID(s): ${missingIds.join(", ")} do not exist.`);
      err.statusCode = 400;
      throw err;
    }

    const inactiveServices = validRes.rows.filter((r) => r.status !== "active");
    if (inactiveServices.length > 0) {
      const inactiveNames = inactiveServices.map((s) => `${s.name} (ID: ${s.id})`).join(", ");
      const err = new Error(`Inactive service(s) cannot be assigned: ${inactiveNames}`);
      err.statusCode = 400;
      throw err;
    }

    return serviceIdsToValidate;
  }

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
        c.status,
        c.created_at, c.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', cs.id, 'name', cs.name)
          ) FILTER (WHERE cs.id IS NOT NULL),
          '[]'::json
        ) AS services
      FROM clients c
      INNER JOIN client_types ct ON ct.id = c.client_type_id
      LEFT JOIN client_service_assignments csa ON csa.client_id = c.id
      LEFT JOIN client_services cs ON cs.id = csa.service_id
      ${whereClause}
      GROUP BY c.id, ct.name
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
        c.status,
        c.created_at, c.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', cs.id, 'name', cs.name, 'description', cs.description)
          ) FILTER (WHERE cs.id IS NOT NULL),
          '[]'::json
        ) AS services
      FROM clients c
      INNER JOIN client_types ct ON ct.id = c.client_type_id
      LEFT JOIN client_service_assignments csa ON csa.client_id = c.id
      LEFT JOIN client_services cs ON cs.id = csa.service_id
      WHERE c.id = $1
      GROUP BY c.id, ct.name, ct.description
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
    service_ids = [],
    services = [],
  }) {
    const combinedServices = [...(Array.isArray(service_ids) ? service_ids : []), ...(Array.isArray(services) ? services : [])];
    const validServiceIds = await this.resolveAndValidateServices(combinedServices);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
        INSERT INTO clients (
          ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation,
          client_type_id, status, services
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
        RETURNING id, ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation,
                  client_type_id, status, created_at, updated_at
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
        JSON.stringify([]),
      ];

      const result = await client.query(query, values);
      const newClient = result.rows[0];

      // Save service assignments in junction table
      if (validServiceIds.length > 0) {
        for (const sId of validServiceIds) {
          await client.query(
            `INSERT INTO client_service_assignments (client_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newClient.id, sId]
          );
        }
      }

      await client.query("COMMIT");
      return this.findById(newClient.id);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
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
      service_ids,
      services,
    }
  ) {
    let validServiceIds = null;
    if (service_ids !== undefined || services !== undefined) {
      const combinedServices = [
        ...(Array.isArray(service_ids) ? service_ids : []),
        ...(Array.isArray(services) ? services : []),
      ];
      validServiceIds = await this.resolveAndValidateServices(combinedServices);
    }

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

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (fields.length > 1) {
        const query = `
          UPDATE clients
          SET ${fields.join(", ")}
          WHERE id = $${idx}
          RETURNING id
        `;
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
          await client.query("ROLLBACK");
          return null;
        }
      }

      // Replace service assignments if service_ids or services was passed
      if (validServiceIds !== null) {
        await client.query(`DELETE FROM client_service_assignments WHERE client_id = $1`, [id]);
        for (const sId of validServiceIds) {
          await client.query(
            `INSERT INTO client_service_assignments (client_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, sId]
          );
        }
      }

      await client.query("COMMIT");
      return this.findById(id);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
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
      // Delete family members
      await client.query("DELETE FROM client_family_members WHERE client_id = $1", [id]);
      // Delete service assignments
      await client.query("DELETE FROM client_service_assignments WHERE client_id = $1", [id]);
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
