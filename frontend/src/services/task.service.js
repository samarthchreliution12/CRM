import apiFetch from "./apiClient";

class TaskService {
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

  /**
   * Fetch tasks with filters and pagination.
   */
  static async getTasks(
    {
      assigned_to = "",
      related_client_id = "",
      related_lead_id = "",
      status = "",
      priority = "",
      task_type = "",
      due_date = "",
      start_date = "",
      end_date = "",
      overdue = false,
      search = "",
      page = 1,
      limit = 10,
    } = {},
    token
  ) {
    const params = new URLSearchParams();
    if (assigned_to && assigned_to !== "all") params.append("assigned_to", assigned_to);
    if (related_client_id && related_client_id !== "all") params.append("related_client_id", related_client_id);
    if (related_lead_id && related_lead_id !== "all") params.append("related_lead_id", related_lead_id);
    if (status && status !== "all") params.append("status", status.trim());
    if (priority && priority !== "all") params.append("priority", priority.trim());
    if (task_type && task_type !== "all") params.append("task_type", task_type.trim());
    if (due_date) params.append("due_date", due_date.trim());
    if (start_date) params.append("start_date", start_date.trim());
    if (end_date) params.append("end_date", end_date.trim());
    if (overdue) params.append("overdue", "true");
    if (search) params.append("search", search.trim());
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/tasks${queryString}`, { method: "GET" }, token);
  }

  /**
   * Fetch single task details by ID.
   */
  static async getTaskById(id, token) {
    return this.request(`/tasks/${id}`, { method: "GET" }, token);
  }

  /**
   * Create a new task.
   */
  static async createTask(taskData, token) {
    return this.request(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify(taskData),
      },
      token
    );
  }

  /**
   * Update task details.
   */
  static async updateTask(id, taskData, token) {
    return this.request(
      `/tasks/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(taskData),
      },
      token
    );
  }

  /**
   * Update task status only.
   */
  static async updateTaskStatus(id, status, token) {
    return this.request(
      `/tasks/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      token
    );
  }

  /**
   * Delete task by ID.
   */
  static async deleteTask(id, token) {
    return this.request(
      `/tasks/${id}`,
      {
        method: "DELETE",
      },
      token
    );
  }

  /**
   * Fetch task assignment & status update notifications.
   */
  static async getTaskNotifications(token) {
    return this.request("/tasks/notifications", { method: "GET" }, token);
  }
}

export default TaskService;
