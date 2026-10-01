import apiFetch from "./apiClient";

class PermissionService {
  /**
   * Fetch all active system roles and custom groups.
   * GET /api/admin/roles and GET /api/roles/groups
   */
  static async getRoles(token = null) {
    const sysResult = await apiFetch("/admin/roles", {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const roles = sysResult.data?.roles || [];
    return {
      ...sysResult,
      data: {
        roles,
      },
    };
  }

  /**
   * Fetch all system permissions from database.
   * GET /api/admin/permissions?limit=100
   */
  static async getAllPermissions(token = null) {
    return apiFetch("/admin/permissions?limit=500", {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * Fetch assigned permissions for a specific role.
   * GET /api/admin/roles/:roleId/permissions
   */
  static async getRolePermissions(roleId, token = null) {
    return apiFetch(`/admin/roles/${roleId}/permissions`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * Transactionally replace permission mapping for a specific role.
   * PUT /api/admin/roles/:roleId/permissions
   */
  static async updateRolePermissions(roleId, permissionIds, token = null) {
    return apiFetch(`/admin/roles/${roleId}/permissions`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  }
}

export default PermissionService;
