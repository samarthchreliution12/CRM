const PermissionService = require("../services/permission.service");
const { validateCreatePermissionInput, validateUpdatePermissionInput } = require("../validators/permission.validator");
const { sendSuccess, sendError } = require("../utils/response.util");

class PermissionController {
  static async listPermissions(req, res) {
    try {
      const { search, module, page, limit } = req.query;
      const result = await PermissionService.listPermissions({
        search,
        module,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
      });

      return sendSuccess(res, 200, "Permissions retrieved successfully", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getPermission(req, res) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermissionById(id);
      return sendSuccess(res, 200, "Permission retrieved successfully", { permission });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async createPermission(req, res) {
    try {
      const validation = validateCreatePermissionInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const permission = await PermissionService.createPermission(req.body);
      return sendSuccess(res, 201, "Permission created successfully", { permission });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const validation = validateUpdatePermissionInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const permission = await PermissionService.updatePermission(id, req.body);
      return sendSuccess(res, 200, "Permission updated successfully", { permission });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async deletePermission(req, res) {
    try {
      const { id } = req.params;
      await PermissionService.deletePermission(id);
      return sendSuccess(res, 200, "Permission deleted successfully");
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = PermissionController;
