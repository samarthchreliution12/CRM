const pool = require("../config/database");

class WhatsAppTemplateModel {
  /**
   * Parse and normalize raw ChatterPillar template object into CRM schema fields.
   */
  static parseTemplate(raw) {
    if (!raw || typeof raw !== "object") return null;

    const templateId = String(
      raw.template_id || raw.id || raw.element_name || raw.name || ""
    ).trim();

    if (!templateId) return null;

    const templateName = String(
      raw.template_name || raw.name || raw.element_name || templateId
    ).trim();

    const category = String(
      raw.category_slug || raw.category_name || raw.category || raw.template_category || "UTILITY"
    ).toUpperCase().trim();

    const language = String(
      raw.language_code || raw.language_name || raw.language || raw.lang || "en"
    ).trim();

    const status = String(
      raw.template_status || raw.status || "APPROVED"
    ).toUpperCase().trim();

    let headerType = raw.header_type || (raw.has_header ? (raw.header_format === 1 ? "TEXT" : "MEDIA") : null);
    let headerContent = raw.header_content || null;
    let bodyContent = raw.body_text || raw.body_content || raw.body || "";
    let footerContent = raw.footer_content || raw.footer || null;
    let buttons = Array.isArray(raw.buttons) ? raw.buttons : [];

    // Parse ChatterPillar flat button definitions if present
    if (buttons.length === 0) {
      if (raw.button1_text && String(raw.button1_text).trim()) {
        buttons.push({
          text: raw.button1_text.trim(),
          type: raw.button1_call_to_action_type ? "CTA" : "QUICK_REPLY",
          content: raw.button1_call_to_action_content || null,
        });
      }
      if (raw.button2_text && String(raw.button2_text).trim()) {
        buttons.push({
          text: raw.button2_text.trim(),
          type: raw.button2_call_to_action_type ? "CTA" : "QUICK_REPLY",
          content: raw.button2_call_to_action_content || null,
        });
      }
      if (raw.button3_text && String(raw.button3_text).trim()) {
        buttons.push({
          text: raw.button3_text.trim(),
          type: "QUICK_REPLY",
        });
      }
    }

    // If template has components array (Meta / ChatterPillar format)
    if (Array.isArray(raw.components)) {
      for (const comp of raw.components) {
        const compType = String(comp.type || "").toUpperCase();
        if (compType === "HEADER") {
          headerType = comp.format || "TEXT";
          headerContent = comp.text || comp.url || null;
        } else if (compType === "BODY") {
          bodyContent = comp.text || bodyContent;
        } else if (compType === "FOOTER") {
          footerContent = comp.text || footerContent;
        } else if (compType === "BUTTONS") {
          buttons = Array.isArray(comp.buttons) && comp.buttons.length > 0 ? comp.buttons : buttons;
        }
      }
    }

    // Extract dynamic variables e.g. {{1}}, {{2}} or {{customer_name}}
    const variableMatches = [];
    const varRegex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
    let match;

    if (bodyContent) {
      while ((match = varRegex.exec(bodyContent)) !== null) {
        if (!variableMatches.includes(match[1])) {
          variableMatches.push(match[1]);
        }
      }
    }

    // Sort variable matches in numerical order if numbers (1, 2, 3...)
    variableMatches.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    const templateType = headerType && headerType !== "TEXT" ? "MEDIA" : "TEXT";

    return {
      template_id: templateId,
      template_name: templateName,
      category,
      language,
      status,
      template_type: templateType,
      header_type: headerType,
      header_content: headerContent,
      body_content: bodyContent,
      footer_content: footerContent,
      buttons: JSON.stringify(buttons),
      variable_count: variableMatches.length,
      variables: JSON.stringify(variableMatches),
      raw_data: JSON.stringify(raw),
    };
  }

  /**
   * Bulk upsert templates into database.
   */
  static async upsertMany(rawTemplatesList) {
    if (!Array.isArray(rawTemplatesList) || rawTemplatesList.length === 0) {
      return [];
    }

    const client = await pool.connect();
    const results = [];

    try {
      await client.query("BEGIN");

      for (const item of rawTemplatesList) {
        const parsed = this.parseTemplate(item);
        if (!parsed) continue;

        const query = `
          INSERT INTO whatsapp_templates (
            template_id, template_name, category, language, status, template_type,
            header_type, header_content, body_content, footer_content, buttons,
            variable_count, variables, raw_data, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
          ON CONFLICT (template_id) DO UPDATE SET
            template_name = EXCLUDED.template_name,
            category = EXCLUDED.category,
            language = EXCLUDED.language,
            status = EXCLUDED.status,
            template_type = EXCLUDED.template_type,
            header_type = EXCLUDED.header_type,
            header_content = EXCLUDED.header_content,
            body_content = EXCLUDED.body_content,
            footer_content = EXCLUDED.footer_content,
            buttons = EXCLUDED.buttons,
            variable_count = EXCLUDED.variable_count,
            variables = EXCLUDED.variables,
            raw_data = EXCLUDED.raw_data,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        const values = [
          parsed.template_id,
          parsed.template_name,
          parsed.category,
          parsed.language,
          parsed.status,
          parsed.template_type,
          parsed.header_type,
          parsed.header_content,
          parsed.body_content,
          parsed.footer_content,
          parsed.buttons,
          parsed.variable_count,
          parsed.variables,
          parsed.raw_data,
        ];

        const res = await client.query(query, values);
        results.push(res.rows[0]);
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("WhatsAppTemplateModel.upsertMany error:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find templates with search, filter, and pagination support.
   */
  static async findAll({ search, category, status, language, page = 1, limit = 50 }) {
    // Quick auto-heal for any legacy synced rows where body_content was empty
    try {
      await pool.query(`
        UPDATE whatsapp_templates
        SET body_content = raw_data->>'body_text',
            updated_at = CURRENT_TIMESTAMP
        WHERE (body_content IS NULL OR body_content = '')
          AND raw_data IS NOT NULL
          AND (raw_data::jsonb ? 'body_text')
          AND raw_data->>'body_text' != '';
      `);
    } catch (e) {
      // non-fatal
    }

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search && String(search).trim()) {
      conditions.push(`(template_name ILIKE $${paramIndex} OR body_content ILIKE $${paramIndex} OR template_id ILIKE $${paramIndex})`);
      values.push(`%${String(search).trim()}%`);
      paramIndex++;
    }

    if (category && String(category).trim() && String(category).toUpperCase() !== "ALL") {
      conditions.push(`category = $${paramIndex}`);
      values.push(String(category).toUpperCase().trim());
      paramIndex++;
    }

    if (status && String(status).trim() && String(status).toUpperCase() !== "ALL") {
      conditions.push(`status = $${paramIndex}`);
      values.push(String(status).toUpperCase().trim());
      paramIndex++;
    }

    if (language && String(language).trim() && String(language).toUpperCase() !== "ALL") {
      conditions.push(`language = $${paramIndex}`);
      values.push(String(language).trim());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total Count
    const countQuery = `SELECT COUNT(*) AS total FROM whatsapp_templates ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10) || 0;

    // Pagination
    const numLimit = Math.max(1, parseInt(limit, 10) || 50);
    const numPage = Math.max(1, parseInt(page, 10) || 1);
    const offset = (numPage - 1) * numLimit;

    const query = `
      SELECT id, template_id, template_name, category, language, status,
             template_type, header_type, header_content, body_content,
             footer_content, buttons, variable_count, variables, raw_data,
             created_at, updated_at
      FROM whatsapp_templates
      ${whereClause}
      ORDER BY 
        CASE WHEN status = 'APPROVED' THEN 1 WHEN status = 'PENDING' THEN 2 ELSE 3 END,
        template_name ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const selectValues = [...values, numLimit, offset];
    const result = await pool.query(query, selectValues);

    return {
      templates: result.rows,
      pagination: {
        total,
        page: numPage,
        limit: numLimit,
        totalPages: Math.ceil(total / numLimit) || 1,
      },
    };
  }

  /**
   * Find single template by template_id.
   */
  static async findByTemplateId(templateId) {
    if (!templateId) return null;
    const query = `
      SELECT id, template_id, template_name, category, language, status,
             template_type, header_type, header_content, body_content,
             footer_content, buttons, variable_count, variables, raw_data,
             created_at, updated_at
      FROM whatsapp_templates
      WHERE template_id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [String(templateId).trim()]);
    return result.rows[0] || null;
  }

  /**
   * Get distinct categories available in saved templates.
   */
  static async getCategories() {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM whatsapp_templates
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = WhatsAppTemplateModel;
