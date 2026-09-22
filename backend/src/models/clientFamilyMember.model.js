const pool = require("../config/database");

class ClientFamilyMemberModel {
  static async findFamilyForClient(clientId) {
    // 1. Determine Head: check if clientId is a member under someone else
    const memberCheckQuery = `
      SELECT client_id FROM client_family_members WHERE member_client_id = $1 LIMIT 1
    `;
    const memberCheckResult = await pool.query(memberCheckQuery, [clientId]);

    let headId = clientId;
    let isCurrentClientHead = true;

    if (memberCheckResult.rows.length > 0) {
      headId = memberCheckResult.rows[0].client_id;
      isCurrentClientHead = Number(headId) === Number(clientId);
    }

    // 2. Fetch head details
    const headQuery = `
      SELECT id, name, ucc_no, mobile_no, email, pan, dob, gender
      FROM clients
      WHERE id = $1
    `;
    const headResult = await pool.query(headQuery, [headId]);
    const headClient = headResult.rows[0] || null;

    const familyHead = headClient
      ? {
          id: headClient.id,
          name: headClient.name,
          ucc_no: headClient.ucc_no,
          mobile_no: headClient.mobile_no,
          email: headClient.email,
          pan: headClient.pan,
          is_self: isCurrentClientHead,
        }
      : null;

    // 3. Fetch all members linked to headId
    const membersQuery = `
      SELECT 
        cfm.id,
        cfm.client_id,
        cfm.member_client_id,
        cfm.relationship,
        cfm.created_at,
        cfm.updated_at,
        c.name AS client_name,
        c.ucc_no AS client_ucc_no,
        c.email AS client_email,
        c.mobile_no AS client_mobile_no,
        c.pan AS client_pan_no,
        c.dob AS client_dob,
        c.gender AS client_gender,
        cfm.name AS fallback_name,
        cfm.email AS fallback_email,
        cfm.mobile_no AS fallback_mobile_no,
        cfm.pan_no AS fallback_pan_no,
        cfm.dob AS fallback_dob,
        cfm.gender AS fallback_gender
      FROM client_family_members cfm
      LEFT JOIN clients c ON c.id = cfm.member_client_id
      WHERE cfm.client_id = $1
      ORDER BY cfm.id ASC
    `;
    const membersResult = await pool.query(membersQuery, [headId]);

    const familyMembers = [];

    // If current client is a member (not head), include the head as the first entry in family_members
    if (!isCurrentClientHead && headClient) {
      familyMembers.push({
        id: null,
        client_id: headClient.id,
        member_client_id: headClient.id,
        relationship: "Family Head",
        name: headClient.name,
        ucc_no: headClient.ucc_no,
        email: headClient.email,
        mobile_no: headClient.mobile_no,
        pan_no: headClient.pan,
        dob: headClient.dob,
        gender: headClient.gender,
        is_head: true,
        is_current: false,
      });
    }

    for (const row of membersResult.rows) {
      familyMembers.push({
        id: row.id,
        client_id: row.client_id,
        member_client_id: row.member_client_id,
        relationship: row.relationship,
        name: row.client_name || row.fallback_name || "Unknown",
        ucc_no: row.client_ucc_no || "",
        email: row.client_email || row.fallback_email || null,
        mobile_no: row.client_mobile_no || row.fallback_mobile_no || null,
        pan_no: row.client_pan_no || row.fallback_pan_no || null,
        dob: row.client_dob || row.fallback_dob || null,
        gender: row.client_gender || row.fallback_gender || null,
        is_head: false,
        is_current: Number(row.member_client_id) === Number(clientId),
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    return {
      family_head: familyHead,
      family_members: familyMembers,
    };
  }

  static async findByClientId(clientId) {
    const familyData = await this.findFamilyForClient(clientId);
    return familyData.family_members;
  }

  static async findHeadId(clientId) {
    const query = `
      SELECT client_id FROM client_family_members WHERE member_client_id = $1 LIMIT 1
    `;
    const result = await pool.query(query, [clientId]);
    if (result.rows.length > 0) {
      return result.rows[0].client_id;
    }
    return clientId;
  }

  static async findById(id) {
    const query = `
      SELECT id, client_id, member_client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
      FROM client_family_members
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findExistingLink(clientId, memberClientId) {
    const query = `
      SELECT id, client_id, member_client_id FROM client_family_members 
      WHERE client_id = $1 AND member_client_id = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [clientId, memberClientId]);
    return result.rows[0] || null;
  }

  static async findMemberAnyFamily(memberClientId) {
    const query = `
      SELECT id, client_id, member_client_id FROM client_family_members 
      WHERE member_client_id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [memberClientId]);
    return result.rows[0] || null;
  }

  static async countHeadMembers(headClientId) {
    const query = `
      SELECT COUNT(*) as count FROM client_family_members WHERE client_id = $1
    `;
    const result = await pool.query(query, [headClientId]);
    return parseInt(result.rows[0].count, 10);
  }

  static async create({ client_id, member_client_id, relationship, name, email, mobile_no, pan_no, dob, gender }) {
    const query = `
      INSERT INTO client_family_members (
        client_id, member_client_id, relationship, name, email, mobile_no, pan_no, dob, gender
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, client_id, member_client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
    `;
    const values = [
      client_id,
      member_client_id || null,
      relationship.trim(),
      name ? name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      mobile_no ? mobile_no.trim() : null,
      pan_no ? pan_no.trim().toUpperCase() : null,
      dob || null,
      gender ? gender.trim() : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, { relationship, name, email, mobile_no, pan_no, dob, gender }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (relationship !== undefined) {
      fields.push(`relationship = $${idx++}`);
      values.push(relationship.trim());
    }
    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email ? email.trim().toLowerCase() : null);
    }
    if (mobile_no !== undefined) {
      fields.push(`mobile_no = $${idx++}`);
      values.push(mobile_no ? mobile_no.trim() : null);
    }
    if (pan_no !== undefined) {
      fields.push(`pan_no = $${idx++}`);
      values.push(pan_no ? pan_no.trim().toUpperCase() : null);
    }
    if (dob !== undefined) {
      fields.push(`dob = $${idx++}`);
      values.push(dob || null);
    }
    if (gender !== undefined) {
      fields.push(`gender = $${idx++}`);
      values.push(gender ? gender.trim() : null);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE client_family_members
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, client_id, member_client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `DELETE FROM client_family_members WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = ClientFamilyMemberModel;
