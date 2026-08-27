const express = require("express");
const router = express.Router();
const GroupController = require("../controllers/group.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

// Enforce authentication & Admin role for Group Management routes
router.use(authenticate);
router.use(requireRole("Admin"));

// POST /api/roles/groups - Create a custom group
router.post("/", GroupController.createGroup);

// GET /api/roles/groups - List all custom groups
router.get("/", GroupController.getGroups);

// GET /api/roles/groups/:id - Get group details (info, permissions, members)
router.get("/:id", GroupController.getGroupDetails);

// POST /api/roles/groups/:id/members - Add members to group
router.post("/:id/members", GroupController.addMembers);

// DELETE /api/roles/groups/:id/members/:userId - Remove member from group
router.delete("/:id/members/:userId", GroupController.removeMember);

// PUT /api/roles/groups/:id/permissions - Update group permissions
router.put("/:id/permissions", GroupController.updatePermissions);

// DELETE /api/roles/groups/:id - Delete custom group
router.delete("/:id", GroupController.deleteGroup);

module.exports = router;
