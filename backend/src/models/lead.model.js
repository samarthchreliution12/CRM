const pool = require("../config/database");

const VALID_STATUSES = ["new", "contacted", "interested", "prospect", "converted", "lost"];
const VALID_PRIORITIES = ["low", "medium", "high"];

class LeadModel {
  /**
   * Helper to format raw database row into structured Lead JSON object.
   */
  static formatLeadRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      mobile_no: row.mobile_no,
      whatsapp_no: row.whatsapp_no,
      email: row.email,
      company_name: row.company_name,
      source: row.source,
      status: row.status,
      priority: row.priority,
      next_follow_up_at: row.next_follow_up_at,
      last_contacted_at: row.last_contacted_at,
      notes: row.notes,
      assigned_to: row.assigned_to,
      created_by: row.created_by,
      client_type_id: row.client_type_id,
      service_id: row.service_id,
      converted_client_id: row.converted_client_id,
      converted_at: row.converted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      assigned_staff: row.assigned_staff_id
        ? {
            id: row.assigned_staff_id,
            name: row.assigned_staff_name,
            email: row.assigned_staff_email,
          }
        : null,
      created_by_user: row.creator_id
        ? {
            id: row.creator_id,
            name: row.creator_name,
            email: row.creator_email,
          }
        : null,
      client_type: row.client_type_id
        ? {
            id: row.client_type_id,
            name: row.client_type_name,
            description: row.client_type_desc,
          }
        : null,
      service: row.service_id
        ? {
            id: row.service_id,
            name: row.service_name,
            description: row.service_desc,
          }
        : null,
      converted_client: row.converted_client_id
        ? {
            id: row.converted_client_id,
            ucc_no: row.converted_client_ucc,
            name: row.converted_client_name,
          }
        : null,
    };
  }

  /**
   * Base SQL Select fields with JOINs for related entities.
   */
  static get baseSelectQuery() {
    return `
      SELECT
        l.id, l.name, l.mobile_no, l.whatsapp_no, l.email, l.company_name,
        l.source, l.status, l.priority, l.next_follow_up_at, l.last_contacted_at,
        l.notes, l.assigned_to, l.created_by, l.client_type_id, l.service_id,
        l.converted_client_id, l.converted_at, l.created_at, l.updated_at,
        su.id AS assigned_staff_id, su.name AS assigned_staff_name, su.email AS assigned_staff_email,
        cu.id AS creator_id, cu.name AS creator_name, cu.email AS creator_email,
        ct.id AS client_type_id, ct.name AS client_type_name, ct.description AS client_type_desc,
        cs.id AS service_id, cs.name AS service_name, cs.description AS service_desc,
        cl.id AS converted_client_id, cl.ucc_no AS converted_client_ucc, cl.name AS converted_client_name
      FROM leads l
      LEFT JOIN users su ON su.id = l.assigned_to
      INNER JOIN users cu ON cu.id = l.created_by
      LEFT JOIN client_types ct ON ct.id = l.client_type_id
      LEFT JOIN client_services cs ON cs.id = l.service_id
      LEFT JOIN clients cl ON cl.id = l.converted_client_id
    `;
  }

  /**
   * Create a new Lead record.
   */
  static async create({
    name,
    mobile_no,
    whatsapp_no,
    email,
    company_name,
    client_type_id,
    source,
    service_id,
    status = "new",
    assigned_to,
    priority = "medium",
    next_follow_up_at,
    last_contacted_at,
    notes,
    created_by,
  }) {
    const cleanStatus = status && VALID_STATUSES.includes(status.toLowerCase()) ? status.toLowerCase() : "new";
    const cleanPriority = priority && VALID_PRIORITIES.includes(priority.toLowerCase()) ? priority.toLowerCase() : "medium";

    const insertQuery = `
      INSERT INTO leads (
        name, mobile_no, whatsapp_no, email, company_name, client_type_id,
        source, service_id, status, assigned_to, priority, next_follow_up_at,
        last_contacted_at, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `;
    const values = [
      name.trim(),
      mobile_no ? mobile_no.trim() : null,
      whatsapp_no ? whatsapp_no.trim() : null,
      email ? email.trim().toLowerCase() : null,
      company_name ? company_name.trim() : null,
      client_type_id ? parseInt(client_type_id, 10) : null,
      source ? source.trim() : null,
      service_id ? parseInt(service_id, 10) : null,
      cleanStatus,
      assigned_to ? parseInt(assigned_to, 10) : null,
      cleanPriority,
      next_follow_up_at || null,
      last_contacted_at || null,
      notes ? notes.trim() : null,
      parseInt(created_by, 10),
    ];

    const result = await pool.query(insertQuery, values);
    const leadId = result.rows[0].id;
    return this.findById(leadId);
  }

  /**
   * Fetch single Lead by ID with related entity details.
   */
  static async findById(id) {
    const query = `${this.baseSelectQuery} WHERE l.id = $1`;
    const result = await pool.query(query, [parseInt(id, 10)]);
    if (result.rows.length === 0) return null;
    return this.formatLeadRow(result.rows[0]);
  }

  /**
   * Fetch leads with full filtering capability for Kanban or List view.
   */
  static async findAll({
    search,
    status,
    assigned_to,
    source,
    service_id,
    client_type_id,
    priority,
    my_leads,
    user_id,
    page = 1,
    limit = 100,
  } = {}) {
    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      const pIdx = params.length + 1;
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(l.name) LIKE $${pIdx} OR
        l.mobile_no LIKE $${pIdx} OR
        l.whatsapp_no LIKE $${pIdx} OR
        LOWER(l.email) LIKE $${pIdx} OR
        LOWER(l.company_name) LIKE $${pIdx}
      )`);
    }

    if (status && status.trim() && status.toLowerCase() !== "all") {
      params.push(status.trim().toLowerCase());
      conditions.push(`l.status = $${params.length}`);
    }

    if (assigned_to && parseInt(assigned_to, 10)) {
      params.push(parseInt(assigned_to, 10));
      conditions.push(`l.assigned_to = $${params.length}`);
    }

    if (my_leads && (my_leads === true || my_leads === "true") && user_id) {
      params.push(parseInt(user_id, 10));
      conditions.push(`l.assigned_to = $${params.length}`);
    }

    if (source && source.trim() && source.toLowerCase() !== "all") {
      params.push(source.trim());
      conditions.push(`LOWER(l.source) = LOWER($${params.length})`);
    }

    if (service_id && parseInt(service_id, 10)) {
      params.push(parseInt(service_id, 10));
      conditions.push(`l.service_id = $${params.length}`);
    }

    if (client_type_id && parseInt(client_type_id, 10)) {
      params.push(parseInt(client_type_id, 10));
      conditions.push(`l.client_type_id = $${params.length}`);
    }

    if (priority && priority.trim() && priority.toLowerCase() !== "all") {
      params.push(priority.trim().toLowerCase());
      conditions.push(`l.priority = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM leads l ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 100));
    const offset = (pageNum - 1) * limitNum;

    const dataParams = [...params, limitNum, offset];
    const dataQuery = `
      ${this.baseSelectQuery}
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, dataParams);
    const leads = dataResult.rows.map((row) => this.formatLeadRow(row));

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      leads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * Update specified fields of a Lead record.
   */
  static async update(id, fieldsToUpdate = {}) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      "name",
      "mobile_no",
      "whatsapp_no",
      "email",
      "company_name",
      "client_type_id",
      "source",
      "service_id",
      "assigned_to",
      "priority",
      "next_follow_up_at",
      "last_contacted_at",
      "notes",
    ];

    for (const field of allowedFields) {
      if (fieldsToUpdate[field] !== undefined) {
        let val = fieldsToUpdate[field];
        if (typeof val === "string") val = val.trim();
        if (field === "email" && val) val = val.toLowerCase();
        if (["client_type_id", "service_id", "assigned_to"].includes(field)) {
          val = val ? parseInt(val, 10) : null;
        }

        fields.push(`${field} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(id, 10));

    const query = `UPDATE leads SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`;
    await pool.query(query, values);
    return this.findById(id);
  }

  /**
   * Dedicated status update method for Kanban drag-and-drop.
   */
  static async updateStatus(id, status, { last_contacted_at } = {}) {
    const cleanStatus = status.toLowerCase();
    const fields = [`status = $1`, `updated_at = CURRENT_TIMESTAMP`];
    const values = [cleanStatus, parseInt(id, 10)];

    if (last_contacted_at !== undefined) {
      fields.push(`last_contacted_at = $3`);
      values.push(last_contacted_at);
    } else if (cleanStatus === "contacted") {
      fields.push(`last_contacted_at = CURRENT_TIMESTAMP`);
    }

    const query = `UPDATE leads SET ${fields.join(", ")} WHERE id = $2 RETURNING id`;
    await pool.query(query, values);
    return this.findById(id);
  }

  /**
   * Atomic Lead Conversion to Client.
   * Creates client, links lead to client, updates lead status to 'converted',
   * all wrapped in a PostgreSQL transaction.
   */
  static async convertLeadToClient(leadId, { ucc_no, client_type_id, pan, dob } = {}, currentUserId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Lock and fetch lead row
      const lockQuery = `SELECT * FROM leads WHERE id = $1 FOR UPDATE`;
      const leadRes = await client.query(lockQuery, [parseInt(leadId, 10)]);
      if (leadRes.rows.length === 0) {
        const err = new Error("Lead not found");
        err.statusCode = 404;
        throw err;
      }

      const lead = leadRes.rows[0];

      if (lead.converted_client_id || lead.status === "converted") {
        const err = new Error("This lead has already been converted to a client.");
        err.statusCode = 400;
        throw err;
      }

      // 2. Mandatory DOB and PAN checks inside transaction
      if (!dob || !dob.toString().trim() || !pan || !pan.toString().trim()) {
        const err = new Error("Date of birth and PAN number are required to convert this lead into a client.");
        err.statusCode = 400;
        throw err;
      }

      const cleanPan = pan.toString().trim().toUpperCase();

      // Check PAN uniqueness
      const existingPanRes = await client.query(`SELECT id FROM clients WHERE UPPER(pan) = $1`, [cleanPan]);
      if (existingPanRes.rows.length > 0) {
        const err = new Error("A client with this PAN number already exists.");
        err.statusCode = 400;
        throw err;
      }

      // 3. Resolve client_type_id
      let finalClientTypeId = client_type_id || lead.client_type_id;
      if (!finalClientTypeId) {
        const defaultTypeRes = await client.query(`SELECT id FROM client_types WHERE status = 'active' ORDER BY id ASC LIMIT 1`);
        if (defaultTypeRes.rows.length === 0) {
          const err = new Error("No active client types exist. Please create a client type first.");
          err.statusCode = 400;
          throw err;
        }
        finalClientTypeId = defaultTypeRes.rows[0].id;
      } else {
        const typeCheck = await client.query(`SELECT id FROM client_types WHERE id = $1`, [parseInt(finalClientTypeId, 10)]);
        if (typeCheck.rows.length === 0) {
          const err = new Error("Specified client type does not exist");
          err.statusCode = 400;
          throw err;
        }
      }

      // 4. Generate unique UCC number if not provided
      let finalUccNo = ucc_no ? ucc_no.trim().toUpperCase() : null;
      if (!finalUccNo) {
        const timestampPart = Date.now().toString().slice(-6);
        const randomHex = Math.floor(Math.random() * 8999 + 1000);
        finalUccNo = `CLT${timestampPart}${randomHex}`;
      }

      // Check UCC uniqueness
      const existingUcc = await client.query(`SELECT id FROM clients WHERE LOWER(ucc_no) = LOWER($1)`, [finalUccNo]);
      if (existingUcc.rows.length > 0) {
        const timestampPart = Date.now().toString().slice(-6);
        const randomHex = Math.floor(Math.random() * 8999 + 1000);
        finalUccNo = `CLT${timestampPart}${randomHex}`;
      }

      // 5. Create new client record in clients table
      const insertClientQuery = `
        INSERT INTO clients (
          ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob,
          client_type_id, status, services
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', '[]'::jsonb)
        RETURNING id, ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, client_type_id, status, created_at
      `;
      const clientValues = [
        finalUccNo,
        lead.name,
        lead.company_name,
        lead.mobile_no,
        lead.whatsapp_no,
        lead.email,
        cleanPan,
        dob,
        finalClientTypeId,
      ];

      const clientResult = await client.query(insertClientQuery, clientValues);
      const newClient = clientResult.rows[0];

      // 6. Attach service assignment if lead had a service_id
      if (lead.service_id) {
        await client.query(
          `INSERT INTO client_service_assignments (client_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newClient.id, lead.service_id]
        );
      }

      // 6. Update lead record status to 'converted'
      const updateLeadQuery = `
        UPDATE leads
        SET status = 'converted',
            converted_client_id = $1,
            converted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id
      `;
      await client.query(updateLeadQuery, [newClient.id, lead.id]);

      await client.query("COMMIT");

      // 7. Fetch full updated lead record
      const updatedLead = await this.findById(lead.id);

      return {
        lead: updatedLead,
        client: newClient,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Delete lead if not converted.
   */
  static async delete(id) {
    const lead = await this.findById(id);
    if (!lead) return false;

    if (lead.converted_client_id || lead.status === "converted") {
      const err = new Error("Converted leads cannot be deleted.");
      err.statusCode = 400;
      throw err;
    }

    const query = `DELETE FROM leads WHERE id = $1`;
    await pool.query(query, [parseInt(id, 10)]);
    return true;
  }
}

module.exports = {
  LeadModel,
  VALID_STATUSES,
  VALID_PRIORITIES,
};
