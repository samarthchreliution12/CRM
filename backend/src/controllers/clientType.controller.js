const ClientTypeService = require("../services/clientType.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class ClientTypeController {
  static async listClientTypes(req, res) {
    try {
      const clientTypes = await ClientTypeService.listClientTypes();
      return sendSuccess(res, 200, "Client types retrieved successfully", { client_types: clientTypes });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getClientType(req, res) {
    try {
      const { id } = req.params;
      const clientType = await ClientTypeService.getClientTypeById(id);
      return sendSuccess(res, 200, "Client type retrieved successfully", { client_type: clientType });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = ClientTypeController;
