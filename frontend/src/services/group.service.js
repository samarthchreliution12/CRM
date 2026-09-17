import apiFetch from "./apiClient";

class GroupService {
  // GET /api/roles/groups - Get all custom groups
  static async getGroups(token = null) {
    return apiFetch("/roles/groups", {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // POST /api/roles/groups - Create custom group
  static async createGroup({ name, description }, token = null) {
    return apiFetch("/roles/groups", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ name, description }),
    });
  }

  // GET /api/roles/groups/:id - Get single group
  static async getGroupById(groupId, token = null) {
    return apiFetch(`/roles/groups/${groupId}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // PUT /api/roles/groups/:id - Update group details
  static async updateGroup(groupId, { name, description }, token = null) {
    return apiFetch(`/roles/groups/${groupId}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ name, description }),
    });
  }

  // DELETE /api/roles/groups/:id - Delete custom group
  static async deleteGroup(groupId, token = null) {
    return apiFetch(`/roles/groups/${groupId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // POST /api/roles/groups/:id/members - Add user to group
  static async addMember(groupId, userId, token = null) {
    return apiFetch(`/roles/groups/${groupId}/members`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ user_id: Number(userId) }),
    });
  }

  // DELETE /api/roles/groups/:id/members/:userId - Remove user from group
  static async removeMember(groupId, userId, token = null) {
    return apiFetch(`/roles/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

export default GroupService;
