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

    let systemRoles = sysResult.data.roles || [];
    systemRoles = systemRoles.filter((r) => ["Admin", "Staff", "Client"].includes(r.name));

    try {
      const groupsResult = await apiFetch("/roles/groups", {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const customGroups = groupsResult.data?.groups || [];

      const allRoles = [...systemRoles, ...customGroups];
      return {
        ...sysResult,
        data: {
          roles: allRoles,
        },
      };
    } catch (e) {
      return {
        ...sysResult,
        data: {
          roles: systemRoles,
        },
      };
    }
  }

  /**
   * Fetch all system permissions from database.
   * GET /api/admin/permissions?limit=100
   */
  static async getAllPermissions(token = null) {
    return apiFetch("/admin/permissions?limit=100", {
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
