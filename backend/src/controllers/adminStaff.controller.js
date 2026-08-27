const AdminStaffService = require("../services/adminStaff.service");
const { sendSuccess } = require("../utils/response.util");

class AdminStaffController {
  /**
   * GET /api/admin/staff
   */
  static async listStaff(req, res, next) {
    try {
      const { search, status, page, limit } = req.query;
      const result = await AdminStaffService.listStaff({ search, status, page, limit });
      return sendSuccess(res, 200, "Staff users retrieved successfully", {
        staff: result.staff,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/staff/:id
   */
  static async getStaffById(req, res, next) {
    try {
      const staff = await AdminStaffService.getStaffById(req.params.id);
      return sendSuccess(res, 200, "Staff user details retrieved successfully", { staff });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/staff
   */
  static async createStaff(req, res, next) {
    try {
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const staff = await AdminStaffService.createStaff(req.body, context);
      return sendSuccess(res, 201, "Staff user created successfully", { staff });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/staff/:id
   */
  static async updateStaff(req, res, next) {
    try {
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const staff = await AdminStaffService.updateStaff(req.params.id, req.body, context);
      return sendSuccess(res, 200, "Staff user updated successfully", { staff });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/staff/:id/status
   */
  static async updateStaffStatus(req, res, next) {
    try {
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const staff = await AdminStaffService.updateStaffStatus(req.params.id, req.body.status, context);
      return sendSuccess(res, 200, "Staff user status updated successfully", { staff });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/staff/:id
   */
  static async deleteStaff(req, res, next) {
    try {
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const result = await AdminStaffService.deleteStaff(req.params.id, req.user.id, context);
      return sendSuccess(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminStaffController;
