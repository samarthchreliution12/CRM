const SystemSettingModel = require("../models/systemSetting.model");
const AuditService = require("../services/audit.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class SystemSettingController {
  /**
   * GET /api/admin/settings
   */
  static async getSettings(req, res, next) {
    try {
      const settings = await SystemSettingModel.getAllSettings();
      return sendSuccess(res, 200, "System settings retrieved successfully", { settings });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/settings
   */
  static async updateSettings(req, res, next) {
    try {
      const { session_timeout_minutes, lockout_attempts, mfa_enforced } = req.body;
      const updates = {};

      if (session_timeout_minutes !== undefined) {
        updates.session_timeout_minutes = String(session_timeout_minutes);
      }
      if (lockout_attempts !== undefined) {
        updates.lockout_attempts = String(lockout_attempts);
      }
      if (mfa_enforced !== undefined) {
        updates.mfa_enforced = String(mfa_enforced);
      }

      if (Object.keys(updates).length === 0) {
        return sendError(res, 400, "No valid setting keys provided for update.");
      }

      const updatedSettings = await SystemSettingModel.updateSettings(updates);

      await AuditService.log({
        userId: req.user.id,
        action: "UPDATE_SYSTEM_SETTINGS",
        module: "SETTINGS",
        entityType: "SYSTEM",
        entityId: null,
        description: `Admin updated system settings: ${JSON.stringify(updates)}`,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
      });

      return sendSuccess(res, 200, "System settings updated successfully", {
        settings: updatedSettings,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SystemSettingController;
