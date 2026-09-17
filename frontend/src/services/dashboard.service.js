import apiFetch from "./apiClient";

class DashboardService {
  static async getUpcomingBirthdays(token = null) {
    return apiFetch("/dashboard/upcoming-birthdays", { method: "GET" });
  }

  static async getOverview(token = null) {
    return apiFetch("/dashboard/overview", { method: "GET" });
  }

  static async getCrossSelling(token = null) {
    return apiFetch("/dashboard/cross-selling", { method: "GET" });
  }

  static async getPendingFollowups(token = null) {
    return apiFetch("/dashboard/pending-followups", { method: "GET" });
  }
}

export default DashboardService;
