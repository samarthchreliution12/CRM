import apiFetch from "./apiClient";

class AuthService {
  /**
   * Authenticate user credentials.
   */
  static async login(email, password) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Rotate refresh token cookie and receive new access token.
   */
  static async refreshToken() {
    return apiFetch("/auth/refresh", {
      method: "POST",
    });
  }

  /**
   * Register a new user account.
   */
  static async signup({ name, email, password, mobile, role_id = 3 }) {
    return apiFetch("/auth/signup", {
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
    return apiFetch("/auth/me", {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * Update profile of currently authenticated user.
   */
  static async updateProfile({ name, email, mobile }, token) {
    return apiFetch("/auth/profile", {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ name, email, mobile }),
    });
  }

  /**
   * Logout current session.
   */
  static async logout(token) {
    return apiFetch("/auth/logout", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * Request password reset link.
   */
  static async forgotPassword(email) {
    return apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with reset token.
   */
  static async resetPassword(token, password, confirmPassword) {
    return apiFetch("/auth/reset-password", {
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
