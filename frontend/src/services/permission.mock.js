// Initial Mock Dataset matching existing project permission conventions
const INITIAL_PERMISSIONS = [
  { id: 1, permission_key: "client.view", description: "View client records", module: "Client", created_at: "2026-08-20T10:00:00Z" },
  { id: 2, permission_key: "client.create", description: "Create new client records", module: "Client", created_at: "2026-08-20T10:00:00Z" },
  { id: 3, permission_key: "client.edit", description: "Edit client records", module: "Client", created_at: "2026-08-20T10:00:00Z" },
  { id: 4, permission_key: "client.delete", description: "Delete client records", module: "Client", created_at: "2026-08-20T10:00:00Z" },
  { id: 5, permission_key: "lead.view", description: "View lead records", module: "Lead", created_at: "2026-08-20T10:00:00Z" },
  { id: 6, permission_key: "lead.create", description: "Create new lead records", module: "Lead", created_at: "2026-08-20T10:00:00Z" },
  { id: 7, permission_key: "lead.edit", description: "Edit lead records", module: "Lead", created_at: "2026-08-20T10:00:00Z" },
  { id: 8, permission_key: "lead.assign", description: "Assign leads to staff members", module: "Lead", created_at: "2026-08-20T10:00:00Z" },
  { id: 9, permission_key: "document.view", description: "View document repository", module: "Document", created_at: "2026-08-20T10:00:00Z" },
  { id: 10, permission_key: "communication.view", description: "View communication history", module: "Communication", created_at: "2026-08-20T10:00:00Z" },
];

let localPermissions = [...INITIAL_PERMISSIONS];
let nextId = 13;

class PermissionMockService {
  /**
   * Fetch permissions with search, module filtering, and pagination.
   */
  static async getPermissions({ search = "", module = "", page = 1, limit = 10 }) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    let filtered = [...localPermissions];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.permission_key.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.module.toLowerCase().includes(q)
      );
    }

    if (module && module !== "all") {
      filtered = filtered.filter((p) => p.module.toLowerCase() === module.trim().toLowerCase());
    }

    const total = filtered.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      success: true,
      data: {
        permissions: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      },
    };
  }

  /**
   * Create a new permission in local mock state.
   */
  static async createPermission({ permission_key, description, module }) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const keyLower = permission_key.trim().toLowerCase();
    const duplicate = localPermissions.find((p) => p.permission_key.toLowerCase() === keyLower);
    if (duplicate) {
      const error = new Error(`Permission name '${permission_key}' already exists.`);
      error.statusCode = 409;
      error.errors = [{ field: "permission_key", message: "Permission name already exists." }];
      throw error;
    }

    const newPerm = {
      id: nextId++,
      permission_key: keyLower,
      description: description.trim(),
      module: module.trim(),
      created_at: new Date().toISOString(),
    };

    localPermissions.unshift(newPerm);

    return {
      success: true,
      data: { permission: newPerm },
    };
  }

  /**
   * Update an existing permission in local mock state.
   */
  static async updatePermission(id, { permission_key, description, module }) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const index = localPermissions.findIndex((p) => Number(p.id) === Number(id));
    if (index === -1) {
      const error = new Error("Permission not found.");
      error.statusCode = 404;
      throw error;
    }

    const keyLower = permission_key.trim().toLowerCase();
    const duplicate = localPermissions.find((p) => Number(p.id) !== Number(id) && p.permission_key.toLowerCase() === keyLower);
    if (duplicate) {
      const error = new Error(`Permission name '${permission_key}' already exists.`);
      error.statusCode = 409;
      error.errors = [{ field: "permission_key", message: "Permission name already exists." }];
      throw error;
    }

    localPermissions[index] = {
      ...localPermissions[index],
      permission_key: keyLower,
      description: description.trim(),
      module: module.trim(),
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: { permission: localPermissions[index] },
    };
  }

  /**
   * Delete a permission from local mock state.
   */
  static async deletePermission(id) {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const index = localPermissions.findIndex((p) => Number(p.id) === Number(id));
    if (index === -1) {
      const error = new Error("Permission not found.");
      error.statusCode = 404;
      throw error;
    }

    localPermissions.splice(index, 1);

    return {
      success: true,
      message: "Permission deleted successfully",
    };
  }
}

export default PermissionMockService;
