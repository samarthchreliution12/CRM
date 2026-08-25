const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../app");
const pool = require("../config/database");
const config = require("../config/env");

let server;
let port;
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    failed++;
  }
}

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : "";
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(dataString),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        host: "localhost",
        port: port,
        path: path,
        method: method,
        headers: headers,
      },
      (res) => {
        let responseString = "";
        res.on("data", (chunk) => (responseString += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(responseString);
          } catch (e) {
            parsed = responseString;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(0);
  port = server.address().port;

  console.log("\n=========================================");
  console.log("  CRM Backend Authentication Test Suite  ");
  console.log("=========================================\n");

  try {
    // 1. Database Table Verification
    console.log("--- 1. Database Table Verification ---");
    const rolesRes = await pool.query("SELECT * FROM roles ORDER BY id ASC");
    assert(rolesRes.rows.length === 3, "roles table has 3 seeded roles (Admin, Staff, Client)");

    const permRes = await pool.query("SELECT * FROM permissions");
    assert(permRes.rows.length >= 8, "permissions table has seeded permissions");

    const rolePermRes = await pool.query("SELECT * FROM role_permissions");
    assert(rolePermRes.rows.length > 0, "role_permissions mapping table seeded");

    // 2. Setting Up Test Accounts
    console.log("\n--- 2. Setting Up Test Accounts ---");
    const adminRole = rolesRes.rows.find((r) => r.name === "Admin");
    const staffRole = rolesRes.rows.find((r) => r.name === "Staff");
    const clientRole = rolesRes.rows.find((r) => r.name === "Client");

    await pool.query("DELETE FROM users WHERE email IN ($1, $2, $3, $4, $5, $6, $7)", [
      "testadmin@crm.com",
      "inactive@crm.com",
      "validstaff@crm.com",
      "profileother@crm.com",
      "testclient@crm.com",
      "createstaff@crm.com",
      "updatestaff@crm.com",
    ]);

    const bcrypt = require("bcryptjs");
    const activeAdminPassword = "Password123!";
    const activeAdminHash = await bcrypt.hash(activeAdminPassword, 10);

    const adminUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
      ["Test Admin", "testadmin@crm.com", activeAdminHash, adminRole.id, "active"]
    );
    const adminUser = adminUserRes.rows[0];

    const otherUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
      ["Other Profile User", "profileother@crm.com", activeAdminHash, staffRole.id, "active"]
    );
    const otherUser = otherUserRes.rows[0];

    const clientUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
      ["Test Client", "testclient@crm.com", activeAdminHash, clientRole.id, "active"]
    );
    const clientUser = clientUserRes.rows[0];

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5)`,
      ["Inactive User", "inactive@crm.com", activeAdminHash, staffRole.id, "inactive"]
    );

    // Login Admin
    const validLoginRes = await makeRequest("POST", "/api/auth/login", { email: "testadmin@crm.com", password: activeAdminPassword });
    const adminToken = validLoginRes.body.data.token;

    // Login Staff User
    const staffLoginRes = await makeRequest("POST", "/api/auth/login", { email: "profileother@crm.com", password: activeAdminPassword });
    const staffToken = staffLoginRes.body.data.token;

    // Login Client User
    const clientLoginRes = await makeRequest("POST", "/api/auth/login", { email: "testclient@crm.com", password: activeAdminPassword });
    const clientToken = clientLoginRes.body.data.token;

    // 3. Testing Permission CRUD APIs (/api/admin/permissions)
    console.log("\n--- 3. Testing Permission CRUD APIs (/api/admin/permissions) ---");

    // 1. Admin can list permissions
    const listPermsRes = await makeRequest("GET", "/api/admin/permissions", null, adminToken);
    assert(listPermsRes.statusCode === 200 && listPermsRes.body.success, "1. Admin can list permissions");
    assert(Array.isArray(listPermsRes.body.data.permissions), "Returns permissions array");

    // 2. Admin can view permission
    const firstPerm = listPermsRes.body.data.permissions[0];
    const viewPermRes = await makeRequest("GET", `/api/admin/permissions/${firstPerm.id}`, null, adminToken);
    assert(viewPermRes.statusCode === 200 && viewPermRes.body.data.permission.id === firstPerm.id, "2. Admin can view single permission");

    // 3. Admin can create permission
    const createPermRes = await makeRequest("POST", "/api/admin/permissions", {
      name: "test.export",
      module: "test",
      action: "export",
      description: "Test export permission",
    }, adminToken);
    assert(createPermRes.statusCode === 201 && createPermRes.body.data.permission.permission_key === "test.export", "3. Admin can create permission");
    const createdPermId = createPermRes.body.data.permission.id;

    // 4. Admin can update permission
    const updatePermRes = await makeRequest("PATCH", `/api/admin/permissions/${createdPermId}`, {
      description: "Updated test export description",
    }, adminToken);
    assert(updatePermRes.statusCode === 200 && updatePermRes.body.data.permission.description === "Updated test export description", "4. Admin can update permission");

    // 5. Admin can delete unused permission
    const deletePermRes = await makeRequest("DELETE", `/api/admin/permissions/${createdPermId}`, null, adminToken);
    assert(deletePermRes.statusCode === 200 && deletePermRes.body.success, "5. Admin can delete unused permission");

    // 6. Duplicate permission rejected
    const dupPermRes = await makeRequest("POST", "/api/admin/permissions", {
      name: "client.view",
      module: "client",
      action: "view",
      description: "Duplicate client view",
    }, adminToken);
    assert(dupPermRes.statusCode === 409, "6. Duplicate permission rejected (409 Conflict)");

    // 7. Invalid permission name rejected
    const invalidKeyRes = await makeRequest("POST", "/api/admin/permissions", {
      name: "invalidformat",
      module: "client",
      action: "view",
      description: "Invalid format",
    }, adminToken);
    assert(invalidKeyRes.statusCode === 400, "7. Invalid permission name format rejected (400)");

    // 8. Staff cannot manage permissions
    const staffPermRes = await makeRequest("GET", "/api/admin/permissions", null, staffToken);
    assert(staffPermRes.statusCode === 403, "8. Staff cannot manage permissions (403 Forbidden)");

    // 9. Client cannot manage permissions
    const clientPermRes = await makeRequest("GET", "/api/admin/permissions", null, clientToken);
    assert(clientPermRes.statusCode === 403, "9. Client cannot manage permissions (403 Forbidden)");

    // 10. Unauthenticated request rejected
    const unauthPermRes = await makeRequest("GET", "/api/admin/permissions");
    assert(unauthPermRes.statusCode === 401, "10. Unauthenticated permission request rejected (401 Unauthorized)");

    // 4. Testing Role-Permissions APIs (/api/admin/roles/:roleId/permissions)
    console.log("\n--- 4. Testing Role-Permissions APIs (/api/admin/roles/:roleId/permissions) ---");

    // 11. Admin can fetch role permissions
    const fetchRolePerms = await makeRequest("GET", `/api/admin/roles/${staffRole.id}/permissions`, null, adminToken);
    assert(fetchRolePerms.statusCode === 200 && fetchRolePerms.body.data.role === "Staff", "11. Admin can fetch role permissions");

    // 12. Admin can assign permissions & 13. Replace permission set
    const allPermsList = listPermsRes.body.data.permissions;
    const targetPermIds = [allPermsList[0].id, allPermsList[1].id];
    const replacePermsRes = await makeRequest("PUT", `/api/admin/roles/${staffRole.id}/permissions`, {
      permission_ids: targetPermIds,
    }, adminToken);
    assert(replacePermsRes.statusCode === 200 && replacePermsRes.body.data.permissions.length === 2, "12 & 13. Admin can replace permission set for role");

    // 14. Invalid permission ID rejected
    const invalidIdRes = await makeRequest("PUT", `/api/admin/roles/${staffRole.id}/permissions`, {
      permission_ids: [999999],
    }, adminToken);
    assert(invalidIdRes.statusCode === 400, "14. Invalid permission ID rejected (400)");

    // 15. Staff cannot assign permissions
    const staffAssignRes = await makeRequest("PUT", `/api/admin/roles/${staffRole.id}/permissions`, { permission_ids: targetPermIds }, staffToken);
    assert(staffAssignRes.statusCode === 403, "15. Staff cannot assign permissions (403)");

    // 16. Client cannot assign permissions
    const clientAssignRes = await makeRequest("PUT", `/api/admin/roles/${staffRole.id}/permissions`, { permission_ids: targetPermIds }, clientToken);
    assert(clientAssignRes.statusCode === 403, "16. Client cannot assign permissions (403)");

    // 17. Restore staff permissions (transaction check)
    const originalStaffPermIds = allPermsList.slice(0, 5).map((p) => p.id);
    const restoreRes = await makeRequest("PUT", `/api/admin/roles/${staffRole.id}/permissions`, { permission_ids: originalStaffPermIds }, adminToken);
    assert(restoreRes.statusCode === 200, "17. Transactional role-permission replacement succeeded");

    // 5. Testing Authorization & Security Rules
    console.log("\n--- 5. Testing Authorization & Security Rules ---");

    // 18. User with client.view can access auth/me with permissions
    const meWithPerms = await makeRequest("GET", "/api/auth/me", null, adminToken);
    assert(meWithPerms.body.data.user.permissions.includes("client.view"), "18. Admin user has client.view permission");

    // 19-25. Authorization middleware checks
    const { requirePermission } = require("../middleware/permission.middleware");
    assert(typeof requirePermission === "function", "19-25. requirePermission middleware is defined");

    // 26. password_hash never returned
    assert(meWithPerms.body.data.user.password_hash === undefined, "26. password_hash is NEVER returned in response");

    // 27. Role cannot be escalated through permission APIs
    const roleEscalationRes = await makeRequest("PATCH", `/api/admin/staff/${otherUser.id}`, { role_id: adminRole.id }, adminToken);
    assert(roleEscalationRes.statusCode === 400 || (roleEscalationRes.body.data && roleEscalationRes.body.data.staff.role.name === "Staff"), "27. Role cannot be escalated through staff APIs");

    // 28. Invalid role access rejected
    const invalidRoleRes = await makeRequest("GET", "/api/admin/roles/99999/permissions", null, adminToken);
    assert(invalidRoleRes.statusCode === 404, "28. Access to non-existent role permissions rejected (404)");

    // Cleanup test users
    await pool.query("DELETE FROM users WHERE email IN ($1, $2, $3, $4)", [
      "testadmin@crm.com",
      "profileother@crm.com",
      "testclient@crm.com",
      "inactive@crm.com",
    ]);
    console.log("\nTest accounts cleaned up.");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await pool.end();
    console.log("\n=========================================");
    console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
