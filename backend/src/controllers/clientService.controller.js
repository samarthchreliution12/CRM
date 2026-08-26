const ClientServiceService = require("../services/clientService.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class ClientServiceController {
  static async listClientServices(req, res) {
    try {
      const result = await ClientServiceService.listClientServices(req.query);
      if (result && result.client_services) {
        return sendSuccess(res, 200, "Client services retrieved successfully", {
          client_services: result.client_services,
          pagination: result.pagination,
        });
      }
      return sendSuccess(res, 200, "Client services retrieved successfully", { client_services: result });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getClientService(req, res) {
    try {
      const { id } = req.params;
      const clientService = await ClientServiceService.getClientServiceById(id);
      return sendSuccess(res, 200, "Client service retrieved successfully", { client_service: clientService });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async createClientService(req, res) {
    try {
      const clientService = await ClientServiceService.createClientService(req.body);
      return sendSuccess(res, 201, "Client service created successfully", { client_service: clientService });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async updateClientService(req, res) {
    try {
      const { id } = req.params;
      const clientService = await ClientServiceService.updateClientService(id, req.body);
      return sendSuccess(res, 200, "Client service updated successfully", { client_service: clientService });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async deleteClientService(req, res) {
    try {
      const { id } = req.params;
      await ClientServiceService.deleteClientService(id);
      return sendSuccess(res, 200, "Client service deleted successfully");
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = ClientServiceController;
