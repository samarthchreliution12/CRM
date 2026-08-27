const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

class ClientService {
  static async request(endpoint, options = {}, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Default Content-Type to application/json unless sending FormData
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
   * Fetch active Client Types for dropdowns (available to all authenticated users).
   */
  static async getClientTypes(token) {
    return this.request("/client-types", { method: "GET" }, token);
  }

  /**
   * Fetch active Client Services for checkboxes (available to all authenticated users).
   */
  static async getClientServices(token) {
    return this.request("/client-services", { method: "GET" }, token);
  }

  /**
   * Fetch paginated Client Types list (Admin management).
   */
  static async getAdminClientTypes({ search = "", status = "", page = 1, limit = 10 } = {}, token) {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    if (status && status !== "all") params.append("status", status.trim());
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/admin/client-types${queryString}`, { method: "GET" }, token);
  }

  /**
   * Fetch single Client Type (Admin).
   */
  static async getAdminClientType(id, token) {
    return this.request(`/admin/client-types/${id}`, { method: "GET" }, token);
  }

  /**
   * Create a new Client Type (Admin).
   */
  static async createClientType(data, token) {
    return this.request(
      "/admin/client-types",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Update Client Type (Admin).
   */
  static async updateClientType(id, data, token) {
    return this.request(
      `/admin/client-types/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Delete Client Type (Admin).
   */
  static async deleteClientType(id, token) {
    return this.request(
      `/admin/client-types/${id}`,
      {
        method: "DELETE",
      },
      token
    );
  }

  /**
   * Fetch paginated Client Services list (Admin management).
   */
  static async getAdminClientServices({ search = "", status = "", page = 1, limit = 10 } = {}, token) {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    if (status && status !== "all") params.append("status", status.trim());
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/admin/client-services${queryString}`, { method: "GET" }, token);
  }

  /**
   * Fetch single Client Service (Admin).
   */
  static async getAdminClientService(id, token) {
    return this.request(`/admin/client-services/${id}`, { method: "GET" }, token);
  }

  /**
   * Create a new Client Service (Admin).
   */
  static async createClientService(data, token) {
    return this.request(
      "/admin/client-services",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Update Client Service (Admin).
   */
  static async updateClientService(id, data, token) {
    return this.request(
      `/admin/client-services/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token
    );
  }

  /**
   * Delete Client Service (Admin).
   */
  static async deleteClientService(id, token) {
    return this.request(
      `/admin/client-services/${id}`,
      {
        method: "DELETE",
      },
      token
    );
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

  /**
   * Export clients to CSV downloadable blob file.
   */
  static async exportClients({ client_ids = [], filters = {}, format = "csv" } = {}, token) {
    const url = `${API_BASE_URL}/clients/export`;
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const body = JSON.stringify({
      client_ids,
      filters,
      format,
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      let errorMessage = "Unable to export clients. Please try again.";
      let statusCode = response.status;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        if (response.status === 403) {
          errorMessage = "You do not have permission to export clients.";
        } else if (response.status === 404) {
          errorMessage = "No clients found to export.";
        }
      }
      const error = new Error(errorMessage);
      error.statusCode = statusCode;
      throw error;
    }

    const blob = await response.blob();

    // Extract filename from Content-Disposition header if available
    let filename = `clients-export-${new Date().toISOString().split("T")[0]}.csv`;
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    return { blob, filename };
  }

  /* ======================================================
   * CLIENT DOCUMENTS API METHODS
   * ====================================================== */

  /**
   * Fetch paginated list of all client documents (Admin/Staff Document Management).
   */
  static async getAdminDocuments({ search = "", status = "", document_type = "", client_id = "", page = 1, limit = 10 } = {}, token) {
    const params = new URLSearchParams();
    if (search) params.append("search", search.trim());
    if (status && status !== "all") params.append("status", status.trim());
    if (document_type && document_type !== "all") params.append("document_type", document_type.trim());
    if (client_id) params.append("client_id", client_id);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/admin/documents${queryString}`, { method: "GET" }, token);
  }

  /**
   * Fetch documents for a specific client.
   */
  static async getClientDocuments(clientId, token) {
    return this.request(`/clients/${clientId}/documents`, { method: "GET" }, token);
  }

  /**
   * Upload a document for a client (FormData payload).
   */
  static async uploadClientDocument(clientId, formData, token) {
    return this.request(
      `/clients/${clientId}/documents`,
      {
        method: "POST",
        body: formData,
      },
      token
    );
  }

  /**
   * Replace an existing document for a client (FormData payload).
   */
  static async replaceClientDocument(clientId, documentId, formData, token) {
    return this.request(
      `/clients/${clientId}/documents/${documentId}/replace`,
      {
        method: "PATCH",
        body: formData,
      },
      token
    );
  }

  /**
   * Fetch decrypted binary blob stream for document viewing/previewing.
   */
  static async getDocumentFileBlob(clientId, documentId, token) {
    const url = `${API_BASE_URL}/clients/${clientId}/documents/${documentId}`;
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch document file (Status: ${response.status})`);
    }

    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type") || "application/pdf";
    return { blob, contentType };
  }

  /**
   * Approve a pending document.
   */
  static async approveDocument(documentId, token) {
    return this.request(
      `/admin/documents/${documentId}/approve`,
      {
        method: "PATCH",
      },
      token
    );
  }

  /**
   * Reject a pending document.
   */
  static async rejectDocument(documentId, rejection_reason, token) {
    return this.request(
      `/admin/documents/${documentId}/reject`,
      {
        method: "PATCH",
        body: JSON.stringify({ rejection_reason }),
      },
      token
    );
  }

  /**
   * Delete a document.
   */
  static async deleteClientDocument(clientId, documentId, token) {
    return this.request(
      `/clients/${clientId}/documents/${documentId}`,
      {
        method: "DELETE",
      },
      token
    );
  }
}

export default ClientService;
