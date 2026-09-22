const NotificationService = require("../services/notification.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class NotificationController {
  /**
   * GET /api/notifications
   * Get list of notifications for authenticated user.
   */
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user?.id;
      const { is_read, entity_type, limit, offset } = req.query;

      const result = await NotificationService.getUserNotifications(userId, {
        is_read,
        entity_type,
        limit,
        offset,
      });

      return sendSuccess(res, 200, "Notifications retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count for authenticated user.
   */
  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user?.id;
      const unreadCount = await NotificationService.getUnreadCount(userId);

      return sendSuccess(res, 200, "Unread count retrieved successfully", {
        unread_count: unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a notification as read.
   */
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const updated = await NotificationService.markNotificationAsRead(id, userId);

      return sendSuccess(res, 200, "Notification marked as read", {
        notification: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all unread notifications as read.
   */
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user?.id;
      const result = await NotificationService.markAllNotificationsAsRead(userId);

      return sendSuccess(res, 200, "All notifications marked as read", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete a notification.
   */
  static async deleteNotification(req, res, next) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      await NotificationService.deleteNotification(id, userId);

      return sendSuccess(res, 200, "Notification deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
