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

async function runTests() {
  console.log("\n=======================================================");
  console.log("  CRM Client Types & Services Backend Test Suite       ");
  console.log("=======================================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  try {
    // Setup roles, permissions, users
    const rolesRes = await pool.query("SELECT id, name FROM roles");
    const adminRole = rolesRes.rows.find((r) => r.name === "Admin");
    const staffRole = rolesRes.rows.find((r) => r.name === "Staff");

    // Clean test users & data
    await pool.query("DELETE FROM clients WHERE ucc_no LIKE 'CTS%'");
    await pool.query("DELETE FROM users WHERE email LIKE '%@ctstest.com'");
    await pool.query("DELETE FROM client_types WHERE name LIKE 'CTSTest%'");
    await pool.query("DELETE FROM client_services WHERE name LIKE 'CSTest%'");

    // Assign permissions
    const permsRes = await pool.query("SELECT id, permission_key FROM permissions");
    for (const p of permsRes.rows) {
      await pool.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [adminRole.id, p.id]
      );
      if (["client.view", "client.create", "client.edit", "client_type.view", "client_service.view"].includes(p.permission_key)) {
        await pool.query(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [staffRole.id, p.id]
        );
      }
    }

    const adminUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
      ["Admin CTS Test", "admin@ctstest.com", "$2b$10$abcdefghijklmnopqrstuu", adminRole.id]
    );
    const adminUser = adminUserRes.rows[0];

    const staffUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
      ["Staff CTS Test", "staff@ctstest.com", "$2b$10$abcdefghijklmnopqrstuu", staffRole.id]
    );
    const staffUser = staffUserRes.rows[0];

    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "antigravity_jwt_secret_key_2026_crm";
    const adminToken = jwt.sign({ id: adminUser.id, role_id: adminRole.id, role_name: "Admin" }, secret, { expiresIn: "1h" });
    const staffToken = jwt.sign({ id: staffUser.id, role_id: staffRole.id, role_name: "Staff" }, secret, { expiresIn: "1h" });

    // --- 1. Client Types Tests ---
    console.log("--- 1. Client Types Tests ---");

    // 1. Admin can list client types
    const listCtRes = await makeRequest("GET", "/api/admin/client-types", null, adminToken);
    assert(listCtRes.statusCode === 200 && Array.isArray(listCtRes.body.data.client_types), "1. Admin can list client types");

    // 3. Admin can create client type
    const createCtRes = await makeRequest("POST", "/api/admin/client-types", {
      name: "CTSTest Type1",
      description: "Test client type description",
      status: "active"
    }, adminToken);
    assert(createCtRes.statusCode === 201 && createCtRes.body.data.client_type.name === "CTSTest Type1", "3. Admin can create client type");
    const testCtId1 = createCtRes.body.data.client_type.id;

    // 2. Admin can get one client type
    const getCtRes = await makeRequest("GET", `/api/admin/client-types/${testCtId1}`, null, adminToken);
    assert(getCtRes.statusCode === 200 && getCtRes.body.data.client_type.id === testCtId1, "2. Admin can get one client type");

    // 4. Admin can update client type
    const editCtRes = await makeRequest("PATCH", `/api/admin/client-types/${testCtId1}`, {
      description: "Updated description"
    }, adminToken);
    assert(editCtRes.statusCode === 200 && editCtRes.body.data.client_type.description === "Updated description", "4. Admin can update client type");

    // 6. Duplicate client type rejected
    const dupCtRes = await makeRequest("POST", "/api/admin/client-types", {
      name: "CTSTest Type1"
    }, adminToken);
    assert(dupCtRes.statusCode === 409, "6. Duplicate client type rejected (409 Conflict)");

    // 5. Admin can delete unused client type
    const createCtRes2 = await makeRequest("POST", "/api/admin/client-types", {
      name: "CTSTest Type2"
    }, adminToken);
    const testCtId2 = createCtRes2.body.data.client_type.id;
    const deleteCtRes = await makeRequest("DELETE", `/api/admin/client-types/${testCtId2}`, null, adminToken);
    assert(deleteCtRes.statusCode === 200, "5. Admin can delete unused client type");

    // 8. Staff cannot manage client types (POST/PATCH/DELETE)
    const staffCreateCtRes = await makeRequest("POST", "/api/admin/client-types", { name: "CTSTest Staff" }, staffToken);
    assert(staffCreateCtRes.statusCode === 403, "8. Staff cannot create client types (403 Forbidden)");

    // 9. Unauthenticated request rejected
    const unauthCtRes = await makeRequest("GET", "/api/admin/client-types");
    assert(unauthCtRes.statusCode === 401, "9. Unauthenticated request rejected (401 Unauthorized)");


    // --- 2. Client Services Tests ---
    console.log("\n--- 2. Client Services Tests ---");

    // 10. Admin can list services
    const listCsRes = await makeRequest("GET", "/api/admin/client-services", null, adminToken);
    assert(listCsRes.statusCode === 200 && Array.isArray(listCsRes.body.data.client_services), "10. Admin can list services");

    // 12. Admin can create service
    const createCsRes1 = await makeRequest("POST", "/api/admin/client-services", {
      name: "CSTest Service1",
      description: "Test service description",
      status: "active"
    }, adminToken);
    assert(createCsRes1.statusCode === 201 && createCsRes1.body.data.client_service.name === "CSTest Service1", "12. Admin can create service");
    const testCsId1 = createCsRes1.body.data.client_service.id;

    const createCsRes2 = await makeRequest("POST", "/api/admin/client-services", {
      name: "CSTest Service2",
      description: "Second test service",
      status: "active"
    }, adminToken);
    const testCsId2 = createCsRes2.body.data.client_service.id;

    // Inactive service for testing
    const createCsInactiveRes = await makeRequest("POST", "/api/admin/client-services", {
      name: "CSTest Inactive",
      status: "inactive"
    }, adminToken);
    const inactiveCsId = createCsInactiveRes.body.data.client_service.id;

    // 11. Admin can get one service
    const getCsRes = await makeRequest("GET", `/api/admin/client-services/${testCsId1}`, null, adminToken);
    assert(getCsRes.statusCode === 200 && getCsRes.body.data.client_service.id === testCsId1, "11. Admin can get one service");

    // 13. Admin can update service
    const editCsRes = await makeRequest("PATCH", `/api/admin/client-services/${testCsId1}`, {
      description: "Updated service description"
    }, adminToken);
    assert(editCsRes.statusCode === 200 && editCsRes.body.data.client_service.description === "Updated service description", "13. Admin can update service");

    // 15. Duplicate service rejected
    const dupCsRes = await makeRequest("POST", "/api/admin/client-services", {
      name: "CSTest Service1"
    }, adminToken);
    assert(dupCsRes.statusCode === 409, "15. Duplicate service rejected (409 Conflict)");

    // 14. Admin can delete unused service
    const createCsRes3 = await makeRequest("POST", "/api/admin/client-services", {
      name: "CSTest Temp Service"
    }, adminToken);
    const tempCsId = createCsRes3.body.data.client_service.id;
    const deleteCsRes = await makeRequest("DELETE", `/api/admin/client-services/${tempCsId}`, null, adminToken);
    assert(deleteCsRes.statusCode === 200, "14. Admin can delete unused service");

    // 17. Staff cannot manage services
    const staffCreateCsRes = await makeRequest("POST", "/api/admin/client-services", { name: "CSTest Staff" }, staffToken);
    assert(staffCreateCsRes.statusCode === 403, "17. Staff cannot create services (403 Forbidden)");

    // 18. Unauthenticated request rejected
    const unauthCsRes = await makeRequest("GET", "/api/admin/client-services");
    assert(unauthCsRes.statusCode === 401, "18. Unauthenticated request rejected (401 Unauthorized)");


    // --- 3. Client Service Assignment Tests ---
    console.log("\n--- 3. Client Service Assignment Tests ---");

    // 19. Client can be created with multiple services
    const createClientRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "CTSUCC001",
      name: "Client Service Test 1",
      pan: "ABCDE1234F",
      dob: "1995-01-01",
      client_type_id: testCtId1,
      service_ids: [testCsId1, testCsId2]
    }, adminToken);
    assert(createClientRes.statusCode === 201 && createClientRes.body.data.client.services.length === 2, "19. Client can be created with multiple services");
    const testClientId1 = createClientRes.body.data.client.id;

    // 20. Client services are stored correctly
    const csaCheck = await pool.query(
      "SELECT service_id FROM client_service_assignments WHERE client_id = $1 ORDER BY service_id ASC",
      [testClientId1]
    );
    const assignedIds = csaCheck.rows.map((r) => r.service_id);
    assert(assignedIds.length === 2 && assignedIds.includes(testCsId1) && assignedIds.includes(testCsId2), "20. Client services are stored correctly in client_service_assignments");

    // 21. Client details returns only its own services
    const getClientRes = await makeRequest("GET", `/api/clients/${testClientId1}`, null, adminToken);
    assert(getClientRes.statusCode === 200 && getClientRes.body.data.client.services.length === 2, "21. Client details returns only its own services");

    // 22. Client service update replaces assignments correctly
    const updateClientRes = await makeRequest("PATCH", `/api/clients/${testClientId1}`, {
      service_ids: [testCsId1]
    }, adminToken);
    assert(updateClientRes.statusCode === 200 && updateClientRes.body.data.client.services.length === 1 && updateClientRes.body.data.client.services[0].id === testCsId1, "22. Client service update replaces assignments correctly");

    // 23. Duplicate service assignment is prevented
    const dupAssignClientRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "CTSUCC002",
      name: "Client Service Dup Test",
      pan: "ABCDE2222X",
      dob: "1995-01-01",
      client_type_id: testCtId1,
      service_ids: [testCsId1, testCsId1] // Passed twice
    }, adminToken);
    assert(dupAssignClientRes.statusCode === 201 && dupAssignClientRes.body.data.client.services.length === 1, "23. Duplicate service assignment is prevented");

    // 24. Invalid service ID rejected
    const invalidCsRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "CTSUCC003",
      name: "Invalid Service Client",
      pan: "ABCDE3333Y",
      dob: "1995-01-01",
      client_type_id: testCtId1,
      service_ids: [99999]
    }, adminToken);
    assert(invalidCsRes.statusCode === 400, "24. Invalid service ID rejected (400 Bad Request)");

    // 25. Inactive service cannot be assigned
    const inactiveCsAssignRes = await makeRequest("POST", "/api/clients", {
      ucc_no: "CTSUCC004",
      name: "Inactive Service Client",
      pan: "ABCDE4444Z",
      dob: "1995-01-01",
      client_type_id: testCtId1,
      service_ids: [inactiveCsId]
    }, adminToken);
    assert(inactiveCsAssignRes.statusCode === 400, "25. Inactive service cannot be assigned (400 Bad Request)");

    // 7. Used client type cannot be deleted
    const deleteUsedCtRes = await makeRequest("DELETE", `/api/admin/client-types/${testCtId1}`, null, adminToken);
    assert(deleteUsedCtRes.statusCode === 409 && deleteUsedCtRes.body.message.includes("currently assigned to clients"), "7. Used client type cannot be deleted (409 Conflict)");

    // 16. Used service cannot be deleted
    const deleteUsedCsRes = await makeRequest("DELETE", `/api/admin/client-services/${testCsId1}`, null, adminToken);
    assert(deleteUsedCsRes.statusCode === 409 && deleteUsedCsRes.body.message.includes("currently assigned to clients"), "16. Used service cannot be deleted (409 Conflict)");

    // 26. Existing clients retain their correct client type after migration
    const ctCheckRes = await pool.query(
      `SELECT c.id, c.client_type_id, ct.name AS client_type_name
       FROM clients c
       INNER JOIN client_types ct ON ct.id = c.client_type_id
       WHERE c.id = $1`,
      [testClientId1]
    );
    assert(ctCheckRes.rows.length === 1 && ctCheckRes.rows[0].client_type_name === "CTSTest Type1", "26. Existing clients retain their correct client type after migration");

    // Cleanup test data
    await pool.query("DELETE FROM clients WHERE ucc_no LIKE 'CTSUCC%'");
    await pool.query("DELETE FROM users WHERE email LIKE '%@ctstest.com'");
    await pool.query("DELETE FROM client_types WHERE name LIKE 'CTSTest%'");
    await pool.query("DELETE FROM client_services WHERE name LIKE 'CSTest%'");
    console.log("\nClient Types & Services Test Suite cleanup completed.");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await pool.end();
    console.log("\n=======================================================");
    console.log(`  Client Types & Services Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
