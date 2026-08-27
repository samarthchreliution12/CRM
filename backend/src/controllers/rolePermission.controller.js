const RolePermissionService = require("../services/rolePermission.service");
const { validateReplaceRolePermissionsInput } = require("../validators/rolePermission.validator");
const { sendSuccess, sendError } = require("../utils/response.util");

class RolePermissionController {
  static async getRoles(req, res) {
    try {
      const result = await RolePermissionService.getRoles();
      return sendSuccess(res, 200, "Roles retrieved successfully", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getRolePermissions(req, res) {
    try {
      const { roleId } = req.params;
      const result = await RolePermissionService.getRolePermissions(roleId);
      return sendSuccess(res, 200, "Role permissions retrieved successfully", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async replaceRolePermissions(req, res) {
    try {
      const { roleId } = req.params;
      const validation = validateReplaceRolePermissionsInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const result = await RolePermissionService.replaceRolePermissions(roleId, req.body.permission_ids, context);
      return sendSuccess(res, 200, "Role permissions updated successfully", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = RolePermissionController;
