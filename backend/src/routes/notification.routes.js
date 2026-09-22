const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth.middleware");

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications - List notifications
router.get("/", NotificationController.getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get("/unread-count", NotificationController.getUnreadCount);

// PATCH /api/notifications/read-all - Mark all as read
router.patch("/read-all", NotificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch("/:id/read", NotificationController.markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", NotificationController.deleteNotification);

module.exports = router;
