const DashboardService = require("../services/dashboard.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class DashboardController {
  static async getUpcomingBirthdays(req, res) {
    try {
      const { referenceDate } = req.query;
      const birthdays = await DashboardService.getUpcomingBirthdays(referenceDate);

      return sendSuccess(res, 200, "Upcoming birthdays retrieved successfully", {
        birthdays,
        total: birthdays.length,
      });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getOverview(req, res) {
    try {
      const stats = await DashboardService.getClientOverviewStats();
      return sendSuccess(res, 200, "Dashboard client overview retrieved successfully", stats);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getCrossSelling(req, res) {
    try {
      const crossSellingData = await DashboardService.getCrossSellingStats();
      return sendSuccess(res, 200, "Cross-selling opportunities retrieved successfully", crossSellingData);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = DashboardController;
