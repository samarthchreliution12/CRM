const pool = require("../config/database");

class WhatsAppMessageModel {
  /**
   * Record a WhatsApp message log entry in the database.
   */
  static async create({
    clientId,
    templateId,
    templateName = null,
    userId = null,
    messageType = "BIRTHDAY",
    recipientMobile,
    recipientName = null,
    messageContent = null,
    variableValues = null,
    provider = "ChatterPillar",
    providerMessageId = null,
    status,
    errorDetails = null,
    sentYear,
  }) {
    const currentYear = sentYear || new Date().getFullYear();

    const query = `
      INSERT INTO whatsapp_messages (
        client_id, template_id, template_name, user_id, message_type,
        recipient_mobile, recipient_name, message_content, variable_values,
        provider, provider_message_id, status, error_details, sent_year,
        sent_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      clientId,
      templateId,
      templateName,
      userId,
      messageType,
      recipientMobile,
      recipientName,
      messageContent,
      variableValues ? JSON.stringify(variableValues) : null,
      provider,
      providerMessageId,
      status,
      errorDetails,
      currentYear,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Check if a successful birthday wish has already been sent to a client in a given calendar year.
   */
  static async hasSentBirthdayWish(clientId, year) {
    const targetYear = year || new Date().getFullYear();
    const query = `
      SELECT id, sent_at, template_name
      FROM whatsapp_messages
      WHERE client_id = $1
        AND message_type = 'BIRTHDAY'
        AND sent_year = $2
        AND status = 'SENT'
      LIMIT 1
    `;
    const result = await pool.query(query, [clientId, targetYear]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Retrieve full message history for a specific client.
   */
  static async findByClient(clientId) {
    const query = `
      SELECT wm.id,
             wm.client_id,
             wm.template_id,
             wm.template_name,
             wm.user_id,
             u.name AS sender_name,
             u.email AS sender_email,
             wm.message_type,
             wm.recipient_mobile,
             wm.recipient_name,
             wm.message_content,
             wm.variable_values,
             wm.provider,
             wm.provider_message_id,
             wm.status,
             wm.error_details,
             wm.sent_year,
             wm.sent_at,
             wm.created_at
      FROM whatsapp_messages wm
      LEFT JOIN users u ON u.id = wm.user_id
      WHERE wm.client_id = $1
      ORDER BY wm.sent_at DESC
    `;
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }
}

module.exports = WhatsAppMessageModel;
