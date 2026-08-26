const ClientTypeService = require("../services/clientType.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class ClientTypeController {
  static async listClientTypes(req, res) {
    try {
      const result = await ClientTypeService.listClientTypes(req.query);
      if (result && result.client_types) {
        return sendSuccess(res, 200, "Client types retrieved successfully", {
          client_types: result.client_types,
          pagination: result.pagination,
        });
      }
      return sendSuccess(res, 200, "Client types retrieved successfully", { client_types: result });
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

  static async createClientType(req, res) {
    try {
      const clientType = await ClientTypeService.createClientType(req.body);
      return sendSuccess(res, 201, "Client type created successfully", { client_type: clientType });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async updateClientType(req, res) {
    try {
      const { id } = req.params;
      const clientType = await ClientTypeService.updateClientType(id, req.body);
      return sendSuccess(res, 200, "Client type updated successfully", { client_type: clientType });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async deleteClientType(req, res) {
    try {
      const { id } = req.params;
      await ClientTypeService.deleteClientType(id);
      return sendSuccess(res, 200, "Client type deleted successfully");
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = ClientTypeController;
