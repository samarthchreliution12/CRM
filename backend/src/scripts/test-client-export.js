require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const pool = require("../config/database");
const app = require("../app");

let server;
let baseUrl;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      req.write(typeof postData === "object" ? JSON.stringify(postData) : postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  CRM Client Export API Backend Test Suite            ");
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

  try {
    // Start temporary test server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    const port = server.address().port;

    // 1. Setup Test Users & Clients in DB
    const adminRes = await pool.query("SELECT id, email FROM users WHERE email = 'admin@example.com' OR role_id = (SELECT id FROM roles WHERE name = 'Admin') LIMIT 1");
    let adminUser = adminRes.rows[0];

    if (!adminUser) {
      const adminRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'Admin'");
      const adminRoleId = adminRoleRes.rows[0].id;
      const newAdmin = await pool.query(
        "INSERT INTO users (name, email, password_hash, role_id, status) VALUES ('Export Admin', 'export_admin@example.com', 'hash', $1, 'active') RETURNING id, email",
        [adminRoleId]
      );
      adminUser = newAdmin.rows[0];
    }

    const adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email }, config.jwtSecret, { expiresIn: "1h" });

    // Create a staff user WITH client.view permission
    const staffRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'Staff'");
    const staffRoleId = staffRoleRes.rows[0].id;
    const authStaff = await pool.query(
      "INSERT INTO users (name, email, password_hash, role_id, status) VALUES ('Auth Staff Export', 'auth_staff_export@example.com', 'hash', $1, 'active') RETURNING id, email",
      [staffRoleId]
    );
    const authStaffToken = jwt.sign({ id: authStaff.rows[0].id, email: authStaff.rows[0].email }, config.jwtSecret, { expiresIn: "1h" });

    // Create a role without client.view permission
    const noPermRoleRes = await pool.query(
      "INSERT INTO roles (name, description, status) VALUES ('No Client Access Role', 'Role with no permissions', 'active') RETURNING id"
    );
    const noPermRoleId = noPermRoleRes.rows[0].id;
    const noPermUser = await pool.query(
      "INSERT INTO users (name, email, password_hash, role_id, status) VALUES ('No Perm User Export', 'noperm_export@example.com', 'hash', $1, 'active') RETURNING id, email",
      [noPermRoleId]
    );
    const noPermToken = jwt.sign({ id: noPermUser.rows[0].id, email: noPermUser.rows[0].email }, config.jwtSecret, { expiresIn: "1h" });

    // Create test clients
    const typeRes = await pool.query("SELECT id FROM client_types LIMIT 1");
    const typeId = typeRes.rows[0].id;

    const testClient1 = await pool.query(
      `INSERT INTO clients (ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation, client_type_id, status)
       VALUES ('UCCEXP001', 'Alpha Export', 'Alpha Corp', '9876543210', '9876543210', 'alpha@export.com', 'ABCDE1234F', '1990-01-01', 'Male', 'Business', $1, 'active')
       RETURNING id`,
      [typeId]
    );
    const client1Id = testClient1.rows[0].id;

    const testClient2 = await pool.query(
      `INSERT INTO clients (ucc_no, name, business_name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation, client_type_id, status)
       VALUES ('UCCEXP002', 'Beta Export', 'Beta Ltd', '9876543211', '9876543211', 'beta@export.com', 'BCDEF2345G', '1992-05-15', 'Female', 'Professional', $1, 'inactive')
       RETURNING id`,
      [typeId]
    );
    const client2Id = testClient2.rows[0].id;

    // --- TEST 1: Admin Exports All Clients ---
    console.log("--- 1. Admin Exports All Clients ---");
    const res1 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { format: "csv" }
    );

    assert(res1.statusCode === 200, "Admin export returned 200 OK");
    assert(res1.headers["content-type"] && res1.headers["content-type"].includes("text/csv"), "Content-Type is text/csv");
    assert(res1.headers["content-disposition"] && res1.headers["content-disposition"].includes("attachment; filename=\"clients-export-"), "Content-Disposition attachment filename set correctly");
    assert(res1.body.includes("Client ID") && res1.body.includes("Alpha Export") && res1.body.includes("Beta Export"), "CSV body contains headers and exported clients");

    // --- TEST 2: Authorized Staff Exports Accessible Clients ---
    console.log("\n--- 2. Authorized Staff Exports Clients ---");
    const res2 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authStaffToken}`,
        },
      },
      { format: "csv" }
    );
    assert(res2.statusCode === 200, "Authorized staff export returned 200 OK");
    assert(res2.body.includes("Alpha Export"), "Authorized staff receives exported CSV content");

    // --- TEST 3: User Without client.view Permission Gets 403 Forbidden ---
    console.log("\n--- 3. Unauthorized User Permission Check ---");
    const res3 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${noPermToken}`,
        },
      },
      { format: "csv" }
    );
    assert(res3.statusCode === 403, "User without client.view permission blocked with 403 Forbidden");

    // --- TEST 4: Export Selected Clients (client_ids) ---
    console.log("\n--- 4. Export Selected Clients ---");
    const res4 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { client_ids: [client1Id], format: "csv" }
    );
    assert(res4.statusCode === 200, "Export selected clients returned 200 OK");
    assert(res4.body.includes("Alpha Export"), "Selected client 1 is included in CSV");
    assert(!res4.body.includes("Beta Export"), "Unselected client 2 is excluded from CSV");

    // --- TEST 5: Export Using Search and Filters ---
    console.log("\n--- 5. Export Using Search & Filters ---");
    const res5 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        filters: {
          search: "Beta",
          status: "inactive",
        },
        format: "csv",
      }
    );
    assert(res5.statusCode === 200, "Export with search filter returned 200 OK");
    assert(res5.body.includes("Beta Export"), "Filtered result contains Beta Export");
    assert(!res5.body.includes("Alpha Export"), "Non-matching Alpha Export filtered out");

    // --- TEST 6: Priority of client_ids Over Filters ---
    console.log("\n--- 6. Priority of client_ids Over Filters ---");
    const res6 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        client_ids: [client1Id],
        filters: {
          search: "Beta",
        },
        format: "csv",
      }
    );
    assert(res6.statusCode === 200, "Export with both client_ids and filters returned 200 OK");
    assert(res6.body.includes("Alpha Export"), "client_ids took priority over filter");
    assert(!res6.body.includes("Beta Export"), "Filtered term 'Beta' ignored due to client_ids priority");

    // --- TEST 7: Invalid Export Format Validation ---
    console.log("\n--- 7. Invalid Export Format Handling ---");
    const res7 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { format: "pdf" }
    );
    assert(res7.statusCode === 400, "Invalid export format 'pdf' returned 400 Bad Request");

    // --- TEST 8: Empty Result Set Handling ---
    console.log("\n--- 8. Empty Result Set Handling ---");
    const res8 = await makeRequest(
      {
        hostname: "localhost",
        port,
        path: "/api/clients/export",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        filters: {
          search: "NonExistentClientName999999",
        },
      }
    );
    assert(res8.statusCode === 404, "Empty search result returned 404 Not Found");

    // Cleanup test records
    await pool.query("DELETE FROM clients WHERE id IN ($1, $2)", [client1Id, client2Id]);
    await pool.query("DELETE FROM users WHERE email IN ('auth_staff_export@example.com', 'noperm_export@example.com')");
    await pool.query("DELETE FROM roles WHERE id = $1", [noPermRoleId]);

  } catch (err) {
    console.error("Test execution failed:", err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();

    console.log("\n=======================================================");
    console.log(`  Client Export Backend Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================\n");

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
