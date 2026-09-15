const {
  TaskModel,
  VALID_TASK_TYPES,
  VALID_PRIORITIES,
  VALID_STATUSES,
  VALID_REMINDERS,
} = require("../models/task.model");
const UserModel = require("../models/user.model");
const pool = require("../config/database");
const AuditService = require("./audit.service");

class TaskService {
  /**
   * Helper to verify if client ID exists.
   */
  static async verifyClientExists(clientId) {
    if (!clientId) return true;
    const res = await pool.query(`SELECT id FROM clients WHERE id = $1`, [parseInt(clientId, 10)]);
    return res.rows.length > 0;
  }

  /**
   * Helper to verify if lead ID exists.
   */
  static async verifyLeadExists(leadId) {
    if (!leadId) return true;
    const res = await pool.query(`SELECT id FROM leads WHERE id = $1`, [parseInt(leadId, 10)]);
    return res.rows.length > 0;
  }

  /**
   * Validate YYYY-MM-DD date format.
   */
  static isValidDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr.trim())) return false;
    const dateObj = new Date(dateStr.trim());
    return !isNaN(dateObj.getTime());
  }

  /**
   * Validate HH:MM or HH:MM:SS time format.
   */
  static isValidTime(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
    return regex.test(timeStr.trim());
  }

  /**
   * Create a new Task.
   */
  static async createTask(data = {}, context = {}) {
    // Required Title validation
    if (!data.title || !data.title.trim()) {
      const err = new Error("Task title is required.");
      err.statusCode = 400;
      throw err;
    }
    if (data.title.trim().length > 255) {
      const err = new Error("Task title cannot exceed 255 characters.");
      err.statusCode = 400;
      throw err;
    }

    // Required Task Type validation
    if (!data.task_type || !data.task_type.trim()) {
      const err = new Error("Task type is required.");
      err.statusCode = 400;
      throw err;
    }
    const cleanType = data.task_type.trim().toUpperCase();
    if (!VALID_TASK_TYPES.includes(cleanType)) {
      const err = new Error(`Invalid task_type. Must be one of: ${VALID_TASK_TYPES.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    // Required Priority validation
    if (!data.priority || !data.priority.trim()) {
      const err = new Error("Task priority is required.");
      err.statusCode = 400;
      throw err;
    }
    const cleanPriority = data.priority.trim().toUpperCase();
    if (!VALID_PRIORITIES.includes(cleanPriority)) {
      const err = new Error(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    // Required Status validation (defaults to PENDING if omitted)
    const cleanStatus = data.status && data.status.trim() ? data.status.trim().toUpperCase() : "PENDING";
    if (!VALID_STATUSES.includes(cleanStatus)) {
      const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    // Optional Reminder validation (defaults to NONE)
    const cleanReminder = data.reminder && data.reminder.trim() ? data.reminder.trim().toUpperCase() : "NONE";
    if (!VALID_REMINDERS.includes(cleanReminder)) {
      const err = new Error(`Invalid reminder. Must be one of: ${VALID_REMINDERS.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    // Required Due Date validation
    if (!data.due_date || !this.isValidDate(String(data.due_date))) {
      const err = new Error("Valid due_date (YYYY-MM-DD) is required.");
      err.statusCode = 400;
      throw err;
    }

    // Optional Due Time validation
    if (data.due_time && !this.isValidTime(String(data.due_time))) {
      const err = new Error("Invalid due_time format. Must be HH:MM or HH:MM:SS.");
      err.statusCode = 400;
      throw err;
    }

    // Required Assigned To validation
    if (!data.assigned_to || isNaN(parseInt(data.assigned_to, 10))) {
      const err = new Error("assigned_to user ID is required.");
      err.statusCode = 400;
      throw err;
    }
    const assignedUser = await UserModel.findById(data.assigned_to);
    if (!assignedUser) {
      const err = new Error("Specified assigned user does not exist.");
      err.statusCode = 404;
      throw err;
    }

    // Mutually Exclusive Client/Lead check
    const clientId = data.related_client_id ? parseInt(data.related_client_id, 10) : null;
    const leadId = data.related_lead_id ? parseInt(data.related_lead_id, 10) : null;

    if (clientId && leadId) {
      const err = new Error("A task cannot be related to both a client and a lead simultaneously.");
      err.statusCode = 400;
      throw err;
    }

    if (clientId) {
      const clientExists = await this.verifyClientExists(clientId);
      if (!clientExists) {
        const err = new Error("Specified client does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    if (leadId) {
      const leadExists = await this.verifyLeadExists(leadId);
      if (!leadExists) {
        const err = new Error("Specified lead does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    // Always derive created_by from authenticated context
    const createdBy = context.userId;
    if (!createdBy) {
      const err = new Error("Authentication required to create a task.");
      err.statusCode = 401;
      throw err;
    }

    const newTask = await TaskModel.create({
      title: data.title,
      description: data.description,
      task_type: cleanType,
      related_client_id: clientId,
      related_lead_id: leadId,
      assigned_to: data.assigned_to,
      priority: cleanPriority,
      status: cleanStatus,
      due_date: data.due_date,
      due_time: data.due_time,
      reminder: cleanReminder,
      created_by: createdBy,
    });

    await AuditService.log({
      userId: context.userId,
      action: "CREATE",
      module: "TASKS",
      entityType: "TASK",
      entityId: newTask.id,
      description: `Created task: ${newTask.title}`,
      newValues: AuditService.sanitize(newTask),
      ipAddress: context.ipAddress,
    });

    return newTask;
  }

  /**
   * Fetch tasks with filter and pagination support.
   */
  static async getTasks(filters = {}, context = {}) {
    return TaskModel.findAll(filters);
  }

  /**
   * Fetch single task details by ID.
   */
  static async getTaskById(id) {
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      const err = new Error("Invalid task ID.");
      err.statusCode = 400;
      throw err;
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      const err = new Error("Task not found.");
      err.statusCode = 404;
      throw err;
    }
    return task;
  }

  /**
   * Full update for task details.
   */
  static async updateTask(id, data = {}, context = {}) {
    const existingTask = await this.getTaskById(id);

    // Title validation if updating
    if (data.title !== undefined) {
      if (!data.title || !data.title.trim()) {
        const err = new Error("Task title cannot be empty.");
        err.statusCode = 400;
        throw err;
      }
      if (data.title.trim().length > 255) {
        const err = new Error("Task title cannot exceed 255 characters.");
        err.statusCode = 400;
        throw err;
      }
    }

    // Task Type validation if updating
    if (data.task_type !== undefined) {
      const cleanType = data.task_type ? data.task_type.trim().toUpperCase() : "";
      if (!VALID_TASK_TYPES.includes(cleanType)) {
        const err = new Error(`Invalid task_type. Must be one of: ${VALID_TASK_TYPES.join(", ")}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Priority validation if updating
    if (data.priority !== undefined) {
      const cleanPriority = data.priority ? data.priority.trim().toUpperCase() : "";
      if (!VALID_PRIORITIES.includes(cleanPriority)) {
        const err = new Error(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Status validation if updating
    if (data.status !== undefined) {
      const cleanStatus = data.status ? data.status.trim().toUpperCase() : "";
      if (!VALID_STATUSES.includes(cleanStatus)) {
        const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Reminder validation if updating
    if (data.reminder !== undefined) {
      const cleanReminder = data.reminder ? data.reminder.trim().toUpperCase() : "";
      if (!VALID_REMINDERS.includes(cleanReminder)) {
        const err = new Error(`Invalid reminder. Must be one of: ${VALID_REMINDERS.join(", ")}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Due Date validation if updating
    if (data.due_date !== undefined) {
      if (!data.due_date || !this.isValidDate(String(data.due_date))) {
        const err = new Error("Valid due_date (YYYY-MM-DD) is required.");
        err.statusCode = 400;
        throw err;
      }
    }

    // Due Time validation if updating
    if (data.due_time !== undefined && data.due_time !== null) {
      if (data.due_time && !this.isValidTime(String(data.due_time))) {
        const err = new Error("Invalid due_time format. Must be HH:MM or HH:MM:SS.");
        err.statusCode = 400;
        throw err;
      }
    }

    // Assigned To validation if updating
    if (data.assigned_to !== undefined) {
      if (!data.assigned_to || isNaN(parseInt(data.assigned_to, 10))) {
        const err = new Error("assigned_to user ID is required.");
        err.statusCode = 400;
        throw err;
      }
      const assignedUser = await UserModel.findById(data.assigned_to);
      if (!assignedUser) {
        const err = new Error("Specified assigned user does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    // Resolve client and lead IDs to enforce mutual exclusion
    let targetClientId = existingTask.related_client_id;
    let targetLeadId = existingTask.related_lead_id;

    if (data.related_client_id !== undefined) {
      targetClientId = data.related_client_id ? parseInt(data.related_client_id, 10) : null;
    }
    if (data.related_lead_id !== undefined) {
      targetLeadId = data.related_lead_id ? parseInt(data.related_lead_id, 10) : null;
    }

    if (targetClientId && targetLeadId) {
      const err = new Error("A task cannot be related to both a client and a lead simultaneously.");
      err.statusCode = 400;
      throw err;
    }

    if (data.related_client_id !== undefined && targetClientId) {
      const clientExists = await this.verifyClientExists(targetClientId);
      if (!clientExists) {
        const err = new Error("Specified client does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    if (data.related_lead_id !== undefined && targetLeadId) {
      const leadExists = await this.verifyLeadExists(targetLeadId);
      if (!leadExists) {
        const err = new Error("Specified lead does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    const oldAssignedTo = existingTask ? existingTask.assigned_to : null;
    const updatedTask = await TaskModel.update(id, data);
    const diff = AuditService.calculateDiff(existingTask, updatedTask);

    if (Object.keys(diff.newValues || {}).length > 0) {
      await AuditService.log({
        userId: context.userId,
        action: "UPDATE",
        module: "TASKS",
        entityType: "TASK",
        entityId: updatedTask.id,
        description: `Updated task: ${updatedTask.title}`,
        oldValues: diff.oldValues,
        newValues: diff.newValues,
        ipAddress: context.ipAddress,
      });
    }

    return updatedTask;
  }

  /**
   * Dedicated status update method for tasks.
   */
  static async updateTaskStatus(id, newStatus, context = {}) {
    const existingTask = await this.getTaskById(id);

    if (!newStatus || typeof newStatus !== "string" || !newStatus.trim()) {
      const err = new Error("Status is required.");
      err.statusCode = 400;
      throw err;
    }

    const cleanStatus = newStatus.trim().toUpperCase();
    if (!VALID_STATUSES.includes(cleanStatus)) {
      const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    const updatedTask = await TaskModel.updateStatus(id, cleanStatus);

    await AuditService.log({
      userId: context.userId,
      action: "UPDATE_STATUS",
      module: "TASKS",
      entityType: "TASK",
      entityId: updatedTask.id,
      description: `Updated status for task ${updatedTask.title} from '${existingTask.status}' to '${cleanStatus}'`,
      oldValues: { status: existingTask.status, completed_at: existingTask.completed_at },
      newValues: { status: cleanStatus, completed_at: updatedTask.completed_at },
      ipAddress: context.ipAddress,
    });

    return updatedTask;
  }

  /**
   * Delete Task.
   */
  static async deleteTask(id, context = {}) {
    const existingTask = await this.getTaskById(id);

    await TaskModel.delete(id);

    await AuditService.log({
      userId: context.userId,
      action: "DELETE",
      module: "TASKS",
      entityType: "TASK",
      entityId: parseInt(id, 10),
      description: `Deleted task: ${existingTask.title}`,
      oldValues: AuditService.sanitize(existingTask),
      ipAddress: context.ipAddress,
    });

    return true;
  }
}

module.exports = TaskService;
