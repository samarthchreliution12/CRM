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

  // GET /api/roles/groups/:id - Alias for group details
  static async getGroupDetails(groupId, token = null) {
    return this.getGroupById(groupId, token);
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

  // POST /api/roles/groups/:id/members - Add single user to group
  static async addMember(groupId, userId, token = null) {
    return apiFetch(`/roles/groups/${groupId}/members`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ user_id: Number(userId) }),
    });
  }

  // POST /api/roles/groups/:id/members - Add multiple users to group
  static async addMembers(groupId, userIds, token = null) {
    const ids = Array.isArray(userIds) ? userIds.map(Number) : [Number(userIds)];
    return apiFetch(`/roles/groups/${groupId}/members`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ user_ids: ids, userIds: ids }),
    });
  }

  // DELETE /api/roles/groups/:id/members/:userId - Remove user from group
  static async removeMember(groupId, userId, token = null) {
    return apiFetch(`/roles/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // PUT /api/roles/groups/:id/permissions - Update group permissions
  static async updatePermissions(groupId, permissionIds, token = null) {
    const ids = Array.isArray(permissionIds) ? permissionIds.map(Number) : [];
    return apiFetch(`/roles/groups/${groupId}/permissions`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ permission_ids: ids, permissionIds: ids }),
    });
  }

  // PUT /api/roles/groups/:id/permissions - Alias for updateGroupPermissions
  static async updateGroupPermissions(groupId, permissionIds, token = null) {
    return this.updatePermissions(groupId, permissionIds, token);
  }
}

export default GroupService;

