const pool = require("../config/database");

const VALID_TASK_TYPES = ["FOLLOW_UP", "CALL", "MEETING", "DOCUMENT", "REVIEW", "OTHER"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const VALID_REMINDERS = ["NONE", "15_MIN", "30_MIN", "1_HOUR", "1_DAY"];

class TaskModel {
  /**
   * Format raw PostgreSQL row into structured Task JSON object.
   */
  static formatTaskRow(row) {
    if (!row) return null;

    let formattedDueDate = null;
    if (row.due_date) {
      if (row.due_date instanceof Date) {
        const yyyy = row.due_date.getFullYear();
        const mm = String(row.due_date.getMonth() + 1).padStart(2, "0");
        const dd = String(row.due_date.getDate()).padStart(2, "0");
        formattedDueDate = `${yyyy}-${mm}-${dd}`;
      } else {
        formattedDueDate = String(row.due_date).split("T")[0];
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description || null,
      task_type: row.task_type,
      priority: row.priority,
      status: row.status,
      due_date: formattedDueDate,
      due_time: row.due_time || null,
      reminder: row.reminder || "NONE",
      completed_at: row.completed_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      related_client_id: row.related_client_id || null,
      related_lead_id: row.related_lead_id || null,
      assigned_to: row.assigned_to,
      created_by: row.created_by,
      assigned_user: row.assigned_to_id
        ? {
            id: row.assigned_to_id,
            name: row.assigned_to_name,
            full_name: row.assigned_to_name,
            email: row.assigned_to_email,
          }
        : null,
      assignedTo: row.assigned_to_id
        ? {
            id: row.assigned_to_id,
            name: row.assigned_to_name,
            full_name: row.assigned_to_name,
            email: row.assigned_to_email,
          }
        : null,
      assigned_to_user: row.assigned_to_id
        ? {
            id: row.assigned_to_id,
            name: row.assigned_to_name,
            full_name: row.assigned_to_name,
            email: row.assigned_to_email,
          }
        : null,
      creator: row.created_by_id
        ? {
            id: row.created_by_id,
            name: row.created_by_name,
            email: row.created_by_email,
          }
        : null,
      related_client: row.related_client_id
        ? {
            id: row.related_client_id,
            ucc_no: row.related_client_ucc,
            name: row.related_client_name,
            full_name: row.related_client_name,
            business_name: row.related_client_business_name || null,
          }
        : null,
      client: row.related_client_id
        ? {
            id: row.related_client_id,
            ucc_no: row.related_client_ucc,
            name: row.related_client_name,
            full_name: row.related_client_name,
            business_name: row.related_client_business_name || null,
          }
        : null,
      related_lead: row.related_lead_id
        ? {
            id: row.related_lead_id,
            name: row.related_lead_name,
            full_name: row.related_lead_name,
            company_name: row.related_lead_company_name || null,
          }
        : null,
      lead: row.related_lead_id
        ? {
            id: row.related_lead_id,
            name: row.related_lead_name,
            full_name: row.related_lead_name,
            company_name: row.related_lead_company_name || null,
          }
        : null,
    };
  }

  /**
   * Base SQL SELECT query with JOINs for assigned_user, creator, client, lead.
   */
  static get baseSelectQuery() {
    return `
      SELECT
        t.id, t.title, t.description, t.task_type, t.priority, t.status,
        t.due_date, t.due_time, t.reminder, t.completed_at, t.created_at, t.updated_at,
        t.related_client_id, t.related_lead_id, t.assigned_to, t.created_by,
        au.id AS assigned_to_id, au.name AS assigned_to_name, au.email AS assigned_to_email,
        cu.id AS created_by_id, cu.name AS created_by_name, cu.email AS created_by_email,
        c.ucc_no AS related_client_ucc, c.name AS related_client_name, c.business_name AS related_client_business_name,
        l.name AS related_lead_name, l.company_name AS related_lead_company_name
      FROM tasks t
      INNER JOIN users au ON au.id = t.assigned_to
      INNER JOIN users cu ON cu.id = t.created_by
      LEFT JOIN clients c ON c.id = t.related_client_id
      LEFT JOIN leads l ON l.id = t.related_lead_id
    `;
  }

  /**
   * Create a new Task record.
   */
  static async create({
    title,
    description = null,
    task_type,
    related_client_id = null,
    related_lead_id = null,
    assigned_to,
    priority,
    status = "PENDING",
    due_date,
    due_time = null,
    reminder = "NONE",
    created_by,
  }) {
    const cleanTaskType = task_type ? task_type.toUpperCase() : "OTHER";
    const cleanPriority = priority ? priority.toUpperCase() : "MEDIUM";
    const cleanStatus = status ? status.toUpperCase() : "PENDING";
    const cleanReminder = reminder ? reminder.toUpperCase() : "NONE";

    const completedAtValue = cleanStatus === "COMPLETED" ? new Date() : null;

    const query = `
      INSERT INTO tasks (
        title, description, task_type, related_client_id, related_lead_id,
        assigned_to, priority, status, due_date, due_time, reminder,
        completed_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const values = [
      title.trim(),
      description && description.trim() ? description.trim() : null,
      cleanTaskType,
      related_client_id ? parseInt(related_client_id, 10) : null,
      related_lead_id ? parseInt(related_lead_id, 10) : null,
      parseInt(assigned_to, 10),
      cleanPriority,
      cleanStatus,
      due_date,
      due_time || null,
      cleanReminder,
      completedAtValue,
      parseInt(created_by, 10),
    ];

    const result = await pool.query(query, values);
    const taskId = result.rows[0].id;
    return this.findById(taskId);
  }

  /**
   * Find single Task by ID with related entity details.
   */
  static async findById(id) {
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) return null;

    const query = `${this.baseSelectQuery} WHERE t.id = $1`;
    const result = await pool.query(query, [taskId]);
    if (result.rows.length === 0) return null;
    return this.formatTaskRow(result.rows[0]);
  }

  /**
   * Fetch tasks with filter and pagination support.
   */
  static async findAll({
    assigned_to,
    related_client_id,
    related_lead_id,
    status,
    priority,
    task_type,
    due_date,
    start_date,
    end_date,
    overdue,
    search,
    page = 1,
    limit = 10,
  } = {}) {
    const conditions = [];
    const params = [];

    if (assigned_to && parseInt(assigned_to, 10)) {
      params.push(parseInt(assigned_to, 10));
      conditions.push(`t.assigned_to = $${params.length}`);
    }

    if (related_client_id && parseInt(related_client_id, 10)) {
      params.push(parseInt(related_client_id, 10));
      conditions.push(`t.related_client_id = $${params.length}`);
    }

    if (related_lead_id && parseInt(related_lead_id, 10)) {
      params.push(parseInt(related_lead_id, 10));
      conditions.push(`t.related_lead_id = $${params.length}`);
    }

    if (status && status.trim() && status.toLowerCase() !== "all") {
      params.push(status.trim().toUpperCase());
      conditions.push(`t.status = $${params.length}`);
    }

    if (priority && priority.trim() && priority.toLowerCase() !== "all") {
      params.push(priority.trim().toUpperCase());
      conditions.push(`t.priority = $${params.length}`);
    }

    if (task_type && task_type.trim() && task_type.toLowerCase() !== "all") {
      params.push(task_type.trim().toUpperCase());
      conditions.push(`t.task_type = $${params.length}`);
    }

    if (due_date && due_date.trim()) {
      params.push(due_date.trim());
      conditions.push(`t.due_date = $${params.length}::date`);
    }

    if (start_date && start_date.trim()) {
      params.push(start_date.trim());
      conditions.push(`t.due_date >= $${params.length}::date`);
    }

    if (end_date && end_date.trim()) {
      params.push(end_date.trim());
      conditions.push(`t.due_date <= $${params.length}::date`);
    }

    if (overdue === true || overdue === "true" || overdue === "1") {
      conditions.push(
        `t.status NOT IN ('COMPLETED', 'CANCELLED') AND (t.due_date < CURRENT_DATE OR (t.due_date = CURRENT_DATE AND t.due_time IS NOT NULL AND t.due_time < CURRENT_TIME))`
      );
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const idx = params.length;
      conditions.push(`(LOWER(t.title) LIKE $${idx} OR LOWER(t.description) LIKE $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS total FROM tasks t ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const dataParams = [...params, limitNum, offset];
    const dataQuery = `
      ${this.baseSelectQuery}
      ${whereClause}
      ORDER BY t.due_date ASC, t.due_time ASC NULLS LAST, t.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, dataParams);
    const tasks = dataResult.rows.map((row) => this.formatTaskRow(row));
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * Update task fields.
   */
  static async update(id, fieldsToUpdate = {}) {
    const taskId = parseInt(id, 10);
    const existing = await this.findById(taskId);
    if (!existing) return null;

    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      "title",
      "description",
      "task_type",
      "priority",
      "status",
      "due_date",
      "due_time",
      "reminder",
      "assigned_to",
      "related_client_id",
      "related_lead_id",
    ];

    for (const field of allowedFields) {
      if (fieldsToUpdate[field] !== undefined) {
        let val = fieldsToUpdate[field];
        if (typeof val === "string") val = val.trim();

        if (["task_type", "priority", "status", "reminder"].includes(field) && typeof val === "string") {
          val = val.toUpperCase();
        }

        if (["assigned_to", "related_client_id", "related_lead_id"].includes(field)) {
          val = val ? parseInt(val, 10) : null;
        }

        fields.push(`${field} = $${idx++}`);
        values.push(val);
      }
    }

    if (fieldsToUpdate.status !== undefined) {
      const cleanStatus = fieldsToUpdate.status.toString().trim().toUpperCase();
      if (cleanStatus === "COMPLETED") {
        fields.push(`completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)`);
      } else {
        fields.push(`completed_at = NULL`);
      }
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(taskId);

    const query = `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`;
    await pool.query(query, values);
    return this.findById(taskId);
  }

  /**
   * Dedicated status update method for tasks.
   */
  static async updateStatus(id, status) {
    const taskId = parseInt(id, 10);
    const existing = await this.findById(taskId);
    if (!existing) return null;

    const cleanStatus = status.toString().trim().toUpperCase();
    const fields = [`status = $1`, `updated_at = CURRENT_TIMESTAMP`];
    const values = [cleanStatus, taskId];

    if (cleanStatus === "COMPLETED") {
      fields.push(`completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)`);
    } else {
      fields.push(`completed_at = NULL`);
    }

    const query = `UPDATE tasks SET ${fields.join(", ")} WHERE id = $2 RETURNING id`;
    await pool.query(query, values);
    return this.findById(taskId);
  }

  /**
   * Delete Task by ID.
   */
  static async delete(id) {
    const taskId = parseInt(id, 10);
    const query = `DELETE FROM tasks WHERE id = $1`;
    const result = await pool.query(query, [taskId]);
    return result.rowCount > 0;
  }
}

module.exports = {
  TaskModel,
  VALID_TASK_TYPES,
  VALID_PRIORITIES,
  VALID_STATUSES,
  VALID_REMINDERS,
};
