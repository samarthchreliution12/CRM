const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

class DashboardService {
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

  static async getUpcomingBirthdays(token = null) {
    return this.request("/dashboard/upcoming-birthdays", { method: "GET" }, token);
  }

  static async getOverview(token = null) {
    return this.request("/dashboard/overview", { method: "GET" }, token);
  }

  static async getCrossSelling(token = null) {
    return this.request("/dashboard/cross-selling", { method: "GET" }, token);
  }
}

export default DashboardService;
