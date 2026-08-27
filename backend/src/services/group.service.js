const GroupModel = require("../models/group.model");
const PermissionModel = require("../models/permission.model");
const pool = require("../config/database");
const AuditService = require("./audit.service");

class GroupService {
  // Create custom group
  static async createGroup({ name, description }, context = {}) {
    if (!name || !name.trim()) {
      const err = new Error("Group name is required.");
      err.statusCode = 400;
      throw err;
    }

    const existing = await GroupModel.findByName(name.trim());
    if (existing) {
      const err = new Error(`A group or role with the name '${name.trim()}' already exists.`);
      err.statusCode = 400;
      throw err;
    }

    const group = await GroupModel.createGroup({ name, description });

    await AuditService.log({
      userId: context.userId,
      action: "CREATE",
      module: "GROUPS",
      entityType: "GROUP",
      entityId: group.id,
      description: `Created group: ${group.name}`,
      newValues: { name: group.name, description: group.description },
      ipAddress: context.ipAddress,
    });

    return group;
  }

  // Get all custom groups
  static async getGroups() {
    const groups = await GroupModel.findAllCustomGroups();
    return groups;
  }

  // Get group details by ID
  static async getGroupDetails(groupId) {
    const parsedId = parseInt(groupId, 10);
    if (!parsedId || isNaN(parsedId)) {
      const err = new Error("Invalid group ID.");
      err.statusCode = 400;
      throw err;
    }

    const group = await GroupModel.findById(parsedId);
    if (!group) {
      const err = new Error("Group not found.");
      err.statusCode = 404;
      throw err;
    }

    const permissions = await PermissionModel.getPermissionsByRoleId(parsedId);
    const members = await GroupModel.getGroupMembers(parsedId);

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        status: group.status,
        member_count: parseInt(group.member_count, 10) || members.length,
        created_at: group.created_at,
        updated_at: group.updated_at,
      },
      permissions: permissions.map((p) => ({
        id: p.id,
        permission_key: p.permission_key || p.name,
        name: p.permission_key || p.name,
        module: p.module,
        action: p.action,
        description: p.description,
      })),
      members: members.map((m) => ({
        id: m.id,
        user_id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        created_at: m.created_at,
      })),
    };
  }

  // Add staff members to group
  static async addMembers(groupId, userIds, context = {}) {
    const parsedGroupId = parseInt(groupId, 10);
    if (!parsedGroupId || isNaN(parsedGroupId)) {
      const err = new Error("Invalid group ID.");
      err.statusCode = 400;
      throw err;
    }

    const group = await GroupModel.findById(parsedGroupId);
    if (!group) {
      const err = new Error("Group not found.");
      err.statusCode = 404;
      throw err;
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      const err = new Error("userIds array must contain at least one valid user ID.");
      err.statusCode = 400;
      throw err;
    }

    const cleanUserIds = userIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    const uniqueUserIds = [...new Set(cleanUserIds)];

    if (uniqueUserIds.length === 0) {
      const err = new Error("No valid user IDs provided.");
      err.statusCode = 400;
      throw err;
    }

    // Verify all specified users exist
    const usersRes = await pool.query(
      `SELECT id FROM users WHERE id = ANY($1::int[])`,
      [uniqueUserIds]
    );

    if (usersRes.rows.length !== uniqueUserIds.length) {
      const foundIds = new Set(usersRes.rows.map((r) => r.id));
      const missingIds = uniqueUserIds.filter((id) => !foundIds.has(id));
      const err = new Error(`One or more specified users were not found: ${missingIds.join(", ")}`);
      err.statusCode = 404;
      throw err;
    }

    await GroupModel.addMembers(parsedGroupId, uniqueUserIds);
    const updatedMembers = await GroupModel.getGroupMembers(parsedGroupId);

    await AuditService.log({
      userId: context.userId,
      action: "ADD_MEMBERS",
      module: "GROUPS",
      entityType: "GROUP",
      entityId: parsedGroupId,
      description: `Added ${uniqueUserIds.length} user(s) to group '${group.name}'`,
      newValues: { user_ids: uniqueUserIds },
      ipAddress: context.ipAddress,
    });

    return {
      message: `${uniqueUserIds.length} user(s) successfully added to group '${group.name}'.`,
      members: updatedMembers.map((m) => ({
        id: m.id,
        user_id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
      })),
    };
  }

  // Remove member from group (reassigns user to default Staff role)
  static async removeMember(groupId, userId, context = {}) {
    const parsedGroupId = parseInt(groupId, 10);
    const parsedUserId = parseInt(userId, 10);

    if (!parsedGroupId || isNaN(parsedGroupId) || !parsedUserId || isNaN(parsedUserId)) {
      const err = new Error("Invalid group ID or user ID.");
      err.statusCode = 400;
      throw err;
    }

    const group = await GroupModel.findById(parsedGroupId);
    if (!group) {
      const err = new Error("Group not found.");
      err.statusCode = 404;
      throw err;
    }

    const userRes = await pool.query(`SELECT id, role_id, name FROM users WHERE id = $1`, [parsedUserId]);
    if (userRes.rows.length === 0) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      throw err;
    }

    const user = userRes.rows[0];
    if (user.role_id !== parsedGroupId) {
      const err = new Error("User is not a member of this group.");
      err.statusCode = 400;
      throw err;
    }

    const defaultStaffRoleId = await GroupModel.getDefaultStaffRoleId();
    await GroupModel.removeMember(parsedGroupId, parsedUserId, defaultStaffRoleId);

    await AuditService.log({
      userId: context.userId,
      action: "REMOVE_MEMBER",
      module: "GROUPS",
      entityType: "GROUP",
      entityId: parsedGroupId,
      description: `Removed user '${user.name}' from group '${group.name}'`,
      ipAddress: context.ipAddress,
    });

    return {
      message: `User '${user.name}' successfully removed from group '${group.name}' and reassigned to Staff role.`,
    };
  }

  // Update group permissions
  static async updatePermissions(groupId, payload, context = {}) {
    const parsedGroupId = parseInt(groupId, 10);
    if (!parsedGroupId || isNaN(parsedGroupId)) {
      const err = new Error("Invalid group ID.");
      err.statusCode = 400;
      throw err;
    }

    const group = await GroupModel.findById(parsedGroupId);
    if (!group) {
      const err = new Error("Group not found.");
      err.statusCode = 404;
      throw err;
    }

    const oldPerms = await PermissionModel.getPermissionsByRoleId(parsedGroupId);
    const oldPermissionIds = oldPerms.map((p) => p.id);

    let permissionIdsToAssign = [];

    if (Array.isArray(payload)) {
      permissionIdsToAssign = payload;
    } else if (payload && Array.isArray(payload.permissions)) {
      permissionIdsToAssign = payload.permissions;
    } else if (payload && Array.isArray(payload.permissionIds)) {
      permissionIdsToAssign = payload.permissionIds;
    } else if (payload && Array.isArray(payload.permission_ids)) {
      permissionIdsToAssign = payload.permission_ids;
    }

    const resolvedIds = new Set();

    // Process array of items (which can be numbers or objects like { permissionId: 1, read: true, ... })
    for (const item of permissionIdsToAssign) {
      if (typeof item === "number" || typeof item === "string") {
        const idNum = parseInt(item, 10);
        if (!isNaN(idNum)) resolvedIds.add(idNum);
      } else if (typeof item === "object" && item !== null) {
        if (item.permissionId) {
          const permId = parseInt(item.permissionId, 10);
          if (!isNaN(permId)) {
            const basePerm = await PermissionModel.findById(permId);
            if (basePerm) {
              const moduleName = basePerm.module;

              // Check read/create/update/delete flags
              if (item.read || item.read === undefined) {
                const readPerm = await pool.query(
                  `SELECT id FROM permissions WHERE LOWER(module) = LOWER($1) AND (LOWER(action) = 'view' OR LOWER(action) = 'read')`,
                  [moduleName]
                );
                readPerm.rows.forEach((r) => resolvedIds.add(r.id));
              }
              if (item.create) {
                const createPerm = await pool.query(
                  `SELECT id FROM permissions WHERE LOWER(module) = LOWER($1) AND LOWER(action) = 'create'`,
                  [moduleName]
                );
                createPerm.rows.forEach((r) => resolvedIds.add(r.id));
              }
              if (item.update || item.edit) {
                const updatePerm = await pool.query(
                  `SELECT id FROM permissions WHERE LOWER(module) = LOWER($1) AND (LOWER(action) = 'edit' OR LOWER(action) = 'update')`,
                  [moduleName]
                );
                updatePerm.rows.forEach((r) => resolvedIds.add(r.id));
              }
              if (item.delete) {
                const deletePerm = await pool.query(
                  `SELECT id FROM permissions WHERE LOWER(module) = LOWER($1) AND LOWER(action) = 'delete'`,
                  [moduleName]
                );
                deletePerm.rows.forEach((r) => resolvedIds.add(r.id));
              }

              resolvedIds.add(permId);
            }
          }
        }
      }
    }

    const finalPermissionIds = [...resolvedIds];

    if (finalPermissionIds.length > 0) {
      const foundPerms = await PermissionModel.findByIds(finalPermissionIds);
      if (foundPerms.length !== finalPermissionIds.length) {
        const foundSet = new Set(foundPerms.map((p) => Number(p.id)));
        const missing = finalPermissionIds.filter((id) => !foundSet.has(Number(id)));
        const err = new Error(`One or more invalid permission IDs provided: ${missing.join(", ")}`);
        err.statusCode = 400;
        throw err;
      }
    }

    const updatedPermissions = await PermissionModel.replaceRolePermissions(parsedGroupId, finalPermissionIds);

    await AuditService.log({
      userId: context.userId,
      action: "UPDATE",
      module: "PERMISSIONS",
      entityType: "GROUP",
      entityId: parsedGroupId,
      description: `Updated permissions for group '${group.name}'`,
      oldValues: { permission_ids: oldPermissionIds },
      newValues: { permission_ids: finalPermissionIds },
      ipAddress: context.ipAddress,
    });

    return {
      message: `Permissions updated successfully for group '${group.name}'.`,
      group_id: parsedGroupId,
      permissions: updatedPermissions.map((p) => ({
        id: p.id,
        permission_key: p.permission_key || p.name,
        name: p.permission_key || p.name,
        module: p.module,
        action: p.action,
        description: p.description,
      })),
    };
  }

  // Delete group
  static async deleteGroup(groupId, context = {}) {
    const parsedGroupId = parseInt(groupId, 10);
    if (!parsedGroupId || isNaN(parsedGroupId)) {
      const err = new Error("Invalid group ID.");
      err.statusCode = 400;
      throw err;
    }

    const group = await GroupModel.findById(parsedGroupId);
    if (!group) {
      const err = new Error("Group not found.");
      err.statusCode = 404;
      throw err;
    }

    if (["admin", "staff", "client"].includes(group.name.toLowerCase()) || parsedGroupId <= 3) {
      const err = new Error("Cannot delete system default roles.");
      err.statusCode = 400;
      throw err;
    }

    const memberCount = parseInt(group.member_count, 10);
    if (memberCount > 0) {
      const err = new Error(`Cannot delete group '${group.name}' because it still has ${memberCount} assigned member(s). Please remove or reassign all members before deleting.`);
      err.statusCode = 400;
      throw err;
    }

    await GroupModel.deleteGroup(parsedGroupId);

    await AuditService.log({
      userId: context.userId,
      action: "DELETE",
      module: "GROUPS",
      entityType: "GROUP",
      entityId: parsedGroupId,
      description: `Deleted group: ${group.name}`,
      ipAddress: context.ipAddress,
    });

    return {
      message: `Group '${group.name}' deleted successfully.`,
    };
  }
}

module.exports = GroupService;
