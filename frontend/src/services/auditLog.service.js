import apiFetch from "./apiClient";

class AuditLogService {
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
   * Fetch paginated audit logs with search, user, module, action, and date range filters.
   */
  static async getAuditLogs(
    {
      search = "",
      user_id = "",
      module = "",
      action = "",
      start_date = "",
      end_date = "",
      page = 1,
      limit = 20,
    } = {},
    token
  ) {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    if (user_id) params.append("user_id", user_id);
    if (module && module.toLowerCase() !== "all") params.append("module", module.trim());
    if (action && action.toLowerCase() !== "all") params.append("action", action.trim());
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/admin/audit-logs${queryString}`, { method: "GET" }, token);
  }
}

export default AuditLogService;
