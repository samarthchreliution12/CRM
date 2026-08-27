const pool = require("../config/database");

class CommunicationModel {
  // Find all active conversations for a specific user
  static async findUserConversations(userId) {
    const query = `
      SELECT 
        ic.id,
        ic.type,
        ic.name,
        ic.created_by,
        ic.created_at,
        ic.updated_at,
        -- Recipient user details for direct messages
        other_u.id AS recipient_id,
        other_u.name AS recipient_name,
        other_u.email AS recipient_email,
        -- Real Unread Count
        COALESCE((
          SELECT COUNT(*)::int
          FROM internal_messages im
          WHERE im.conversation_id = ic.id
            AND im.sender_id != $1
            AND im.deleted_at IS NULL
            AND im.created_at > COALESCE(icm.last_read_at, '1970-01-01'::timestamp)
        ), 0) AS unread_count,
        -- Last message details
        lm.id AS last_message_id,
        lm.message AS last_message,
        lm.created_at AS last_message_at,
        lm.deleted_at AS last_message_deleted_at,
        lm.sender_id AS last_message_sender_id,
        sender_u.name AS last_message_sender_name
      FROM internal_conversations ic
      INNER JOIN internal_conversation_members icm 
        ON ic.id = icm.conversation_id AND icm.user_id = $1 AND icm.left_at IS NULL
      LEFT JOIN internal_conversation_members other_icm 
        ON ic.id = other_icm.conversation_id AND other_icm.user_id != $1 AND ic.type = 'direct' AND other_icm.left_at IS NULL
      LEFT JOIN users other_u 
        ON other_icm.user_id = other_u.id
      LEFT JOIN LATERAL (
        SELECT id, message, created_at, deleted_at, sender_id
        FROM internal_messages
        WHERE conversation_id = ic.id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true
      LEFT JOIN users sender_u 
        ON lm.sender_id = sender_u.id
      ORDER BY COALESCE(lm.created_at, ic.updated_at) DESC, ic.id DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Find existing direct conversation between two users
  static async findDirectConversation(user1Id, user2Id) {
    const query = `
      SELECT ic.id, ic.type, ic.created_at, ic.updated_at
      FROM internal_conversations ic
      INNER JOIN internal_conversation_members icm1 
        ON ic.id = icm1.conversation_id AND icm1.user_id = $1 AND icm1.left_at IS NULL
      INNER JOIN internal_conversation_members icm2 
        ON ic.id = icm2.conversation_id AND icm2.user_id = $2 AND icm2.left_at IS NULL
      WHERE ic.type = 'direct'
      LIMIT 1
    `;

    const result = await pool.query(query, [user1Id, user2Id]);
    return result.rows[0] || null;
  }

  // Create a new direct conversation between two staff members
  static async createDirectConversation(user1Id, user2Id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const convRes = await client.query(
        `INSERT INTO internal_conversations (type, created_by) VALUES ('direct', $1) RETURNING *`,
        [user1Id]
      );
      const conversation = convRes.rows[0];

      await client.query(
        `INSERT INTO internal_conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [conversation.id, user1Id, user2Id]
      );

      await client.query("COMMIT");
      return conversation;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Create a channel conversation
  static async createChannelConversation(name, creatorId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const convRes = await client.query(
        `INSERT INTO internal_conversations (type, name, created_by) VALUES ('channel', $1, $2) RETURNING *`,
        [name, creatorId]
      );
      const conversation = convRes.rows[0];

      await client.query(
        `INSERT INTO internal_conversation_members (conversation_id, user_id) VALUES ($1, $2)`,
        [conversation.id, creatorId]
      );

      await client.query("COMMIT");
      return conversation;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Check if a user is an active member of a conversation
  static async isConversationMember(conversationId, userId) {
    const query = `
      SELECT id FROM internal_conversation_members
      WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
      LIMIT 1
    `;
    const result = await pool.query(query, [conversationId, userId]);
    return result.rows.length > 0;
  }

  // Find conversation details by ID
  static async getConversationById(conversationId) {
    const query = `SELECT * FROM internal_conversations WHERE id = $1`;
    const result = await pool.query(query, [conversationId]);
    return result.rows[0] || null;
  }

  // Get active members of a conversation
  static async getConversationMembers(conversationId) {
    const query = `
      SELECT DISTINCT ON (u.id)
        icm.id AS member_id,
        icm.joined_at,
        u.id AS user_id,
        u.name,
        u.email,
        r.name AS role_name
      FROM internal_conversation_members icm
      INNER JOIN users u ON icm.user_id = u.id
      INNER JOIN roles r ON u.role_id = r.id
      WHERE icm.conversation_id = $1 AND icm.left_at IS NULL
      ORDER BY u.id ASC, icm.joined_at DESC
    `;
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  }

  // Add members to a conversation in database
  static async addConversationMembers(conversationId, userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const uId of userIds) {
        await client.query(
          `INSERT INTO internal_conversation_members (conversation_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL`,
          [conversationId, uId]
        );
      }
      await client.query("COMMIT");
      return await this.getConversationMembers(conversationId);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Get messages for a conversation
  static async getMessages(conversationId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        im.id,
        im.conversation_id,
        im.sender_id,
        im.message,
        im.created_at,
        im.updated_at,
        im.deleted_at,
        im.read_at,
        u.name AS sender_name,
        u.email AS sender_email,
        r.name AS sender_role,
        EXISTS (
          SELECT 1
          FROM internal_conversation_members icm
          WHERE icm.conversation_id = im.conversation_id
            AND icm.user_id != im.sender_id
            AND icm.last_read_at >= im.created_at
        ) AS is_seen
      FROM internal_messages im
      INNER JOIN users u ON im.sender_id = u.id
      INNER JOIN roles r ON u.role_id = r.id
      WHERE im.conversation_id = $1
      ORDER BY im.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [conversationId, limit, offset]);
    return result.rows;
  }

  // Mark conversation as read by a user
  static async markConversationAsRead(userId, conversationId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE internal_conversation_members
         SET last_read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      await client.query(
        `UPDATE internal_messages
         SET read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`,
        [conversationId, userId]
      );

      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Create a new message in conversation
  static async createMessage(conversationId, senderId, messageText) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const msgRes = await client.query(
        `INSERT INTO internal_messages (conversation_id, sender_id, message)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [conversationId, senderId, messageText]
      );
      const insertedMessage = msgRes.rows[0];

      // Update conversation updated_at
      await client.query(
        `UPDATE internal_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [conversationId]
      );

      await client.query("COMMIT");

      // Fetch message with sender details
      const detailRes = await pool.query(
        `SELECT im.*, u.name AS sender_name, u.email AS sender_email, r.name AS sender_role
         FROM internal_messages im
         INNER JOIN users u ON im.sender_id = u.id
         INNER JOIN roles r ON u.role_id = r.id
         WHERE im.id = $1`,
        [insertedMessage.id]
      );

      return detailRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Get single message by ID
  static async getMessageById(messageId) {
    const query = `SELECT * FROM internal_messages WHERE id = $1`;
    const result = await pool.query(query, [messageId]);
    return result.rows[0] || null;
  }

  // Edit own message
  static async updateMessage(messageId, newMessageText) {
    const query = `
      UPDATE internal_messages
      SET message = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [newMessageText, messageId]);

    if (result.rows.length === 0) return null;

    const detailRes = await pool.query(
      `SELECT im.*, u.name AS sender_name, u.email AS sender_email, r.name AS sender_role
       FROM internal_messages im
       INNER JOIN users u ON im.sender_id = u.id
       INNER JOIN roles r ON u.role_id = r.id
       WHERE im.id = $1`,
      [messageId]
    );
    return detailRes.rows[0];
  }

  // Soft-delete own message
  static async softDeleteMessage(messageId) {
    const query = `
      UPDATE internal_messages
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [messageId]);
    return result.rows[0] || null;
  }

  // Find staff users available to chat (excluding logged in user)
  static async findStaffUsers(currentUserId, search = "") {
    let query = `
      SELECT u.id, u.name, u.email, r.name AS role_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('Admin', 'Staff') AND u.id != $1 AND u.status = 'active'
    `;
    const params = [currentUserId];

    if (search && search.trim()) {
      query += ` AND (u.name ILIKE $2 OR u.email ILIKE $2)`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY u.name ASC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Delete a channel and all associated messages and members in an atomic transaction
  static async deleteChannel(channelId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Delete associated messages
      await client.query("DELETE FROM internal_messages WHERE conversation_id = $1", [channelId]);

      // 2. Delete associated channel members
      await client.query("DELETE FROM internal_conversation_members WHERE conversation_id = $1", [channelId]);

      // 3. Delete channel conversation record
      const result = await client.query("DELETE FROM internal_conversations WHERE id = $1 RETURNING *", [channelId]);

      await client.query("COMMIT");
      return result.rows[0] || null;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Remove a member from a conversation
  static async removeConversationMember(conversationId, targetUserId) {
    const query = `
      DELETE FROM internal_conversation_members
      WHERE conversation_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [conversationId, targetUserId]);
    return result.rows[0] || null;
  }
}

module.exports = CommunicationModel;
