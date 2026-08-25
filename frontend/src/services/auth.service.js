const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

class AuthService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

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
   * Authenticate user credentials.
   */
  static async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Register a new user account.
   */
  static async signup({ name, email, password, mobile, role_id = 3 }) {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        mobile: mobile || null,
        role_id: Number(role_id),
      }),
    });
  }

  /**
   * Retrieve profile of currently authenticated user.
   */
  static async getCurrentUser(token) {
    return this.request("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Update profile of currently authenticated user.
   */
  static async updateProfile({ name, email, mobile }, token) {
    return this.request("/auth/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, mobile }),
    });
  }

  /**
   * Logout current session.
   */
  static async logout(token) {
    return this.request("/auth/logout", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * Request password reset link.
   */
  static async forgotPassword(email) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with reset token.
   */
  static async resetPassword(token, password, confirmPassword) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
        confirm_password: confirmPassword,
      }),
    });
  }
}

export default AuthService;
