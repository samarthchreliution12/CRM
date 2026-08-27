const express = require("express");
const router = express.Router();
const CommunicationController = require("../controllers/communication.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

// Enforce authentication & non-Client user access for all internal communication routes
router.use(authenticate);
router.use((req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (req.user.role.name === "Client") {
    return res.status(403).json({ success: false, message: "Forbidden: Client users cannot access Internal Communication" });
  }
  next();
});

// GET /api/communication/conversations - List logged in user's conversations
router.get("/conversations", CommunicationController.getUserConversations);

// POST /api/communication/conversations/direct - Create/find direct chat with another staff member
router.post("/conversations/direct", CommunicationController.getOrCreateDirectConversation);

// POST /api/communication/conversations/channels - Create a channel
router.post("/conversations/channels", CommunicationController.createChannel);

// GET /api/communication/conversations/:conversationId/members - Get conversation members
router.get("/conversations/:conversationId/members", CommunicationController.getConversationMembers);

// POST /api/communication/conversations/:conversationId/members - Add members to conversation
router.post("/conversations/:conversationId/members", CommunicationController.addConversationMembers);

// DELETE /api/communication/conversations/:conversationId/members/:targetUserId - Remove member from channel
router.delete("/conversations/:conversationId/members/:targetUserId", CommunicationController.removeConversationMember);

// POST /api/communication/conversations/:conversationId/leave - Leave channel
router.post("/conversations/:conversationId/leave", CommunicationController.leaveChannel);

// POST /api/communication/conversations/:conversationId/read - Mark conversation as read
router.post("/conversations/:conversationId/read", CommunicationController.markConversationAsRead);

// GET /api/communication/conversations/:conversationId/messages - Get messages
router.get("/conversations/:conversationId/messages", CommunicationController.getConversationMessages);

// POST /api/communication/conversations/:conversationId/messages - Send a message
router.post("/conversations/:conversationId/messages", CommunicationController.sendMessage);

// PATCH /api/communication/messages/:messageId - Edit own message
router.patch("/messages/:messageId", CommunicationController.editMessage);

// DELETE /api/communication/messages/:messageId - Soft-delete own message
router.delete("/messages/:messageId", CommunicationController.deleteMessage);

// DELETE /api/communication/channels/:channelId - Delete a channel (Admin or Creator)
router.delete("/channels/:channelId", CommunicationController.deleteChannel);
router.delete("/conversations/channels/:channelId", CommunicationController.deleteChannel);

// GET /api/communication/staff - List staff users available to chat
router.get("/staff", CommunicationController.getStaffUsers);

module.exports = router;
