import apiFetch from "./apiClient";

class SettingsService {
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
   * Fetch system settings (session_timeout, lockout_attempts, etc.)
   */
  static async getSettings(token) {
    return this.request("/admin/settings", { method: "GET" }, token);
  }

  /**
   * Update system settings
   */
  static async updateSettings(settings, token) {
    return this.request(
      "/admin/settings",
      {
        method: "PUT",
        body: JSON.stringify({ settings }),
      },
      token
    );
  }

  /**
   * Get MFA status for currently authenticated user
   */
  static async getMfaStatus(token) {
    return this.request("/auth/mfa/status", { method: "GET" }, token);
  }

  /**
   * Generate MFA Secret & QR Code for Authenticator App
   */
  static async setupMfa(token) {
    return this.request("/auth/mfa/setup", { method: "GET" }, token);
  }

  /**
   * Verify Step 1 code for MFA setup
   */
  static async verifyStep1(code, token) {
    return this.request(
      "/auth/mfa/verify-step1",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      },
      token
    );
  }

  /**
   * Verify Step 2 rotated code and activate MFA
   */
  static async activateMfa(code, token) {
    return this.request(
      "/auth/mfa/activate",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      },
      token
    );
  }

  /**
   * Disable MFA for current user
   */
  static async disableMfa(token) {
    return this.request(
      "/auth/mfa/disable",
      {
        method: "POST",
      },
      token
    );
  }

  /**
   * Admin resets password for staff user
   */
  static async resetStaffPassword(userId, newPassword, token) {
    return this.request(
      `/admin/staff/${userId}/reset-password`,
      {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      },
      token
    );
  }

  /**
   * Admin force logouts a staff user from all devices
   */
  static async forceLogoutStaff(userId, token) {
    return this.request(
      `/admin/staff/${userId}/force-logout`,
      {
        method: "POST",
      },
      token
    );
  }

  /**
   * Admin terminates all active sessions for all other users globally
   */
  static async logoutAllUsers(token) {
    return this.request(
      "/admin/staff/logout-all",
      {
        method: "POST",
      },
      token
    );
  }
}

export default SettingsService;
