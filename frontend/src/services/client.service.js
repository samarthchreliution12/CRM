const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

class ClientService {
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
   * Fetch all active Client Types from backend.
   */
  static async getClientTypes(token) {
    return this.request("/client-types", { method: "GET" }, token);
  }

  /**
   * Fetch paginated Clients list with optional search and filters.
   */
  static async getClients({ search = "", status = "", client_type_id = "", page = 1, limit = 10 } = {}, token) {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    if (status && status !== "all") params.append("status", status.trim());
    if (client_type_id) params.append("client_type_id", client_type_id);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/clients${queryString}`, { method: "GET" }, token);
  }

  /**
   * Fetch single Client details including client type and family members.
   */
  static async getClient(id, token) {
    return this.request(`/clients/${id}`, { method: "GET" }, token);
  }

  /**
   * Create a new Client.
   */
  static async createClient(data, token) {
    return this.request(
      "/clients",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Update Client information.
   */
  static async updateClient(id, data, token) {
    return this.request(
      `/clients/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Update Client status (active / inactive).
   */
  static async updateClientStatus(id, status, token) {
    return this.request(
      `/clients/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      token
    );
  }

  /**
   * Delete Client.
   */
  static async deleteClient(id, token) {
    return this.request(
      `/clients/${id}`,
      {
        method: "DELETE",
      },
      token
    );
  }

  /**
   * Fetch family members for a client.
   */
  static async getFamilyMembers(clientId, token) {
    return this.request(`/clients/${clientId}/family-members`, { method: "GET" }, token);
  }

  /**
   * Add a family member for a client.
   */
  static async addFamilyMember(clientId, data, token) {
    return this.request(
      `/clients/${clientId}/family-members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Delete a family member.
   */
  static async deleteFamilyMember(clientId, familyMemberId, token) {
    return this.request(
      `/clients/${clientId}/family-members/${familyMemberId}`,
      {
        method: "DELETE",
      },
      token
    );
  }
}

export default ClientService;
