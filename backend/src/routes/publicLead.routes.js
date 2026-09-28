const express = require("express");
const router = express.Router();
const LeadController = require("../controllers/lead.controller");
const { publicLeadLimiter } = require("../middleware/rateLimiter.middleware");

// POST /api/public/leads - Create lead from public website
router.post("/", publicLeadLimiter, LeadController.createPublicLead);

module.exports = router;
