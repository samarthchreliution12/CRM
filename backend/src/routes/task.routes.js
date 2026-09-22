const express = require("express");
const router = express.Router();
const TaskController = require("../controllers/task.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

// Enforce authentication for all Task routes
router.use(authenticate);

// GET /api/tasks - List tasks (paginated, filtered, sorted)
router.get(
  "/",
  requirePermission(["task.read", "task.view"]),
  TaskController.getTasks
);

// POST /api/tasks - Create new task
router.post(
  "/",
  requirePermission("task.create"),
  TaskController.createTask
);

// GET /api/tasks/notifications - Get task assignment & status notifications
router.get(
  "/notifications",
  requirePermission(["task.read", "task.view"]),
  TaskController.getTaskNotifications
);

// GET /api/tasks/:id - Get single task details
router.get(
  "/:id",
  requirePermission(["task.read", "task.view"]),
  TaskController.getTaskById
);

// PUT /api/tasks/:id - Update task information
router.put(
  "/:id",
  requirePermission(["task.update", "task.edit"]),
  TaskController.updateTask
);

// PATCH /api/tasks/:id/status - Dedicated status update
router.patch(
  "/:id/status",
  requirePermission(["task.update", "task.edit"]),
  TaskController.updateTaskStatus
);

// DELETE /api/tasks/:id - Delete task
router.delete(
  "/:id",
  requirePermission("task.delete"),
  TaskController.deleteTask
);

module.exports = router;
