const bcrypt = require("bcryptjs");
const UserModel = require("../models/user.model");
const RoleModel = require("../models/role.model");

class AdminStaffService {
  /**
   * List all Staff users with optional search, status filtering, and pagination.
   */
  static async listStaff({ search, status, page, limit }) {
    return UserModel.findAllStaff({ search, status, page, limit });
  }

  /**
   * Fetch single Staff user by ID.
   */
  static async getStaffById(id) {
    const staff = await UserModel.findStaffById(id);
    if (!staff) {
      const error = new Error("Staff user not found");
      error.statusCode = 404;
      throw error;
    }
    return staff;
  }

  /**
   * Create a new Staff user account.
   */
  static async createStaff({ name, email, mobile, password, role_id, roleId }) {
    const trimmedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existingUser = await UserModel.findByEmail(trimmedEmail);
    if (existingUser) {
      const error = new Error("Email is already registered.");
      error.statusCode = 409;
      error.errors = [{ field: "email", message: "Email is already registered." }];
      throw error;
    }

    // Lookup Staff role dynamically from roles table if role_id not specified
    const staffRole = await RoleModel.findByName("Staff");
    const targetRoleId = role_id || roleId || (staffRole ? staffRole.id : 2);

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    const cleanMobile = mobile ? mobile.trim().replace(/[\s\-()]/g, "") : null;

    const newUser = await UserModel.createUser({
      name: name.trim(),
      email: trimmedEmail,
      password_hash,
      mobile: cleanMobile,
      role_id: Number(targetRoleId),
      status: "active",
    });

    const createdStaff = await UserModel.findStaffById(newUser.id);
    return createdStaff;
  }

  /**
   * Update Staff user profile fields.
   */
  static async updateStaff(id, { name, email, mobile, role_id, roleId }) {
    const targetStaff = await UserModel.findStaffById(id);
    if (!targetStaff) {
      const error = new Error("Staff user not found");
      error.statusCode = 404;
      throw error;
    }

    // Email uniqueness check if email is modified
    if (email && email.trim().toLowerCase() !== targetStaff.email.toLowerCase()) {
      const trimmedEmail = email.trim().toLowerCase();
      const existingUser = await UserModel.findByEmail(trimmedEmail);
      if (existingUser && Number(existingUser.id) !== Number(id)) {
        const error = new Error("Email is already registered.");
        error.statusCode = 409;
        error.errors = [{ field: "email", message: "Email is already registered." }];
        throw error;
      }
    }

    const cleanMobile = mobile !== undefined ? (mobile ? mobile.trim().replace(/[\s\-()]/g, "") : null) : undefined;
    const targetRoleId = role_id !== undefined ? role_id : roleId;

    await UserModel.updateProfile(id, {
      name: name ? name.trim() : undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      mobile: cleanMobile,
      role_id: targetRoleId,
    });

    const updatedStaff = await UserModel.findStaffById(id);
    return updatedStaff;
  }

  /**
   * Update Staff user status (active / inactive).
   */
  static async updateStaffStatus(id, status) {
    const targetStaff = await UserModel.findStaffById(id);
    if (!targetStaff) {
      const error = new Error("Staff user not found");
      error.statusCode = 404;
      throw error;
    }

    const cleanStatus = status.trim().toLowerCase();
    const updatedStaff = await UserModel.updateStaffStatus(id, cleanStatus);
    return updatedStaff;
  }

  /**
   * Delete Staff user account.
   */
  static async deleteStaff(id, adminUserId) {
    const targetStaff = await UserModel.findStaffById(id);
    if (!targetStaff) {
      const error = new Error("Staff user not found");
      error.statusCode = 404;
      throw error;
    }

    if (Number(id) === Number(adminUserId)) {
      const error = new Error("Admin cannot delete their own account through Staff Management");
      error.statusCode = 400;
      throw error;
    }

    await UserModel.deleteStaff(id);
    return { message: "Staff user deleted successfully" };
  }
}

module.exports = AdminStaffService;
