const pool = require("../config/database");

class ClientFamilyMemberModel {
  static async findByClientId(clientId) {
    const query = `
      SELECT id, client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
      FROM client_family_members
      WHERE client_id = $1
      ORDER BY id ASC
    `;
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT id, client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
      FROM client_family_members
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create({ client_id, relationship, name, email, mobile_no, pan_no, dob, gender }) {
    const query = `
      INSERT INTO client_family_members (
        client_id, relationship, name, email, mobile_no, pan_no, dob, gender
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
    `;
    const values = [
      client_id,
      relationship.trim(),
      name.trim(),
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
      RETURNING id, client_id, relationship, name, email, mobile_no, pan_no, dob, gender, created_at, updated_at
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
