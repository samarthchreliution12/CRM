const RoleModel = require("../models/role.model");
const PermissionModel = require("../models/permission.model");
const AuditService = require("./audit.service");

class RolePermissionService {
  static async getRoles() {
    const roles = await RoleModel.findAll();
    return {
      roles,
    };
  }

  static async getRolePermissions(roleId) {
    const role = await RoleModel.findById(roleId);
    if (!role) {
      const error = new Error("Role not found");
      error.statusCode = 404;
      throw error;
    }

    const permissions = await PermissionModel.getPermissionsByRoleId(roleId);
    return {
      role_id: role.id,
      role: role.name,
      permissions: permissions.map((p) => p.permission_key || p.name),
      permission_details: permissions,
    };
  }

  static async replaceRolePermissions(roleId, permissionIds, context = {}) {
    const role = await RoleModel.findById(roleId);
    if (!role) {
      const error = new Error("Role not found");
      error.statusCode = 404;
      throw error;
    }

    const oldPerms = await PermissionModel.getPermissionsByRoleId(roleId);
    const oldPermissionIds = oldPerms.map((p) => p.id);

    // Verify all permission IDs exist
    if (permissionIds && permissionIds.length > 0) {
      const uniqueIds = [...new Set(permissionIds)];
      const foundPerms = await PermissionModel.findByIds(uniqueIds);
      if (foundPerms.length !== uniqueIds.length) {
        const foundSet = new Set(foundPerms.map((p) => Number(p.id)));
        const missing = uniqueIds.filter((id) => !foundSet.has(Number(id)));
        const error = new Error(`One or more invalid permission IDs provided: ${missing.join(", ")}`);
        error.statusCode = 400;
        error.errors = [{ field: "permission_ids", message: "Contains invalid permission IDs" }];
        throw error;
      }
    }

    // Execute transactional replacement
    const updatedPermissions = await PermissionModel.replaceRolePermissions(roleId, permissionIds);

    await AuditService.log({
      userId: context.userId,
      action: "UPDATE",
      module: "PERMISSIONS",
      entityType: "ROLE",
      entityId: role.id,
      description: `Updated permissions for role '${role.name}'`,
      oldValues: { permission_ids: oldPermissionIds },
      newValues: { permission_ids: permissionIds },
      ipAddress: context.ipAddress,
    });

    return {
      role_id: role.id,
      role: role.name,
      permissions: updatedPermissions.map((p) => p.permission_key || p.name),
      permission_details: updatedPermissions,
    };
  }
}

module.exports = RolePermissionService;
