const getBaseApiUrl = () => {
  const raw = (process.env.REACT_APP_API_URL || "http://localhost:5050/api").trim().replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

const API_BASE_URL = getBaseApiUrl();
const CLIENT_PORTAL_BASE = `${API_BASE_URL}/client-portal`;

const TOKEN_KEY = "client_portal_token";
const DATA_KEY = "client_portal_data";

class ClientPortalService {
  /**
   * Helper: Retrieve stored client token.
   */
  static getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  }

  /**
   * Helper: Save client token.
   */
  static setToken(token, rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  /**
   * Helper: Retrieve stored client data.
   */
  static getStoredClient() {
    try {
      const data = localStorage.getItem(DATA_KEY) || sessionStorage.getItem(DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Helper: Save client data.
   */
  static setStoredClient(client, rememberMe = true) {
    if (rememberMe) {
      localStorage.setItem(DATA_KEY, JSON.stringify(client));
    } else {
      sessionStorage.setItem(DATA_KEY, JSON.stringify(client));
    }
  }

  /**
   * Helper: Clear all client portal authentication storage.
   */
  static clearStorage() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DATA_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(DATA_KEY);
  }

  /**
   * Internal fetch wrapper for Client Portal requests with Bearer token.
   */
  static async request(endpoint, options = {}) {
    const url = `${CLIENT_PORTAL_BASE}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized / Expired Session
    if (response.status === 401) {
      this.clearStorage();
      if (!window.location.pathname.includes("/client-login")) {
        window.location.href = "/client-login";
      }
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(errorData.message || "Your session has expired. Please log in again.");
      err.statusCode = 401;
      throw err;
    }

    // For file downloads or binary blobs
    if (options.asBlob) {
      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = "Failed to download document.";
        try {
          const jsonErr = JSON.parse(errorText);
          errMsg = jsonErr.message || errMsg;
        } catch {}
        const err = new Error(errMsg);
        err.statusCode = response.status;
        throw err;
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      let filename = "document";
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
      return { blob, filename, mimeType: response.headers.get("Content-Type") };
    }

    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || `Request failed with status ${response.status}`);
      err.statusCode = response.status;
      err.errors = data.errors || null;
      throw err;
    }

    return data;
  }

  /**
   * 1. Client Login via mobile number.
   * POST /api/client-portal/login
   */
  static async login(mobileNo, rememberMe = true) {
    const response = await this.request("/login", {
      method: "POST",
      body: JSON.stringify({ mobile_no: mobileNo }),
    });

    if (response && response.success && response.data) {
      this.setToken(response.data.token, rememberMe);
      this.setStoredClient(response.data.client, rememberMe);
    }

    return response.data;
  }

  /**
   * 2. Client Logout.
   * POST /api/client-portal/logout
   */
  static async logout() {
    try {
      await this.request("/logout", {
        method: "POST",
      });
    } catch (e) {
      console.warn("Client logout API call error (proceeding to clear storage):", e);
    } finally {
      this.clearStorage();
    }
  }

  /**
   * 3. Get Logged-in Client Profile.
   * GET /api/client-portal/profile
   */
  static async getProfile() {
    const response = await this.request("/profile", {
      method: "GET",
    });
    return response.data?.client || null;
  }

  /**
   * 4. Get Client Document Requirements and Upload Status.
   * GET /api/client-portal/documents
   */
  static async getDocuments() {
    const response = await this.request("/documents", {
      method: "GET",
    });
    return response.data?.documents || [];
  }

  /**
   * 5. Upload Document against requirement.
   * POST /api/client-portal/documents/:documentId/upload
   */
  static async uploadDocument(documentId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = documentId
      ? `/documents/${documentId}/upload`
      : `/documents/upload`;

    const response = await this.request(endpoint, {
      method: "POST",
      body: formData,
    });

    return response.data?.document || null;
  }

  /**
   * 6. Download / View client document as Blob.
   * GET /api/client-portal/documents/:documentId?download=true
   */
  static async getDocumentFile(documentId, download = false) {
    return this.request(`/documents/${documentId}?download=${download ? "true" : "false"}`, {
      method: "GET",
      asBlob: true,
    });
  }
}

export default ClientPortalService;
