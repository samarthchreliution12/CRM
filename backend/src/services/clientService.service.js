const ClientServiceModel = require("../models/clientService.model");

class ClientServiceService {
  static async listClientServices(query = {}) {
    return ClientServiceModel.findAll(query);
  }

  static async getClientServiceById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid client service ID");
      error.statusCode = 400;
      throw error;
    }

    const clientService = await ClientServiceModel.findById(numericId);
    if (!clientService) {
      const error = new Error("Client service not found");
      error.statusCode = 404;
      throw error;
    }

    return clientService;
  }

  static async createClientService({ name, description, status = "active" }) {
    if (!name || !name.trim()) {
      const error = new Error("Client service name is required");
      error.statusCode = 400;
      throw error;
    }

    if (name.trim().length < 2) {
      const error = new Error("Client service name must be at least 2 characters");
      error.statusCode = 400;
      throw error;
    }

    if (status && !["active", "inactive"].includes(status.trim().toLowerCase())) {
      const error = new Error("Status must be either active or inactive");
      error.statusCode = 400;
      throw error;
    }

    const existing = await ClientServiceModel.findByName(name.trim());
    if (existing) {
      const error = new Error("Client service name already exists");
      error.statusCode = 409;
      throw error;
    }

    return ClientServiceModel.create({
      name: name.trim(),
      description,
      status: status ? status.trim().toLowerCase() : "active",
    });
  }

  static async updateClientService(id, { name, description, status }) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid client service ID");
      error.statusCode = 400;
      throw error;
    }

    const existingService = await ClientServiceModel.findById(numericId);
    if (!existingService) {
      const error = new Error("Client service not found");
      error.statusCode = 404;
      throw error;
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        const error = new Error("Client service name cannot be empty");
        error.statusCode = 400;
        throw error;
      }
      if (name.trim().length < 2) {
        const error = new Error("Client service name must be at least 2 characters");
        error.statusCode = 400;
        throw error;
      }

      const duplicate = await ClientServiceModel.findByName(name.trim());
      if (duplicate && duplicate.id !== numericId) {
        const error = new Error("Client service name already exists");
        error.statusCode = 409;
        throw error;
      }
    }

    if (status !== undefined && !["active", "inactive"].includes(status.trim().toLowerCase())) {
      const error = new Error("Status must be either active or inactive");
      error.statusCode = 400;
      throw error;
    }

    return ClientServiceModel.update(numericId, { name, description, status });
  }

  static async deleteClientService(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error("Invalid client service ID");
      error.statusCode = 400;
      throw error;
    }

    const existingService = await ClientServiceModel.findById(numericId);
    if (!existingService) {
      const error = new Error("Client service not found");
      error.statusCode = 404;
      throw error;
    }

    const assignedCount = await ClientServiceModel.countAssignments(numericId);
    if (assignedCount > 0) {
      const error = new Error("Client service cannot be deleted because it is currently assigned to clients.");
      error.statusCode = 409;
      throw error;
    }

    return ClientServiceModel.delete(numericId);
  }
}

module.exports = ClientServiceService;
