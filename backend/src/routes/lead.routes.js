const express = require("express");
const router = express.Router();
const LeadController = require("../controllers/lead.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

// Enforce authentication for all Lead routes
router.use(authenticate);

// GET /api/leads - List leads (Kanban or table)
router.get(
  "/",
  requirePermission(["lead.read", "lead.view"]),
  LeadController.getLeads
);

// POST /api/leads - Create new lead
router.post(
  "/",
  requirePermission("lead.create"),
  LeadController.createLead
);

// GET /api/leads/:id - Get single lead details
router.get(
  "/:id",
  requirePermission(["lead.read", "lead.view"]),
  LeadController.getLeadById
);

// PATCH /api/leads/:id - General update lead information
router.patch(
  "/:id",
  requirePermission(["lead.update", "lead.edit"]),
  LeadController.updateLead
);

// PATCH /api/leads/:id/status - Dedicated status drag-and-drop update
router.patch(
  "/:id/status",
  requirePermission(["lead.update", "lead.edit"]),
  LeadController.updateLeadStatus
);

// POST /api/leads/:id/convert - Dedicated lead conversion to client
router.post(
  "/:id/convert",
  requirePermission(["lead.update", "lead.edit", "lead.create"]),
  LeadController.convertLeadToClient
);

// DELETE /api/leads/:id - Delete lead
router.delete(
  "/:id",
  requirePermission("lead.delete"),
  LeadController.deleteLead
);

module.exports = router;
