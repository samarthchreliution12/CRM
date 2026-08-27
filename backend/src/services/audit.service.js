const AuditModel = require("../models/audit.model");

class AuditService {
  /**
   * Recursively sanitize object to remove sensitive keys before storing in audit logs.
   */
  static sanitize(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sanitize(item));

    const sensitiveKeys = [
      "password",
      "password_hash",
      "passwordhash",
      "token",
      "jwt",
      "secret",
      "encryption_key",
      "encryption_key_id",
      "iv",
      "auth_tag",
      "storage_path",
      "pan",
    ];

    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        continue;
      }
      if (val !== null && typeof val === "object") {
        clean[key] = this.sanitize(val);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  }

  /**
   * Calculate field-level differences between old and new state objects for UPDATE operations.
   * Returns only fields that have actually changed.
   */
  static calculateDiff(oldObj = {}, newObj = {}) {
    const cleanOld = this.sanitize(oldObj) || {};
    const cleanNew = this.sanitize(newObj) || {};

    const oldDiff = {};
    const newDiff = {};

    const allKeys = new Set([...Object.keys(cleanOld), ...Object.keys(cleanNew)]);

    for (const key of allKeys) {
      if (["updated_at", "created_at"].includes(key)) continue;

      const oldVal = cleanOld[key];
      const newVal = cleanNew[key];

      const oldStr = oldVal !== undefined ? JSON.stringify(oldVal) : undefined;
      const newStr = newVal !== undefined ? JSON.stringify(newVal) : undefined;

      if (oldStr !== newStr) {
        if (oldVal !== undefined) oldDiff[key] = oldVal;
        if (newVal !== undefined) newDiff[key] = newVal;
      }
    }

    return {
      oldValues: Object.keys(oldDiff).length > 0 ? oldDiff : null,
      newValues: Object.keys(newDiff).length > 0 ? newDiff : null,
    };
  }

  /**
   * Centralized method to log user and system actions automatically.
   */
  static async log(
    {
      userId,
      action,
      module,
      entityType,
      entityId,
      description,
      oldValues,
      newValues,
      ipAddress,
    },
    dbClient = null
  ) {
    try {
      const cleanOld = this.sanitize(oldValues);
      const cleanNew = this.sanitize(newValues);

      return await AuditModel.create(
        {
          user_id: userId,
          action,
          module,
          entity_type: entityType,
          entity_id: entityId,
          description,
          old_values: cleanOld,
          new_values: cleanNew,
          ip_address: ipAddress,
        },
        dbClient
      );
    } catch (err) {
      console.error("Centralized Audit Log Warning:", err.message);
      return null;
    }
  }

  /**
   * Retrieve paginated audit logs for system administrators.
   */
  static async listAuditLogs(query) {
    return AuditModel.findAll(query);
  }
}

module.exports = AuditService;
