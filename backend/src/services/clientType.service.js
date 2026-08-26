const ClientTypeModel = require("../models/clientType.model");

class ClientTypeService {
  static async listClientTypes(query = {}) {
    return ClientTypeModel.findAll(query);
  }

  static async getClientTypeById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid client type ID");
      error.statusCode = 400;
      throw error;
    }

    const clientType = await ClientTypeModel.findById(numericId);
    if (!clientType) {
      const error = new Error("Client type not found");
      error.statusCode = 404;
      throw error;
    }

    return clientType;
  }

  static async createClientType({ name, description, status = "active" }) {
    if (!name || !name.trim()) {
      const error = new Error("Client type name is required");
      error.statusCode = 400;
      throw error;
    }

    if (name.trim().length < 2) {
      const error = new Error("Client type name must be at least 2 characters");
      error.statusCode = 400;
      throw error;
    }

    if (status && !["active", "inactive"].includes(status.trim().toLowerCase())) {
      const error = new Error("Status must be either active or inactive");
      error.statusCode = 400;
      throw error;
    }

    const existing = await ClientTypeModel.findByName(name.trim());
    if (existing) {
      const error = new Error("Client type name already exists");
      error.statusCode = 409;
      throw error;
    }

    return ClientTypeModel.create({
      name: name.trim(),
      description,
      status: status ? status.trim().toLowerCase() : "active",
    });
  }

  static async updateClientType(id, { name, description, status }) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid client type ID");
      error.statusCode = 400;
      throw error;
    }

    const existingType = await ClientTypeModel.findById(numericId);
    if (!existingType) {
      const error = new Error("Client type not found");
      error.statusCode = 404;
      throw error;
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        const error = new Error("Client type name cannot be empty");
        error.statusCode = 400;
        throw error;
      }
      if (name.trim().length < 2) {
        const error = new Error("Client type name must be at least 2 characters");
        error.statusCode = 400;
        throw error;
      }

      const duplicate = await ClientTypeModel.findByName(name.trim());
      if (duplicate && duplicate.id !== numericId) {
        const error = new Error("Client type name already exists");
        error.statusCode = 409;
        throw error;
      }
    }

    if (status !== undefined && !["active", "inactive"].includes(status.trim().toLowerCase())) {
      const error = new Error("Status must be either active or inactive");
      error.statusCode = 400;
      throw error;
    }

    return ClientTypeModel.update(numericId, { name, description, status });
  }

  static async deleteClientType(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid client type ID");
      error.statusCode = 400;
      throw error;
    }

    const existingType = await ClientTypeModel.findById(numericId);
    if (!existingType) {
      const error = new Error("Client type not found");
      error.statusCode = 404;
      throw error;
    }

    const assignedCount = await ClientTypeModel.countAssignedClients(numericId);
    if (assignedCount > 0) {
      const error = new Error("Client type cannot be deleted because it is currently assigned to clients.");
      error.statusCode = 409;
      throw error;
    }

    return ClientTypeModel.delete(numericId);
  }
}

module.exports = ClientTypeService;
