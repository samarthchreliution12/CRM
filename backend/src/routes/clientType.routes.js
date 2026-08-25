const express = require("express");
const router = express.Router();
const ClientTypeController = require("../controllers/clientType.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", ClientTypeController.listClientTypes);
router.get("/:id", ClientTypeController.getClientType);

module.exports = router;
