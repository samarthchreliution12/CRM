const PermissionModel = require("../models/permission.model");

class PermissionService {
  static async listPermissions({ search, module, page, limit }) {
    return PermissionModel.findAll({ search, module, page, limit });
  }

  static async getPermissionById(id) {
    const permission = await PermissionModel.findById(id);
    if (!permission) {
      const error = new Error("Permission not found");
      error.statusCode = 404;
      throw error;
    }
    return permission;
  }

  static async createPermission({ name, module, action, description }) {
    const permKey = name.trim().toLowerCase();
    const modClean = module.trim().toLowerCase();
    const actClean = action.trim().toLowerCase();

    // Check duplicate by name
    const existingKey = await PermissionModel.findByKey(permKey);
    if (existingKey) {
      const error = new Error(`Permission name '${permKey}' already exists`);
      error.statusCode = 409;
      error.errors = [{ field: "name", message: "Permission name already exists" }];
      throw error;
    }

    // Check duplicate by module + action
    const existingModAct = await PermissionModel.findByModuleAndAction(modClean, actClean);
    if (existingModAct) {
      const error = new Error(`Permission for module '${modClean}' and action '${actClean}' already exists`);
      error.statusCode = 409;
      error.errors = [{ field: "module_action", message: "Permission with this module and action already exists" }];
      throw error;
    }

    return PermissionModel.create({ name: permKey, module: modClean, action: actClean, description });
  }

  static async updatePermission(id, data) {
    const existing = await PermissionModel.findById(id);
    if (!existing) {
      const error = new Error("Permission not found");
      error.statusCode = 404;
      throw error;
    }

    const name = data.name || data.permission_key || existing.permission_key;
    const module = data.module || existing.module;
    const action = data.action || existing.action;
    const description = data.description !== undefined ? data.description : existing.description;

    const permKey = name.trim().toLowerCase();
    const modClean = module.trim().toLowerCase();
    const actClean = action.trim().toLowerCase();

    // Check duplicate key excluding self
    const byKey = await PermissionModel.findByKey(permKey);
    if (byKey && Number(byKey.id) !== Number(id)) {
      const error = new Error(`Permission name '${permKey}' already exists`);
      error.statusCode = 409;
      error.errors = [{ field: "name", message: "Permission name already exists" }];
      throw error;
    }

    // Check duplicate module + action excluding self
    const byModAct = await PermissionModel.findByModuleAndAction(modClean, actClean);
    if (byModAct && Number(byModAct.id) !== Number(id)) {
      const error = new Error(`Permission for module '${modClean}' and action '${actClean}' already exists`);
      error.statusCode = 409;
      error.errors = [{ field: "module_action", message: "Permission with this module and action already exists" }];
      throw error;
    }

    return PermissionModel.update(id, { name: permKey, module: modClean, action: actClean, description });
  }

  static async deletePermission(id) {
    const existing = await PermissionModel.findById(id);
    if (!existing) {
      const error = new Error("Permission not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if permission is assigned to any role in role_permissions
    const assignedCount = await PermissionModel.countRoleAssignments(id);
    if (assignedCount > 0) {
      const error = new Error(`Cannot delete permission '${existing.permission_key}' because it is assigned to ${assignedCount} role(s)`);
      error.statusCode = 409;
      error.errors = [{ field: "id", message: "Permission is currently assigned to active roles" }];
      throw error;
    }

    await PermissionModel.delete(id);
    return true;
  }
}

module.exports = PermissionService;
