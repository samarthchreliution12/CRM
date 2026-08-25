const express = require("express");
const router = express.Router({ mergeParams: true });
const ClientFamilyMemberController = require("../controllers/clientFamilyMember.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", requirePermission("client.view"), ClientFamilyMemberController.listFamilyMembers);
router.post("/", requirePermission("client.edit"), ClientFamilyMemberController.createFamilyMember);
router.patch("/:familyMemberId", requirePermission("client.edit"), ClientFamilyMemberController.updateFamilyMember);
router.delete("/:familyMemberId", requirePermission("client.edit"), ClientFamilyMemberController.deleteFamilyMember);

module.exports = router;
