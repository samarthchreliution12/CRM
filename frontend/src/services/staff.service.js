import apiFetch from "./apiClient";

class StaffService {
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
   * Fetch all Staff users with search, status filtering, and pagination.
   */
  static async getStaffUsers({ search = "", status = "", page = 1, limit = 20 }, token) {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    if (status && status !== "all") params.append("status", status.trim());
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/staff${queryString}`, { method: "GET" }, token)
      .catch(() => this.request(`/admin/staff${queryString}`, { method: "GET" }, token));
  }

  /**
   * Fetch single Staff user details by ID.
   */
  static async getStaffUser(id, token) {
    return this.request(`/admin/staff/${id}`, { method: "GET" }, token);
  }

  /**
   * Create a new Staff user account.
   */
  static async createStaffUser({ name, email, mobile, password }, token) {
    return this.request(
      "/admin/staff",
      {
        method: "POST",
        body: JSON.stringify({ name, email, mobile, password }),
      },
      token
    );
  }

  /**
   * Update Staff user profile fields.
   */
  static async updateStaffUser(id, { name, email, mobile }, token) {
    return this.request(
      `/admin/staff/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name, email, mobile }),
      },
      token
    );
  }

  /**
   * Update Staff user status (active / inactive).
   */
  static async updateStaffStatus(id, status, token) {
    return this.request(
      `/admin/staff/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      token
    );
  }

  /**
   * Delete Staff user account.
   */
  static async deleteStaffUser(id, token) {
    return this.request(
      `/admin/staff/${id}`,
      {
        method: "DELETE",
      },
      token
    );
  }
}

export default StaffService;
