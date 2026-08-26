const express = require("express");
const router = express.Router();
const ClientServiceController = require("../controllers/clientService.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", ClientServiceController.listClientServices);
router.get("/:id", ClientServiceController.getClientService);

module.exports = router;
