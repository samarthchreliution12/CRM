const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboard.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get(
  "/upcoming-birthdays",
  requirePermission("client.view"),
  DashboardController.getUpcomingBirthdays
);

router.get(
  "/overview",
  requirePermission("client.view"),
  DashboardController.getOverview
);

module.exports = router;
