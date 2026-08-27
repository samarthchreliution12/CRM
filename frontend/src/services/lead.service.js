const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

class LeadService {
  static async request(endpoint, options = {}, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
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
   * Fetch leads list for Kanban board or table view with filters.
   */
  static async getLeads(
    {
      search = "",
      status = "",
      assigned_to = "",
      source = "",
      service_id = "",
      client_type_id = "",
      priority = "",
      my_leads = false,
      page = 1,
      limit = 100,
    } = {},
    token
  ) {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    if (status && status !== "all") params.append("status", status.trim());
    if (assigned_to && assigned_to !== "all") params.append("assigned_to", assigned_to);
    if (source && source !== "all") params.append("source", source.trim());
    if (service_id && service_id !== "all") params.append("service_id", service_id);
    if (client_type_id && client_type_id !== "all") params.append("client_type_id", client_type_id);
    if (priority && priority !== "all") params.append("priority", priority.trim());
    if (my_leads) params.append("my_leads", "true");
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/leads${queryString}`, { method: "GET" }, token);
  }

  /**
   * Fetch single lead details by ID.
   */
  static async getLeadById(id, token) {
    return this.request(`/leads/${id}`, { method: "GET" }, token);
  }

  /**
   * Create a new Lead record.
   */
  static async createLead(leadData, token) {
    return this.request(
      "/leads",
      {
        method: "POST",
        body: JSON.stringify(leadData),
      },
      token
    );
  }

  /**
   * Update specified lead fields.
   */
  static async updateLead(id, leadData, token) {
    return this.request(
      `/leads/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(leadData),
      },
      token
    );
  }

  /**
   * Dedicated drag-and-drop status update API.
   */
  static async updateLeadStatus(id, status, token) {
    return this.request(
      `/leads/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      token
    );
  }

  /**
   * Dedicated lead conversion to client API.
   */
  static async convertLeadToClient(id, options = {}, token) {
    return this.request(
      `/leads/${id}/convert`,
      {
        method: "POST",
        body: JSON.stringify(options),
      },
      token
    );
  }

  /**
   * Delete lead record by ID.
   */
  static async deleteLead(id, token) {
    return this.request(
      `/leads/${id}`,
      {
        method: "DELETE",
      },
      token
    );
  }
}

export default LeadService;
