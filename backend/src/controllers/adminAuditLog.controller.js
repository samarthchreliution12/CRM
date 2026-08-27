const AuditService = require("../services/audit.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class AdminAuditLogController {
  /**
   * Retrieve paginated audit logs for authorized Admin users.
   */
  static async getAuditLogs(req, res) {
    try {
      const { page, limit, search, user_id, module, action, start_date, end_date } = req.query;

      const result = await AuditService.listAuditLogs({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        search,
        user_id: user_id ? parseInt(user_id, 10) : null,
        module,
        action,
        start_date,
        end_date,
      });

      return sendSuccess(res, 200, "Audit logs retrieved successfully", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = AdminAuditLogController;
