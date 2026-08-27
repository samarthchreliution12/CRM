const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

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

class GroupService {
  // GET /api/roles/groups - Get all custom groups
  static async getGroups(token) {
    const response = await fetch(`${API_BASE_URL}/roles/groups`, {
      method: "GET",
      headers: getHeaders(token),
    });
    return handleResponse(response);
  }

  // POST /api/roles/groups - Create custom group
  static async createGroup({ name, description }, token) {
    const response = await fetch(`${API_BASE_URL}/roles/groups`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ name, description }),
    });
    return handleResponse(response);
  }

  // GET /api/roles/groups/:id - Get group details (info, permissions, members)
  static async getGroupDetails(id, token) {
    const response = await fetch(`${API_BASE_URL}/roles/groups/${id}`, {
      method: "GET",
      headers: getHeaders(token),
    });
    return handleResponse(response);
  }

  // POST /api/roles/groups/:id/members - Add staff members to group
  static async addMembers(id, userIds, token) {
    const response = await fetch(`${API_BASE_URL}/roles/groups/${id}/members`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify({ userIds }),
    });
    return handleResponse(response);
  }

  // DELETE /api/roles/groups/:id/members/:userId - Remove member from group
  static async removeMember(id, userId, token) {
    const response = await fetch(`${API_BASE_URL}/roles/groups/${id}/members/${userId}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    return handleResponse(response);
  }

  // PUT /api/roles/groups/:id/permissions - Update group permissions
  static async updatePermissions(id, permissions, token) {
    const response = await fetch(`${API_BASE_URL}/roles/groups/${id}/permissions`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(Array.isArray(permissions) ? { permissions } : permissions),
    });
    return handleResponse(response);
  }

  // DELETE /api/roles/groups/:id - Delete group
  static async deleteGroup(id, token) {
    const response = await fetch(`${API_BASE_URL}/roles/groups/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    return handleResponse(response);
  }
}

export default GroupService;
