const GroupService = require("../services/group.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class GroupController {
  // POST /api/roles/groups - Create a custom group
  static async createGroup(req, res, next) {
    try {
      const { name, description } = req.body;
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const group = await GroupService.createGroup({ name, description }, context);
      return sendSuccess(res, 201, "Group created successfully", { group });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/roles/groups - List all custom groups
  static async getGroups(req, res, next) {
    try {
      const groups = await GroupService.getGroups();
      return sendSuccess(res, 200, "Groups retrieved successfully", { groups });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/roles/groups/:id - Get group details (info, permissions, members)
  static async getGroupDetails(req, res, next) {
    try {
      const { id } = req.params;
      const details = await GroupService.getGroupDetails(id);
      return sendSuccess(res, 200, "Group details retrieved successfully", details);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/roles/groups/:id/members - Add members to group
  static async addMembers(req, res, next) {
    try {
      const { id } = req.params;
      const userIds = req.body.userIds || req.body.user_ids || req.body.userIds;
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const result = await GroupService.addMembers(id, userIds, context);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/roles/groups/:id/members/:userId - Remove member from group
  static async removeMember(req, res, next) {
    try {
      const { id, userId } = req.params;
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const result = await GroupService.removeMember(id, userId, context);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/roles/groups/:id/permissions - Update group permissions
  static async updatePermissions(req, res, next) {
    try {
      const { id } = req.params;
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const result = await GroupService.updatePermissions(id, req.body, context);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/roles/groups/:id - Delete custom group
  static async deleteGroup(req, res, next) {
    try {
      const { id } = req.params;
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const result = await GroupService.deleteGroup(id, context);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = GroupController;
