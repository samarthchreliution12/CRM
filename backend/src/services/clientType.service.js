const ClientTypeModel = require("../models/clientType.model");

class ClientTypeService {
  static async listClientTypes() {
    return ClientTypeModel.findAll();
  }

  static async getClientTypeById(id) {
    const clientType = await ClientTypeModel.findById(id);
    if (!clientType) {
      const error = new Error("Client type not found");
      error.statusCode = 404;
      throw error;
    }
    return clientType;
  }
}

module.exports = ClientTypeService;
