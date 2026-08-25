const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getHeaders = (token) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "API request failed");
    error.statusCode = response.status;
    error.errors = data.errors;
    throw error;
  }
  return data;
};

class PermissionService {
  /**
   * Fetch all active system roles.
   * GET /api/admin/roles
   */
  static async getRoles(token) {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: "GET",
      headers: getHeaders(token),
    });
    const result = await handleResponse(response);

    const allowedRoles = ["Client", "Staff"];

    result.data.roles = result.data.roles.filter((role) =>
      allowedRoles.includes(role.name)
    );

    return result;
  }

  /**
   * Fetch all system permissions from database.
   * GET /api/admin/permissions?limit=100
   */
  static async getAllPermissions(token) {
    const response = await fetch(`${API_BASE_URL}/admin/permissions?limit=100`, {
      method: "GET",
      headers: getHeaders(token),
    });
    return handleResponse(response);
  }

  /**
   * Fetch assigned permissions for a specific role.
   * GET /api/admin/roles/:roleId/permissions
   */
  static async getRolePermissions(roleId, token) {
    const response = await fetch(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, {
      method: "GET",
      headers: getHeaders(token),
    });
    return handleResponse(response);
  }

  /**
   * Transactionally replace permission mapping for a specific role.
   * PUT /api/admin/roles/:roleId/permissions
   * Body: { permission_ids: [1, 2, 3] }
   */
  static async updateRolePermissions(roleId, permissionIds, token) {
    const response = await fetch(`${API_BASE_URL}/admin/roles/${roleId}/permissions`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
    return handleResponse(response);
  }
}

export default PermissionService;
