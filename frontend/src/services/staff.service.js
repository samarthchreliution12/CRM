const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

class StaffService {
  static async request(endpoint, options = {}, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || "An unexpected error occurred");
        error.statusCode = response.status;
        error.errors = data.errors || null;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.statusCode) {
        throw err;
      }
      const networkError = new Error("Unable to connect to the server. Please check your connection.");
      networkError.statusCode = 503;
      throw networkError;
    }
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
    return this.request(`/admin/staff${queryString}`, { method: "GET" }, token);
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
