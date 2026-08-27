const LeadService = require("../services/lead.service");
const { sendSuccess } = require("../utils/response.util");

class LeadController {
  /**
   * POST /api/leads - Create a new lead
   */
  static async createLead(req, res, next) {
    try {
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      const lead = await LeadService.createLead(req.body, context);
      return sendSuccess(res, 201, "Lead created successfully", { lead });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/leads - Get list of leads (Kanban or table)
   */
  static async getLeads(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status,
        assigned_to: req.query.assigned_to,
        source: req.query.source,
        service_id: req.query.service_id,
        client_type_id: req.query.client_type_id,
        priority: req.query.priority,
        my_leads: req.query.my_leads,
        page: req.query.page,
        limit: req.query.limit,
      };
      const context = { userId: req.user.id };
      const result = await LeadService.getLeads(filters, context);
      return sendSuccess(res, 200, "Leads retrieved successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/leads/:id - Get single lead details
   */
  static async getLeadById(req, res, next) {
    try {
      const leadId = parseInt(req.params.id, 10);
      const lead = await LeadService.getLeadById(leadId);
      return sendSuccess(res, 200, "Lead details retrieved successfully", { lead });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/leads/:id - Update lead information
   */
  static async updateLead(req, res, next) {
    try {
      const leadId = parseInt(req.params.id, 10);
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      const updatedLead = await LeadService.updateLead(leadId, req.body, context);
      return sendSuccess(res, 200, "Lead updated successfully", { lead: updatedLead });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/leads/:id/status - Dedicated drag-and-drop status update
   */
  static async updateLeadStatus(req, res, next) {
    try {
      const leadId = parseInt(req.params.id, 10);
      const { status } = req.body;
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      const updatedLead = await LeadService.updateLeadStatus(leadId, status, context);
      return sendSuccess(res, 200, "Lead status updated successfully", { lead: updatedLead });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/leads/:id/convert - Dedicated lead conversion to client endpoint
   */
  static async convertLeadToClient(req, res, next) {
    try {
      const leadId = parseInt(req.params.id, 10);
      const options = {
        dob: req.body.dob,
        pan: req.body.pan,
        ucc_no: req.body.ucc_no,
        client_type_id: req.body.client_type_id,
      };
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      const result = await LeadService.convertLeadToClient(leadId, options, context);
      return res.status(200).json({
        success: true,
        message: result.message,
        lead: result.lead,
        client: result.client,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/leads/:id - Delete lead
   */
  static async deleteLead(req, res, next) {
    try {
      const leadId = parseInt(req.params.id, 10);
      const context = {
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
      };
      await LeadService.deleteLead(leadId, context);
      return sendSuccess(res, 200, "Lead deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LeadController;
