const CommunicationModel = require("../models/communication.model");
const pool = require("../config/database");
const AuditService = require("./audit.service");

class CommunicationService {
  // Get all active conversations for the logged in user
  static async getUserConversations(userId, userRole = "") {
    const rawConvs = await CommunicationModel.findUserConversations(userId);

    return rawConvs.map((conv) => {
      let displayName = conv.name;
      if (conv.type === "direct") {
        displayName = conv.recipient_name || "Staff Member";
      }

      const isChannel = conv.type === "channel";
      const isAdmin = userRole === "Admin";
      const isCreator = conv.created_by === userId;
      const canManage = isChannel && (isAdmin || isCreator);

      return {
        id: conv.id,
        type: conv.type,
        name: displayName,
        created_by: conv.created_by,
        created_by_user_id: conv.created_by,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        unread_count: Number(conv.unread_count || 0),
        recipient: conv.type === "direct" && conv.recipient_id ? {
          id: conv.recipient_id,
          name: conv.recipient_name,
          email: conv.recipient_email
        } : null,
        last_message: conv.last_message_deleted_at
          ? "This message was deleted"
          : conv.last_message || null,
        last_message_at: conv.last_message_at || conv.updated_at,
        last_message_sender: conv.last_message_sender_name || null,
        can_manage_channel: canManage,
        can_add_members: canManage,
        can_remove_members: canManage,
        can_delete_channel: canManage,
        can_leave_channel: isChannel && !isCreator
      };
    });
  }

  // Find or create direct conversation with another staff member
  static async getOrCreateDirectConversation(userId, recipientId) {
    const parsedRecipientId = parseInt(recipientId, 10);
    if (!parsedRecipientId || isNaN(parsedRecipientId)) {
      const err = new Error("Invalid recipient ID.");
      err.statusCode = 400;
      throw err;
    }

    if (userId === parsedRecipientId) {
      const err = new Error("You cannot start a direct conversation with yourself.");
      err.statusCode = 400;
      throw err;
    }

    // Verify recipient exists and is active Staff/Admin
    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 AND u.status = 'active' AND r.name IN ('Admin', 'Staff')`,
      [parsedRecipientId]
    );

    if (userRes.rows.length === 0) {
      const err = new Error("Recipient staff member not found or inactive.");
      err.statusCode = 404;
      throw err;
    }

    const recipientUser = userRes.rows[0];

    // Check if direct conversation already exists
    let conversation = await CommunicationModel.findDirectConversation(userId, parsedRecipientId);

    if (!conversation) {
      conversation = await CommunicationModel.createDirectConversation(userId, parsedRecipientId);
    }

    return {
      id: conversation.id,
      type: "direct",
      name: recipientUser.name,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      recipient: {
        id: recipientUser.id,
        name: recipientUser.name,
        email: recipientUser.email,
        role: recipientUser.role_name
      }
    };
  }

  // Create a channel conversation
  static async createChannel(userId, name) {
    if (!name || !name.trim()) {
      const err = new Error("Channel name is required.");
      err.statusCode = 400;
      throw err;
    }

    const channelName = name.trim().startsWith("#") ? name.trim() : `#${name.trim()}`;
    const conversation = await CommunicationModel.createChannelConversation(channelName, userId);

    await AuditService.log({
      userId,
      action: "CREATE",
      module: "COMMUNICATION",
      entityType: "CHANNEL",
      entityId: conversation.id,
      description: `Created channel: ${conversation.name}`,
    });

    return {
      id: conversation.id,
      type: "channel",
      name: conversation.name,
      created_by: conversation.created_by,
      created_by_user_id: conversation.created_by,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      can_manage_channel: true,
      can_add_members: true,
      can_remove_members: true,
      can_delete_channel: true,
      can_leave_channel: false
    };
  }

  // Get members of a conversation
  static async getConversationMembers(userId, conversationId) {
    const isMember = await CommunicationModel.isConversationMember(conversationId, userId);
    if (!isMember) {
      const err = new Error("You do not have access to this conversation.");
      err.statusCode = 403;
      throw err;
    }

    return await CommunicationModel.getConversationMembers(conversationId);
  }

  // Add members to a conversation
  static async addConversationMembers(userId, userRole, conversationId, userIds) {
    const conversation = await CommunicationModel.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error("Conversation not found.");
      err.statusCode = 404;
      throw err;
    }

    if (conversation.type !== "channel") {
      const err = new Error("Members can only be added to channels.");
      err.statusCode = 400;
      throw err;
    }

    const isAdmin = userRole === "Admin";
    const isCreator = conversation.created_by === userId;

    if (!isAdmin && !isCreator) {
      const err = new Error("Forbidden: Only channel owner or System Admin can add members.");
      err.statusCode = 403;
      throw err;
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      const err = new Error("At least one staff member must be selected.");
      err.statusCode = 400;
      throw err;
    }

    const result = await CommunicationModel.addConversationMembers(conversationId, userIds);

    await AuditService.log({
      userId,
      action: "ADD_MEMBER",
      module: "COMMUNICATION",
      entityType: "CHANNEL",
      entityId: conversationId,
      description: `Added member(s) to channel '${conversation.name}'`,
      newValues: { user_ids: userIds },
    });

    return result;
  }

  // Remove a member from a conversation
  static async removeConversationMember(userId, userRole, conversationId, targetUserId) {
    const parsedTargetId = parseInt(targetUserId, 10);
    if (!parsedTargetId || isNaN(parsedTargetId)) {
      const err = new Error("Invalid target user ID.");
      err.statusCode = 400;
      throw err;
    }

    const conversation = await CommunicationModel.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error("Conversation not found.");
      err.statusCode = 404;
      throw err;
    }

    if (conversation.type !== "channel") {
      const err = new Error("Member removal is only applicable to channels.");
      err.statusCode = 400;
      throw err;
    }

    const isAdmin = userRole === "Admin";
    const isCreator = conversation.created_by === userId;

    if (!isAdmin && !isCreator) {
      const err = new Error("Forbidden: Only channel owner or System Admin can remove members.");
      err.statusCode = 403;
      throw err;
    }

    if (parsedTargetId === conversation.created_by) {
      const err = new Error("Cannot remove the channel owner/creator from the channel.");
      err.statusCode = 400;
      throw err;
    }

    await CommunicationModel.removeConversationMember(conversationId, parsedTargetId);

    await AuditService.log({
      userId,
      action: "REMOVE_MEMBER",
      module: "COMMUNICATION",
      entityType: "CHANNEL",
      entityId: conversationId,
      description: `Removed member #${parsedTargetId} from channel '${conversation.name}'`,
    });

    return await CommunicationModel.getConversationMembers(conversationId);
  }

  // Leave channel
  static async leaveChannel(userId, conversationId) {
    const conversation = await CommunicationModel.getConversationById(conversationId);
    if (!conversation) {
      const err = new Error("Channel not found.");
      err.statusCode = 404;
      throw err;
    }

    if (conversation.type !== "channel") {
      const err = new Error("You can only leave channels.");
      err.statusCode = 400;
      throw err;
    }

    if (conversation.created_by === userId) {
      const err = new Error("Channel creator cannot leave the channel. Delete the channel instead.");
      err.statusCode = 400;
      throw err;
    }

    const isMember = await CommunicationModel.isConversationMember(conversationId, userId);
    if (!isMember) {
      const err = new Error("You are not an active member of this channel.");
      err.statusCode = 400;
      throw err;
    }

    await CommunicationModel.removeConversationMember(conversationId, userId);

    return { success: true, message: "You have left the channel successfully." };
  }

  // Get messages for a conversation
  static async getConversationMessages(userId, conversationId, limit = 50, page = 1) {
    const isMember = await CommunicationModel.isConversationMember(conversationId, userId);
    if (!isMember) {
      const err = new Error("You do not have access to this conversation.");
      err.statusCode = 403;
      throw err;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const messages = await CommunicationModel.getMessages(conversationId, parsedLimit, offset);

    return messages.map((msg) => {
      const isMine = msg.sender_id === userId;
      const isSeen = Boolean(msg.is_seen || msg.read_at);
      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        sender_email: msg.sender_email,
        sender_role: msg.sender_role,
        message: msg.deleted_at ? "This message was deleted" : msg.message,
        is_deleted: Boolean(msg.deleted_at),
        deleted_at: msg.deleted_at,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        is_mine: isMine,
        is_read: isSeen,
        status: isMine ? (isSeen ? "seen" : "delivered") : null
      };
    });
  }

  // Mark a conversation as read
  static async markConversationAsRead(userId, conversationId) {
    const isMember = await CommunicationModel.isConversationMember(conversationId, userId);
    if (!isMember) {
      const err = new Error("You do not have access to this conversation.");
      err.statusCode = 403;
      throw err;
    }

    return await CommunicationModel.markConversationAsRead(userId, conversationId);
  }

  // Send a message in a conversation
  static async sendMessage(userId, conversationId, messageText) {
    const isMember = await CommunicationModel.isConversationMember(conversationId, userId);
    if (!isMember) {
      const err = new Error("You do not have access to this conversation.");
      err.statusCode = 403;
      throw err;
    }

    if (!messageText || !messageText.trim()) {
      const err = new Error("Message text cannot be empty.");
      err.statusCode = 400;
      throw err;
    }

    const msg = await CommunicationModel.createMessage(conversationId, userId, messageText.trim());

    return {
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      sender_email: msg.sender_email,
      sender_role: msg.sender_role,
      message: msg.message,
      is_deleted: false,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      is_mine: true
    };
  }

  // Edit own message
  static async editMessage(userId, messageId, newMessageText) {
    const msg = await CommunicationModel.getMessageById(messageId);
    if (!msg) {
      const err = new Error("Message not found.");
      err.statusCode = 404;
      throw err;
    }

    if (msg.sender_id !== userId) {
      const err = new Error("You can only edit your own messages.");
      err.statusCode = 403;
      throw err;
    }

    if (msg.deleted_at) {
      const err = new Error("Cannot edit a deleted message.");
      err.statusCode = 400;
      throw err;
    }

    if (!newMessageText || !newMessageText.trim()) {
      const err = new Error("Message text cannot be empty.");
      err.statusCode = 400;
      throw err;
    }

    const updatedMsg = await CommunicationModel.updateMessage(messageId, newMessageText.trim());
    return {
      id: updatedMsg.id,
      conversation_id: updatedMsg.conversation_id,
      sender_id: updatedMsg.sender_id,
      sender_name: updatedMsg.sender_name,
      sender_email: updatedMsg.sender_email,
      sender_role: updatedMsg.sender_role,
      message: updatedMsg.message,
      is_deleted: false,
      created_at: updatedMsg.created_at,
      updated_at: updatedMsg.updated_at,
      is_mine: true
    };
  }

  // Soft delete own message
  static async deleteMessage(userId, messageId, userRole = "") {
    const msg = await CommunicationModel.getMessageById(messageId);
    if (!msg) {
      const err = new Error("Message not found.");
      err.statusCode = 404;
      throw err;
    }

    if (msg.sender_id !== userId && userRole !== "Admin") {
      const err = new Error("You can only delete your own messages.");
      err.statusCode = 403;
      throw err;
    }

    if (msg.deleted_at) {
      return { id: msg.id, message: "This message was deleted", is_deleted: true };
    }

    const deleted = await CommunicationModel.softDeleteMessage(messageId);
    return {
      id: deleted.id,
      conversation_id: deleted.conversation_id,
      sender_id: deleted.sender_id,
      message: "This message was deleted",
      is_deleted: true,
      deleted_at: deleted.deleted_at
    };
  }

  // Get staff users available for chat
  static async getStaffUsers(userId, search = "") {
    return await CommunicationModel.findStaffUsers(userId, search);
  }

  // Delete a channel
  static async deleteChannel(userId, userRole, channelId) {
    const parsedChannelId = parseInt(channelId, 10);
    if (!parsedChannelId || isNaN(parsedChannelId)) {
      const err = new Error("Invalid channel ID.");
      err.statusCode = 400;
      throw err;
    }

    // 1. Get conversation details
    const conversation = await CommunicationModel.getConversationById(parsedChannelId);

    // 2. Validate conversation exists
    if (!conversation) {
      const err = new Error("Channel not found.");
      err.statusCode = 404;
      throw err;
    }

    // 3. Confirm conversation is a channel (reject direct chats)
    if (conversation.type !== "channel") {
      const err = new Error("Cannot delete a direct conversation using the channel delete API.");
      err.statusCode = 400;
      throw err;
    }

    // 4. Authorization check: Admin OR Channel Creator/Owner
    const isAdmin = userRole === "Admin";
    const isCreator = conversation.created_by === userId;

    if (!isAdmin && !isCreator) {
      const err = new Error("Forbidden: You do not have permission to delete this channel.");
      err.statusCode = 403;
      throw err;
    }

    // 5. Execute deletion in atomic transaction
    await CommunicationModel.deleteChannel(parsedChannelId);

    await AuditService.log({
      userId,
      action: "DELETE",
      module: "COMMUNICATION",
      entityType: "CHANNEL",
      entityId: parsedChannelId,
      description: `Deleted channel: ${conversation.name}`,
    });

    return {
      success: true,
      message: "Channel deleted successfully"
    };
  }
}

module.exports = CommunicationService;
