require("dotenv").config();
const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const GroupService = require("../services/group.service");
const UserModel = require("../models/user.model");

let adminUser, staffUser1, staffUser2;
let adminToken;

function generateToken(user, roleName, permissions = []) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: { id: user.role_id, name: roleName },
      permissions: permissions,
    },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1h" }
  );
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  CRM Group Management Backend Test Suite              ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  let createdGroup = null;

  try {
    const passwordHash = await bcrypt.hash("TestPass123!", 10);

    // Fetch default roles
    const rolesRes = await pool.query("SELECT id, name FROM roles");
    const rolesMap = {};
    rolesRes.rows.forEach((r) => (rolesMap[r.name] = r.id));

    // Seed test users
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Group Admin', 'groupadmin@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role_id`,
      [passwordHash, rolesMap["Admin"]]
    );
    adminUser = adminRes.rows[0];
    adminToken = generateToken(adminUser, "Admin", ["roles.view", "roles.create"]);

    const staff1Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Staff Member 1', 'staffgroup1@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role_id`,
      [passwordHash, rolesMap["Staff"]]
    );
    staffUser1 = staff1Res.rows[0];

    const staff2Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Staff Member 2', 'staffgroup2@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role_id`,
      [passwordHash, rolesMap["Staff"]]
    );
    staffUser2 = staff2Res.rows[0];

    console.log("--- 1. Group Creation & Validation ---");
    createdGroup = await GroupService.createGroup({
      name: "Document Operations Team",
      description: "Custom team managing secure document verification",
    });

    assert(
      createdGroup && createdGroup.id > 3 && createdGroup.name === "Document Operations Team",
      "Custom group created successfully in roles table"
    );

    // Duplicate name validation
    let dupFailed = false;
    try {
      await GroupService.createGroup({
        name: "document operations team",
        description: "Duplicate team name",
      });
    } catch (err) {
      dupFailed = err.statusCode === 400;
    }
    assert(dupFailed, "Duplicate group name rejected with 400 Bad Request");

    console.log("\n--- 2. Get Custom Groups ---");
    const customGroups = await GroupService.getGroups();
    assert(Array.isArray(customGroups), "Returns custom groups array");
    assert(
      customGroups.some((g) => g.id === createdGroup.id),
      "Created group appears in custom groups list"
    );
    assert(
      !customGroups.some((g) => ["Admin", "Staff", "Client"].includes(g.name)),
      "Default system roles (Admin, Staff, Client) excluded from custom groups list"
    );

    console.log("\n--- 3. Group Details & Members List ---");
    const details = await GroupService.getGroupDetails(createdGroup.id);
    assert(details && details.group && details.group.id === createdGroup.id, "Retrieves group details by ID");
    assert(Array.isArray(details.permissions), "Permissions array included in group details");
    assert(Array.isArray(details.members), "Members array included in group details");

    console.log("\n--- 4. Add Members to Group ---");
    const addRes = await GroupService.addMembers(createdGroup.id, [staffUser1.id, staffUser2.id]);
    assert(addRes && addRes.members.length === 2, "Added 2 staff members to custom group");

    // Verify database role_id update
    const updatedUser1 = await UserModel.findByIdWithRoleAndPermissions(staffUser1.id);
    assert(updatedUser1.role.id === createdGroup.id, "User 1 role_id updated to custom group ID in DB");
    assert(updatedUser1.role.name === "Document Operations Team", "User 1 role name matches custom group name");

    console.log("\n--- 5. Assign & Inherit Group Permissions ---");
    // Fetch a couple of existing permissions
    const permsRes = await pool.query("SELECT id FROM permissions LIMIT 3");
    const permIds = permsRes.rows.map((p) => p.id);

    const permUpdateRes = await GroupService.updatePermissions(createdGroup.id, permIds);
    assert(permUpdateRes && permUpdateRes.permissions.length === permIds.length, "Assigned permissions to group");

    // Verify staff user dynamically receives group's permissions
    const user1WithPerms = await UserModel.findByIdWithRoleAndPermissions(staffUser1.id);
    assert(
      user1WithPerms.permissions && user1WithPerms.permissions.length === permIds.length,
      "Staff member dynamically inherits assigned group permissions"
    );

    console.log("\n--- 6. Prevent Deleting Group with Members ---");
    let deleteBlocked = false;
    try {
      await GroupService.deleteGroup(createdGroup.id);
    } catch (err) {
      deleteBlocked = err.statusCode === 400 && err.message.includes("assigned member");
    }
    assert(deleteBlocked, "Deleting group with assigned members blocked with 400 Bad Request");

    console.log("\n--- 7. Remove Member from Group ---");
    await GroupService.removeMember(createdGroup.id, staffUser1.id);
    const user1AfterRemove = await UserModel.findByIdWithRoleAndPermissions(staffUser1.id);
    assert(user1AfterRemove.role.name === "Staff", "Removed user reassigned to default Staff role");
    assert(user1AfterRemove.id === staffUser1.id, "User is NOT deleted when removed from group");

    // Remove second user
    await GroupService.removeMember(createdGroup.id, staffUser2.id);
    const detailsAfterRemove = await GroupService.getGroupDetails(createdGroup.id);
    assert(detailsAfterRemove.group.member_count === 0, "Group member count reaches 0 after removing all members");

    console.log("\n--- 8. Delete Empty Group ---");
    const deleteRes = await GroupService.deleteGroup(createdGroup.id);
    assert(deleteRes && deleteRes.message.includes("deleted successfully"), "Empty group deleted successfully");

    // Verify role and permissions deleted from database
    const groupCheck = await pool.query("SELECT id FROM roles WHERE id = $1", [createdGroup.id]);
    assert(groupCheck.rows.length === 0, "Role record deleted from roles table");

    const rolePermCheck = await pool.query("SELECT id FROM role_permissions WHERE role_id = $1", [createdGroup.id]);
    assert(rolePermCheck.rows.length === 0, "Associated role_permissions records deleted from DB");

    console.log("\n=======================================================");
    console.log(`  Group Management Backend Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================\n");

    // Cleanup test users
    await pool.query(
      "DELETE FROM users WHERE email IN ('groupadmin@crm.test', 'staffgroup1@crm.test', 'staffgroup2@crm.test')"
    );
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await pool.end();
  }
}

runTests();
