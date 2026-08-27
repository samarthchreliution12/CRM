const GroupService = require("../services/group.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class GroupController {
  // POST /api/roles/groups - Create a custom group
  static async createGroup(req, res, next) {
    try {
      const { name, description } = req.body;
      const group = await GroupService.createGroup({ name, description });
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
      const result = await GroupService.addMembers(id, userIds);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/roles/groups/:id/members/:userId - Remove member from group
  static async removeMember(req, res, next) {
    try {
      const { id, userId } = req.params;
      const result = await GroupService.removeMember(id, userId);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/roles/groups/:id/permissions - Update group permissions
  static async updatePermissions(req, res, next) {
    try {
      const { id } = req.params;
      const result = await GroupService.updatePermissions(id, req.body);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/roles/groups/:id - Delete custom group
  static async deleteGroup(req, res, next) {
    try {
      const { id } = req.params;
      const result = await GroupService.deleteGroup(id);
      return sendSuccess(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = GroupController;
