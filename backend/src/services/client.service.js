const ClientModel = require("../models/client.model");
const ClientTypeModel = require("../models/clientType.model");

class ClientService {
  static async listClients(query) {
    return ClientModel.findAll(query);
  }

  static async getClientById(id) {
    const client = await ClientModel.findById(id);
    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }
    return client;
  }

  static async createClient(data) {
    // 1. Check duplicate UCC
    const existingUcc = await ClientModel.findByUcc(data.ucc_no);
    if (existingUcc) {
      const error = new Error("This UCC number is already in use.");
      error.statusCode = 409;
      error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
      throw error;
    }

    // 2. Check client_type_id exists
    const clientType = await ClientTypeModel.findById(data.client_type_id);
    if (!clientType) {
      const error = new Error(`Invalid client_type_id: Client type ID ${data.client_type_id} does not exist`);
      error.statusCode = 400;
      error.errors = [{ field: "client_type_id", message: "Invalid client_type_id" }];
      throw error;
    }

    try {
      return await ClientModel.create(data);
    } catch (err) {
      if (err.code === "23505" || (err.message && err.message.includes("clients_ucc_no_key"))) {
        const error = new Error("This UCC number is already in use.");
        error.statusCode = 409;
        error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
        throw error;
      }
      throw err;
    }
  }

  static async updateClient(id, data) {
    const existing = await ClientModel.findById(id);
    if (!existing) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    // Check duplicate UCC if provided
    if (data.ucc_no && data.ucc_no.trim().toLowerCase() !== existing.ucc_no.toLowerCase()) {
      const duplicateUcc = await ClientModel.findByUcc(data.ucc_no);
      if (duplicateUcc) {
        const error = new Error("This UCC number is already in use.");
        error.statusCode = 409;
        error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
        throw error;
      }
    }

    // Check client_type_id if provided
    if (data.client_type_id) {
      const clientType = await ClientTypeModel.findById(data.client_type_id);
      if (!clientType) {
        const error = new Error(`Invalid client_type_id: Client type ID ${data.client_type_id} does not exist`);
        error.statusCode = 400;
        error.errors = [{ field: "client_type_id", message: "Invalid client_type_id" }];
        throw error;
      }
    }

    try {
      return await ClientModel.update(id, data);
    } catch (err) {
      if (err.code === "23505" || (err.message && err.message.includes("clients_ucc_no_key"))) {
        const error = new Error("This UCC number is already in use.");
        error.statusCode = 409;
        error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
        throw error;
      }
      throw err;
    }
  }

  static async updateClientStatus(id, status) {
    const existing = await ClientModel.findById(id);
    if (!existing) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    return ClientModel.updateStatus(id, status);
  }

  static async deleteClient(id) {
    const existing = await ClientModel.findById(id);
    if (!existing) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    await ClientModel.delete(id);
    return true;
  }
}

module.exports = ClientService;
