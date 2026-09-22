const pool = require("../config/database");

class NotificationModel {
  /**
   * Create a new database notification.
   */
  static async create(
    { recipient_user_id, type, title, message, entity_type = null, entity_id = null },
    clientOrPool = pool
  ) {
    const query = `
      INSERT INTO notifications (
        recipient_user_id, type, title, message, entity_type, entity_id, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, CURRENT_TIMESTAMP)
      RETURNING id, recipient_user_id, type, title, message, entity_type, entity_id, is_read, read_at, created_at
    `;
    const values = [
      parseInt(recipient_user_id, 10),
      type.trim().toUpperCase(),
      title.trim(),
      message.trim(),
      entity_type ? entity_type.trim().toUpperCase() : null,
      entity_id ? parseInt(entity_id, 10) : null,
    ];

    const result = await clientOrPool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find notification by ID.
   */
  static async findById(id) {
    const query = `
      SELECT id, recipient_user_id, type, title, message, entity_type, entity_id, is_read, read_at, created_at
      FROM notifications
      WHERE id = $1
    `;
    const result = await pool.query(query, [parseInt(id, 10)]);
    return result.rows[0] || null;
  }

  /**
   * Fetch paginated or filtered notifications for a specific user.
   */
  static async findAllByUserId(
    userId,
    { is_read = null, entity_type = null, limit = 50, offset = 0 } = {}
  ) {
    const conditions = ["recipient_user_id = $1"];
    const params = [parseInt(userId, 10)];
    let idx = 2;

    if (is_read !== null && is_read !== undefined && is_read !== "") {
      const boolVal = is_read === true || is_read === "true" || is_read === 1 || is_read === "1";
      conditions.push(`is_read = $${idx++}`);
      params.push(boolVal);
    }

    if (entity_type && entity_type.trim()) {
      conditions.push(`entity_type = $${idx++}`);
      params.push(entity_type.trim().toUpperCase());
    }

    const whereClause = conditions.join(" AND ");

    // Count query
    const countQuery = `SELECT COUNT(*) AS total FROM notifications WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Data query
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const offsetNum = Math.max(0, parseInt(offset, 10) || 0);

    const dataParams = [...params, limitNum, offsetNum];
    const dataQuery = `
      SELECT id, recipient_user_id, type, title, message, entity_type, entity_id, is_read, read_at, created_at
      FROM notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const result = await pool.query(dataQuery, dataParams);
    return {
      notifications: result.rows,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
      },
    };
  }

  /**
   * Count unread notifications for a specific user.
   */
  static async countUnreadByUserId(userId) {
    const query = `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE recipient_user_id = $1 AND is_read = FALSE
    `;
    const result = await pool.query(query, [parseInt(userId, 10)]);
    return parseInt(result.rows[0]?.unread_count || 0, 10);
  }

  /**
   * Mark a single notification as read, ensuring it belongs to the user.
   */
  static async markAsRead(id, userId) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND recipient_user_id = $2
      RETURNING id, recipient_user_id, type, title, message, entity_type, entity_id, is_read, read_at, created_at
    `;
    const result = await pool.query(query, [parseInt(id, 10), parseInt(userId, 10)]);
    return result.rows[0] || null;
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE recipient_user_id = $1 AND is_read = FALSE
      RETURNING id
    `;
    const result = await pool.query(query, [parseInt(userId, 10)]);
    return result.rowCount || 0;
  }

  /**
   * Delete a notification scoped to user.
   */
  static async delete(id, userId) {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND recipient_user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [parseInt(id, 10), parseInt(userId, 10)]);
    return result.rows[0] || null;
  }
}

module.exports = NotificationModel;
