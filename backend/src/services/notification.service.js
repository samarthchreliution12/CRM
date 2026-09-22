const NotificationModel = require("../models/notification.model");
const UserModel = require("../models/user.model");

const VALID_NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "TASK_STATUS_UPDATED",
  "TASK_COMPLETED",
  "DOCUMENT_PENDING",
  "DOCUMENT_APPROVED",
  "DOCUMENT_REJECTED",
  "MEETING_REMINDER",
  "CLIENT_FOLLOW_UP",
  "COMMUNICATION_MESSAGE",
  "SYSTEM_ALERT",
];

class NotificationService {
  /**
   * Create a database notification for a recipient user.
   */
  static async createNotification(
    {
      recipientUserId,
      type,
      title,
      message,
      entityType = null,
      entityId = null,
    },
    clientOrPool
  ) {
    if (!recipientUserId || isNaN(parseInt(recipientUserId, 10))) {
      throw new Error("Valid recipientUserId is required for notification.");
    }

    if (!type || typeof type !== "string" || !type.trim()) {
      throw new Error("Notification type is required.");
    }

    const cleanType = type.trim().toUpperCase();

    if (!title || typeof title !== "string" || !title.trim()) {
      throw new Error("Notification title is required.");
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new Error("Notification message is required.");
    }

    const cleanRecipientId = parseInt(recipientUserId, 10);

    // Verify recipient user exists and is active
    const recipient = await UserModel.findById(cleanRecipientId);
    if (!recipient) {
      // If user doesn't exist, silently return null to prevent transaction crashing
      return null;
    }

    return NotificationModel.create(
      {
        recipient_user_id: cleanRecipientId,
        type: cleanType,
        title: title.trim(),
        message: message.trim(),
        entity_type: entityType,
        entity_id: entityId,
      },
      clientOrPool
    );
  }

  /**
   * Fetch notifications list for a specific authenticated user.
   */
  static async getUserNotifications(userId, options = {}) {
    const numericUserId = parseInt(userId, 10);
    if (!numericUserId || isNaN(numericUserId)) {
      const err = new Error("Invalid user ID.");
      err.statusCode = 400;
      throw err;
    }

    return NotificationModel.findAllByUserId(numericUserId, options);
  }

  /**
   * Get unread notification count for a specific authenticated user.
   */
  static async getUnreadCount(userId) {
    const numericUserId = parseInt(userId, 10);
    if (!numericUserId || isNaN(numericUserId)) {
      return 0;
    }

    return NotificationModel.countUnreadByUserId(numericUserId);
  }

  /**
   * Mark a notification as read.
   */
  static async markNotificationAsRead(id, userId) {
    const numericId = parseInt(id, 10);
    const numericUserId = parseInt(userId, 10);

    if (isNaN(numericId) || isNaN(numericUserId)) {
      const err = new Error("Invalid notification ID or user ID.");
      err.statusCode = 400;
      throw err;
    }

    const updated = await NotificationModel.markAsRead(numericId, numericUserId);
    if (!updated) {
      const err = new Error("Notification not found or access denied.");
      err.statusCode = 404;
      throw err;
    }

    return updated;
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  static async markAllNotificationsAsRead(userId) {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      const err = new Error("Invalid user ID.");
      err.statusCode = 400;
      throw err;
    }

    const count = await NotificationModel.markAllAsRead(numericUserId);
    return { marked_count: count };
  }

  /**
   * Delete a notification.
   */
  static async deleteNotification(id, userId) {
    const numericId = parseInt(id, 10);
    const numericUserId = parseInt(userId, 10);

    if (isNaN(numericId) || isNaN(numericUserId)) {
      const err = new Error("Invalid notification ID or user ID.");
      err.statusCode = 400;
      throw err;
    }

    const deleted = await NotificationModel.delete(numericId, numericUserId);
    if (!deleted) {
      const err = new Error("Notification not found or access denied.");
      err.statusCode = 404;
      throw err;
    }

    return true;
  }
}

module.exports = NotificationService;
