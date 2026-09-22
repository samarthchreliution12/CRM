import apiFetch from "./apiClient";

class NotificationService {
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
   * Fetch user notifications list with optional filters (is_read, limit, offset).
   */
  static async getNotifications(token, { is_read = "", limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (is_read !== "" && is_read !== undefined && is_read !== null) {
      params.append("is_read", is_read);
    }
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);

    const qs = params.toString();
    const endpoint = `/notifications${qs ? `?${qs}` : ""}`;
    return this.request(endpoint, { method: "GET" }, token);
  }

  /**
   * Get total unread notifications count for the authenticated user.
   */
  static async getUnreadCount(token) {
    return this.request("/notifications/unread-count", { method: "GET" }, token);
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(id, token) {
    return this.request(`/notifications/${id}/read`, { method: "PATCH" }, token);
  }

  /**
   * Mark all unread notifications as read.
   */
  static async markAllAsRead(token) {
    return this.request("/notifications/read-all", { method: "PATCH" }, token);
  }

  /**
   * Delete a notification.
   */
  static async deleteNotification(id, token) {
    return this.request(`/notifications/${id}`, { method: "DELETE" }, token);
  }
}

export default NotificationService;
