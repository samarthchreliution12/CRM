const TaskService = require("../services/task.service");
const { sendSuccess } = require("../utils/response.util");

class TaskController {
  /**
   * POST /api/tasks - Create a new task
   */
  static async createTask(req, res, next) {
    try {
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      const task = await TaskService.createTask(req.body, context);
      return sendSuccess(res, 201, "Task created successfully", { task });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks - Get list of tasks with filters and pagination
   */
  static async getTasks(req, res, next) {
    try {
      const filters = {
        assigned_to: req.query.assigned_to,
        related_client_id: req.query.related_client_id,
        related_lead_id: req.query.related_lead_id,
        status: req.query.status,
        priority: req.query.priority,
        task_type: req.query.task_type,
        due_date: req.query.due_date,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        overdue: req.query.overdue,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      };
      const context = { userId: req.user.id };
      const result = await TaskService.getTasks(filters, context);
      return sendSuccess(res, 200, "Tasks retrieved successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks/:id - Get single task details
   */
  static async getTaskById(req, res, next) {
    try {
      const taskId = req.params.id;
      const task = await TaskService.getTaskById(taskId);
      return sendSuccess(res, 200, "Task details retrieved successfully", { task });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/tasks/:id - Update task information
   */
  static async updateTask(req, res, next) {
    try {
      const taskId = req.params.id;
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      const updatedTask = await TaskService.updateTask(taskId, req.body, context);
      return sendSuccess(res, 200, "Task updated successfully", { task: updatedTask });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/tasks/:id/status - Dedicated status update
   */
  static async updateTaskStatus(req, res, next) {
    try {
      const taskId = req.params.id;
      const status = req.body && req.body.status !== undefined ? req.body.status : req.body;
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      const updatedTask = await TaskService.updateTaskStatus(taskId, status, context);
      return sendSuccess(res, 200, "Task status updated successfully", { task: updatedTask });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/tasks/:id - Delete task
   */
  static async deleteTask(req, res, next) {
    try {
      const taskId = req.params.id;
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      await TaskService.deleteTask(taskId, context);
      return sendSuccess(res, 200, "Task deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TaskController;
