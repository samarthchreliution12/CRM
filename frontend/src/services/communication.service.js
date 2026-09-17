import apiFetch from "./apiClient";

class CommunicationService {
  static async request(endpoint, options = {}, token = null) {
    const headers = { ...options.headers };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return apiFetch(endpoint, {
      ...options,
      headers,
    });
  }

  // GET /api/communication/conversations - List logged in user's active conversations
  static async getConversations(token) {
    return this.request("/communication/conversations", { method: "GET" }, token);
  }

  // POST /api/communication/conversations/direct - Start or find direct conversation with staff member
  static async startDirectConversation(recipientId, token) {
    return this.request(
      "/communication/conversations/direct",
      {
        method: "POST",
        body: JSON.stringify({ recipient_id: recipientId }),
      },
      token
    );
  }

  // POST /api/communication/conversations/channels - Create channel
  static async createChannel(name, token) {
    return this.request(
      "/communication/conversations/channels",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
      token
    );
  }

  // GET /api/communication/conversations/:conversationId/members - Get conversation members
  static async getConversationMembers(conversationId, token) {
    return this.request(`/communication/conversations/${conversationId}/members`, { method: "GET" }, token);
  }

  // POST /api/communication/conversations/:conversationId/members - Add members to conversation
  static async addConversationMembers(conversationId, userIds, token) {
    return this.request(
      `/communication/conversations/${conversationId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ user_ids: userIds }),
      },
      token
    );
  }

  // DELETE /api/communication/conversations/:conversationId/members/:targetUserId - Remove member from channel
  static async removeConversationMember(conversationId, targetUserId, token) {
    return this.request(
      `/communication/conversations/${conversationId}/members/${targetUserId}`,
      { method: "DELETE" },
      token
    );
  }

  // POST /api/communication/conversations/:conversationId/leave - Leave channel
  static async leaveChannel(conversationId, token) {
    return this.request(`/communication/conversations/${conversationId}/leave`, { method: "POST" }, token);
  }

  // POST /api/communication/conversations/:conversationId/read - Mark conversation as read
  static async markConversationAsRead(conversationId, token) {
    return this.request(`/communication/conversations/${conversationId}/read`, { method: "POST" }, token);
  }

  // GET /api/communication/conversations/:conversationId/messages - Get messages
  static async getMessages(conversationId, token) {
    return this.request(`/communication/conversations/${conversationId}/messages`, { method: "GET" }, token);
  }

  // POST /api/communication/conversations/:conversationId/messages - Send a message
  static async sendMessage(conversationId, messageText, token) {
    return this.request(
      `/communication/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      },
      token
    );
  }

  // PATCH /api/communication/messages/:messageId - Edit message
  static async editMessage(messageId, messageText, token) {
    return this.request(
      `/communication/messages/${messageId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ message: messageText }),
      },
      token
    );
  }

  // DELETE /api/communication/messages/:messageId - Soft-delete message
  static async deleteMessage(messageId, token) {
    return this.request(`/communication/messages/${messageId}`, { method: "DELETE" }, token);
  }

  // GET /api/communication/staff - List active staff users available for chat
  static async getStaffUsers(search = "", token) {
    return this.request(`/communication/staff?search=${encodeURIComponent(search)}`, { method: "GET" }, token);
  }

  // DELETE /api/communication/channels/:channelId - Delete a channel
  static async deleteChannel(channelId, token) {
    return this.request(`/communication/channels/${channelId}`, { method: "DELETE" }, token);
  }
}

export default CommunicationService;
