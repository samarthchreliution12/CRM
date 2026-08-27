require("dotenv").config();
const http = require("http");
const app = require("../app");
const pool = require("../config/database");

let server;
let baseUrl;
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
    const url = new URL(path, baseUrl);
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runClientAPITests() {
  console.log("\n=========================================");
  console.log("    CRM Client Module API Test Suite     ");
  console.log("=========================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  try {
    // Fetch Seeded Roles & Client Types
    const rolesRes = await pool.query("SELECT id, name FROM roles");
    const adminRole = rolesRes.rows.find((r) => r.name === "Admin");
    const staffRole = rolesRes.rows.find((r) => r.name === "Staff");

    const clientTypesRes = await pool.query("SELECT id, name FROM client_types");
    const individualType = clientTypesRes.rows.find((t) => t.name === "Individual");
    const companyType = clientTypesRes.rows.find((t) => t.name === "Company");

    // Clean up test data before running
    await pool.query("DELETE FROM clients WHERE ucc_no LIKE 'APIUCC%'");
    await pool.query("DELETE FROM users WHERE email LIKE '%@clientapitest.com'");
    await pool.query("DELETE FROM roles WHERE name = 'Restricted Staff ClientTest'");

    // Ensure Staff and Admin roles have client permissions assigned for test execution
    const clientPermsRes = await pool.query(
      "SELECT id FROM permissions WHERE permission_key LIKE 'client.%'"
    );
    for (const row of clientPermsRes.rows) {
      await pool.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [staffRole.id, row.id]
      );
      await pool.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [adminRole.id, row.id]
      );
    }

    // Setup Test User Accounts
    const adminUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ["Admin Test", "admin@clientapitest.com", "$2b$10$abcdefghijklmnopqrstuu", adminRole.id, "active"]
    );
    const adminUser = adminUserRes.rows[0];

    const staffUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ["Staff Test", "staff@clientapitest.com", "$2b$10$abcdefghijklmnopqrstuu", staffRole.id, "active"]
    );
    const staffUser = staffUserRes.rows[0];

    // Create a staff role without client permissions for 403 testing
    const restrictedRoleRes = await pool.query(
      `INSERT INTO roles (name, description, status) VALUES ($1, $2, $3) RETURNING id`,
      ["Restricted Staff ClientTest", "Role without client perms", "active"]
    );
    const restrictedRoleId = restrictedRoleRes.rows[0].id;

    const restrictedStaffRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ["Restricted Staff Test", "restricted@clientapitest.com", "$2b$10$abcdefghijklmnopqrstuu", restrictedRoleId, "active"]
    );
    const restrictedStaffUser = restrictedStaffRes.rows[0];

    // Login users to get JWT tokens
    const adminToken = require("jsonwebtoken").sign(
      { id: adminUser.id, role_id: adminRole.id, role_name: adminRole.name },
      process.env.JWT_SECRET || "antigravity_jwt_secret_key_2026_crm",
      { expiresIn: "1h" }
    );

    const staffToken = require("jsonwebtoken").sign(
      { id: staffUser.id, role_id: staffRole.id, role_name: staffRole.name },
      process.env.JWT_SECRET || "antigravity_jwt_secret_key_2026_crm",
      { expiresIn: "1h" }
    );

    const restrictedStaffToken = require("jsonwebtoken").sign(
      { id: restrictedStaffUser.id, role_id: restrictedRoleId, role_name: "Restricted Staff ClientTest" },
      process.env.JWT_SECRET || "antigravity_jwt_secret_key_2026_crm",
      { expiresIn: "1h" }
    );

    // --- 1. Permission Enforcement Tests ---
    console.log("--- 1. Permission Enforcement Tests ---");

    // Unauthenticated request -> 401
    const unauthRes = await makeRequest("GET", "/api/clients");
    assert(unauthRes.statusCode === 401, "Request without token returns 401 Unauthorized");

    // Invalid token -> 401
    const invalidTokenRes = await makeRequest("GET", "/api/clients", null, "invalid.token.here");
    assert(invalidTokenRes.statusCode === 401, "Request with invalid token returns 401 Unauthorized");

    // Admin with client.view -> 200
    const adminListRes = await makeRequest("GET", "/api/clients", null, adminToken);
    assert(adminListRes.statusCode === 200 && adminListRes.body.success, "Admin with client.view can list clients (200 OK)");

    // Staff with client.view -> 200
    const staffListRes = await makeRequest("GET", "/api/clients", null, staffToken);
    assert(staffListRes.statusCode === 200 && staffListRes.body.success, "Staff with client.view can list clients (200 OK)");

    // Staff without client.view -> 403
    const restrictedListRes = await makeRequest("GET", "/api/clients", null, restrictedStaffToken);
    assert(restrictedListRes.statusCode === 403, "Staff without client.view receives 403 Forbidden");

    // Admin with client.create -> success
    const adminCreateRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC001",
      name: "Admin Created Client",
      email: "adminclient@clientapitest.com",
      mobile_no: "9876543210",
      whatsapp_no: "9876543210",
      pan: "ABCDE1234F",
      dob: "1992-05-15",
      gender: "Male",
      occupation: "Engineer",
      client_type_id: individualType.id,
      status: "active",
    }, adminToken);
    assert(adminCreateRes.statusCode === 201 && adminCreateRes.body.success, "Admin with client.create can create client (201 Created)");
    const createdClientId1 = adminCreateRes.body.data.client.id;

    // Staff with client.create -> success
    const staffCreateRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC002",
      name: "Staff Created Client",
      email: "staffclient@clientapitest.com",
      mobile_no: "9876543211",
      whatsapp_no: "9876543211",
      pan: "ABCDE5678G",
      dob: "1988-10-20",
      gender: "Female",
      occupation: "Doctor",
      client_type_id: companyType.id,
      status: "active",
    }, staffToken);
    assert(staffCreateRes.statusCode === 201 && staffCreateRes.body.success, "Staff with client.create can create client (201 Created)");
    const createdClientId2 = staffCreateRes.body.data.client.id;

    // Staff without client.create -> 403
    const restrictedCreateRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC003",
      name: "Forbidden Client",
      client_type_id: individualType.id,
    }, restrictedStaffToken);
    assert(restrictedCreateRes.statusCode === 403, "Staff without client.create receives 403 Forbidden");

    // Admin with client.edit -> success
    const adminEditRes = await makeRequest("PATCH", `/api/clients/${createdClientId1}`, {
      name: "Updated Admin Client",
    }, adminToken);
    assert(adminEditRes.statusCode === 200 && adminEditRes.body.data.client.name === "Updated Admin Client", "Admin with client.edit can update client (200 OK)");

    // Staff with client.edit -> success
    const staffEditRes = await makeRequest("PATCH", `/api/clients/${createdClientId2}`, {
      name: "Updated Staff Client",
    }, staffToken);
    assert(staffEditRes.statusCode === 200 && staffEditRes.body.data.client.name === "Updated Staff Client", "Staff with client.edit can update client (200 OK)");

    // Staff without client.edit -> 403
    const restrictedEditRes = await makeRequest("PATCH", `/api/clients/${createdClientId1}`, {
      name: "Hack Name",
    }, restrictedStaffToken);
    assert(restrictedEditRes.statusCode === 403, "Staff without client.edit receives 403 Forbidden");

    // Admin with client.delete -> success
    const tempClientRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC004",
      name: "Temp Client For Delete",
      pan: "ABCDE1234F",
      dob: "1990-05-15",
      client_type_id: individualType.id,
    }, adminToken);
    assert(tempClientRes.statusCode === 201 && tempClientRes.body.success, "Temp client created for delete");
    const tempClientId = tempClientRes.body.data.client.id;

    const adminDeleteRes = await makeRequest("DELETE", `/api/clients/${tempClientId}`, null, adminToken);
    assert(adminDeleteRes.statusCode === 200 && adminDeleteRes.body.success, "Admin with client.delete can delete client (200 OK)");

    // Staff with client.delete -> success
    const tempClientRes2 = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC005",
      name: "Temp Client For Staff Delete",
      pan: "ABCDE5678G",
      dob: "1988-10-20",
      client_type_id: individualType.id,
    }, adminToken);
    assert(tempClientRes2.statusCode === 201 && tempClientRes2.body.success, "Temp client created for staff delete");
    const tempClientId2 = tempClientRes2.body.data.client.id;

    const staffDeleteRes = await makeRequest("DELETE", `/api/clients/${tempClientId2}`, null, staffToken);
    assert(staffDeleteRes.statusCode === 200 && staffDeleteRes.body.success, "Staff with client.delete can delete client (200 OK)");

    // Staff without client.delete -> 403
    const restrictedDeleteRes = await makeRequest("DELETE", `/api/clients/${createdClientId1}`, null, restrictedStaffToken);
    assert(restrictedDeleteRes.statusCode === 403, "Staff without client.delete receives 403 Forbidden");

    // --- 2. Client Validation Tests ---
    console.log("\n--- 2. Client Validation Tests ---");

    // Missing DOB or PAN rejected
    const noDobPanRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCCNODOB",
      name: "No DOB PAN Client",
      client_type_id: individualType.id,
    }, adminToken);
    assert(noDobPanRes.statusCode === 400, "Client creation without DOB and PAN rejected (400 Bad Request)");

    // Duplicate UCC rejected
    const dupUccRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC001",
      name: "Duplicate UCC Client",
      pan: "ABCDE9999Z",
      dob: "1991-01-01",
      client_type_id: individualType.id,
    }, adminToken);
    assert(dupUccRes.statusCode === 409, "Duplicate UCC number rejected (409 Conflict)");

    // Invalid email rejected
    const invalidEmailRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC006",
      name: "Invalid Email Client",
      email: "invalid-email-format",
      pan: "ABCDE8888X",
      dob: "1991-01-01",
      client_type_id: individualType.id,
    }, adminToken);
    assert(invalidEmailRes.statusCode === 400, "Invalid email format rejected (400 Bad Request)");

    // Invalid mobile rejected
    const invalidMobileRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC007",
      name: "Invalid Mobile Client",
      mobile_no: "123",
      pan: "ABCDE7777Y",
      dob: "1991-01-01",
      client_type_id: individualType.id,
    }, adminToken);
    assert(invalidMobileRes.statusCode === 400, "Invalid mobile number format rejected (400 Bad Request)");

    // Invalid PAN rejected
    const invalidPanRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC008",
      name: "Invalid PAN Client",
      pan: "INVALIDPAN123",
      dob: "1991-01-01",
      client_type_id: individualType.id,
    }, adminToken);
    assert(invalidPanRes.statusCode === 400, "Invalid PAN number format rejected (400 Bad Request)");

    // Invalid client_type_id rejected
    const invalidTypeRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "APIUCC009",
      name: "Invalid Type Client",
      pan: "ABCDE6666W",
      dob: "1991-01-01",
      client_type_id: 99999,
    }, adminToken);
    assert(invalidTypeRes.statusCode === 400, "Invalid client_type_id rejected (400 Bad Request)");

    // Invalid status rejected
    const invalidStatusRes = await makeRequest("PATCH", `/api/clients/${createdClientId1}/status`, {
      status: "invalid_status",
    }, adminToken);
    assert(invalidStatusRes.statusCode === 400, "Invalid status value rejected (400 Bad Request)");

    // --- 3. Family Member APIs Tests ---
    console.log("\n--- 3. Family Member APIs Tests ---");

    // Add family member
    const addFmRes = await makeRequest("POST", `/api/clients/${createdClientId1}/family-members`, {
      relationship: "Spouse",
      name: "Jane Doe",
      email: "janedoe@clientapitest.com",
      mobile_no: "9876543212",
      pan_no: "ABCDE9999H",
      dob: "1994-08-12",
      gender: "Female",
    }, adminToken);
    assert(addFmRes.statusCode === 201 && addFmRes.body.success, "Add family member for client (201 Created)");
    const familyMemberId1 = addFmRes.body.data.family_member.id;

    // Get family members
    const getFmRes = await makeRequest("GET", `/api/clients/${createdClientId1}/family-members`, null, adminToken);
    assert(getFmRes.statusCode === 200 && getFmRes.body.data.family_members.length >= 1, "Get family members for client (200 OK)");

    // Update family member
    const editFmRes = await makeRequest("PATCH", `/api/clients/${createdClientId1}/family-members/${familyMemberId1}`, {
      name: "Jane Updated Doe",
    }, adminToken);
    assert(editFmRes.statusCode === 200 && editFmRes.body.data.family_member.name === "Jane Updated Doe", "Update family member details (200 OK)");

    // Family member from another Client cannot be modified
    const crossEditFmRes = await makeRequest("PATCH", `/api/clients/${createdClientId2}/family-members/${familyMemberId1}`, {
      name: "Hacked Name",
    }, adminToken);
    assert(crossEditFmRes.statusCode === 403, "Modifying family member belonging to another client rejected (403 Forbidden)");

    // Family member from another Client cannot be deleted
    const crossDeleteFmRes = await makeRequest("DELETE", `/api/clients/${createdClientId2}/family-members/${familyMemberId1}`, null, adminToken);
    assert(crossDeleteFmRes.statusCode === 403, "Deleting family member belonging to another client rejected (403 Forbidden)");

    // Delete family member
    const deleteFmRes = await makeRequest("DELETE", `/api/clients/${createdClientId1}/family-members/${familyMemberId1}`, null, adminToken);
    assert(deleteFmRes.statusCode === 200 && deleteFmRes.body.success, "Delete family member (200 OK)");

    // --- 4. Pagination & Filter Tests ---
    console.log("\n--- 4. Pagination & Filter Tests ---");

    // Pagination, page, limit, total, totalPages
    const paginatedRes = await makeRequest("GET", "/api/clients?page=1&limit=2", null, adminToken);
    assert(paginatedRes.statusCode === 200 && paginatedRes.body.data.pagination.page === 1, "Pagination & page parameter works");
    assert(paginatedRes.body.data.pagination.limit === 2, "Limit parameter works");
    assert(paginatedRes.body.data.pagination.total >= 2, "Total count is returned");
    assert(paginatedRes.body.data.pagination.totalPages >= 1, "TotalPages count is returned");

    // Search by Client name
    const searchNameRes = await makeRequest("GET", "/api/clients?search=Updated Admin Client", null, adminToken);
    assert(searchNameRes.body.data.clients.length >= 1 && searchNameRes.body.data.clients[0].name === "Updated Admin Client", "Search by Client name works");

    // Search by UCC
    const searchUccRes = await makeRequest("GET", "/api/clients?search=APIUCC001", null, adminToken);
    assert(searchUccRes.body.data.clients.length >= 1 && searchUccRes.body.data.clients[0].ucc_no === "APIUCC001", "Search by UCC works");

    // Search by mobile
    const searchMobileRes = await makeRequest("GET", "/api/clients?search=9876543210", null, adminToken);
    assert(searchMobileRes.body.data.clients.length >= 1, "Search by mobile works");

    // Search by email
    const searchEmailRes = await makeRequest("GET", "/api/clients?search=adminclient@clientapitest.com", null, adminToken);
    assert(searchEmailRes.body.data.clients.length >= 1, "Search by email works");

    // Search by PAN
    const searchPanRes = await makeRequest("GET", "/api/clients?search=ABCDE1234F", null, adminToken);
    assert(searchPanRes.body.data.clients.length >= 1, "Search by PAN works");

    // Status filter
    const statusFilterRes = await makeRequest("GET", "/api/clients?status=active", null, adminToken);
    assert(statusFilterRes.body.data.clients.every((c) => c.status === "active"), "Status filter works");

    // Client Type filter
    const typeFilterRes = await makeRequest("GET", `/api/clients?client_type_id=${individualType.id}`, null, adminToken);
    assert(typeFilterRes.body.data.clients.every((c) => Number(c.client_type.id) === Number(individualType.id)), "Client Type filter works");

    // Cleanup test data
    await pool.query("DELETE FROM clients WHERE ucc_no LIKE 'APIUCC%'");
    await pool.query("DELETE FROM users WHERE email LIKE '%@clientapitest.com'");
    await pool.query("DELETE FROM roles WHERE id = $1", [restrictedRoleId]);
    console.log("\nClient API Test Suite cleanup completed.");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await pool.end();
    console.log("\n=========================================");
    console.log(`  Client API Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runClientAPITests();
