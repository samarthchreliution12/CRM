const CommunicationService = require("../services/communication.service");

class CommunicationController {
  // GET /api/communication/conversations
  static async getUserConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role?.name || "";
      const conversations = await CommunicationService.getUserConversations(userId, userRole);
      return res.status(200).json({
        success: true,
        data: { conversations }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/communication/conversations/direct
  static async getOrCreateDirectConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const { recipient_id } = req.body;
      const conversation = await CommunicationService.getOrCreateDirectConversation(userId, recipient_id);
      return res.status(200).json({
        success: true,
        data: { conversation }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/communication/conversations/channels
  static async createChannel(req, res, next) {
    try {
      const userId = req.user.id;
      const { name } = req.body;
      const channel = await CommunicationService.createChannel(userId, name);
      return res.status(201).json({
        success: true,
        message: "Channel created successfully",
        data: { channel }
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/communication/conversations/:conversationId/members
  static async getConversationMembers(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.conversationId, 10);
      const members = await CommunicationService.getConversationMembers(userId, conversationId);
      return res.status(200).json({
        success: true,
        data: { members }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/communication/conversations/:conversationId/members
  static async addConversationMembers(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role?.name || "";
      const conversationId = parseInt(req.params.conversationId, 10);
      const userIds = req.body.user_ids || req.body.userIds;
      const updatedMembers = await CommunicationService.addConversationMembers(userId, userRole, conversationId, userIds);
      return res.status(200).json({
        success: true,
        message: "Members added successfully",
        data: { members: updatedMembers }
      });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/communication/conversations/:conversationId/members/:targetUserId
  static async removeConversationMember(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role?.name || "";
      const conversationId = parseInt(req.params.conversationId, 10);
      const targetUserId = parseInt(req.params.targetUserId, 10);
      const updatedMembers = await CommunicationService.removeConversationMember(userId, userRole, conversationId, targetUserId);
      return res.status(200).json({
        success: true,
        message: "Member removed successfully",
        data: { members: updatedMembers }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/communication/conversations/:conversationId/leave
  static async leaveChannel(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.conversationId, 10);
      const result = await CommunicationService.leaveChannel(userId, conversationId);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/communication/conversations/:conversationId/read
  static async markConversationAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.conversationId, 10);
      const result = await CommunicationService.markConversationAsRead(userId, conversationId);
      return res.status(200).json({
        success: true,
        message: "Conversation marked as read",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/communication/conversations/:conversationId/messages
  static async getConversationMessages(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.conversationId, 10);
      const { limit, page } = req.query;
      const messages = await CommunicationService.getConversationMessages(userId, conversationId, limit, page);
      return res.status(200).json({
        success: true,
        data: { messages }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/communication/conversations/:conversationId/messages
  static async sendMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = parseInt(req.params.conversationId, 10);
      const { message } = req.body;
      const sentMessage = await CommunicationService.sendMessage(userId, conversationId, message);
      return res.status(201).json({
        success: true,
        data: { message: sentMessage }
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/communication/messages/:messageId
  static async editMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const messageId = parseInt(req.params.messageId, 10);
      const { message } = req.body;
      const updatedMessage = await CommunicationService.editMessage(userId, messageId, message);
      return res.status(200).json({
        success: true,
        data: { message: updatedMessage }
      });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/communication/messages/:messageId
  static async deleteMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role?.name || "";
      const messageId = parseInt(req.params.messageId, 10);
      const result = await CommunicationService.deleteMessage(userId, messageId, userRole);
      return res.status(200).json({
        success: true,
        message: "Message deleted successfully",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/communication/staff
  static async getStaffUsers(req, res, next) {
    try {
      const userId = req.user.id;
      const { search } = req.query;
      const staffUsers = await CommunicationService.getStaffUsers(userId, search);
      return res.status(200).json({
        success: true,
        data: { staff: staffUsers }
      });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/communication/channels/:channelId
  static async deleteChannel(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role?.name || "";
      const { channelId } = req.params;

      const result = await CommunicationService.deleteChannel(userId, userRole, channelId);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CommunicationController;
