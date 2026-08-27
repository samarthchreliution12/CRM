const ClientService = require("../services/client.service");
const { validateCreateClientInput, validateUpdateClientInput, validateStatusInput } = require("../validators/client.validator");
const { sendSuccess, sendError } = require("../utils/response.util");

class ClientController {
  static async listClients(req, res) {
    try {
      const { search, status, client_type_id, page, limit } = req.query;
      const result = await ClientService.listClients({
        search,
        status,
        client_type_id,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
      });

      return sendSuccess(res, 200, "Clients retrieved successfully", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getClient(req, res) {
    try {
      const { id } = req.params;
      const client = await ClientService.getClientById(id);
      return sendSuccess(res, 200, "Client retrieved successfully", { client });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async createClient(req, res) {
    try {
      const validation = validateCreateClientInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const client = await ClientService.createClient(req.body, context);
      return sendSuccess(res, 201, "Client created successfully", { client });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async updateClient(req, res) {
    try {
      const { id } = req.params;
      const validation = validateUpdateClientInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const client = await ClientService.updateClient(id, req.body, context);
      return sendSuccess(res, 200, "Client updated successfully", { client });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async updateClientStatus(req, res) {
    try {
      const { id } = req.params;
      const validation = validateStatusInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const client = await ClientService.updateClientStatus(id, req.body.status, context);
      return sendSuccess(res, 200, "Client status updated successfully", { client });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async deleteClient(req, res) {
    try {
      const { id } = req.params;
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      await ClientService.deleteClient(id, context);
      return sendSuccess(res, 200, "Client deleted successfully");
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async exportClients(req, res) {
    try {
      const { client_ids, filters, format } = req.body || {};
      const context = { userId: req.user?.id, ipAddress: req.ip || req.headers["x-forwarded-for"] };
      const result = await ClientService.exportClients(
        {
          client_ids,
          filters,
          format,
        },
        context
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.csvContent);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = ClientController;
