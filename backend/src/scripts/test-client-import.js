require("dotenv").config();
const http = require("http");
const pool = require("../config/database");
const runMigrations = require("./migrate");
const seedDatabase = require("./seed");
const app = require("../app");
const assert = require("assert");

function request(method, path, body = null, token = null, isFormData = false, filename = "import.csv") {
  return new Promise((resolve, reject) => {
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    let postData = "";

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (isFormData && body && typeof body === "string") {
      headers["Content-Type"] = `multipart/form-data; boundary=${boundary}`;
      postData = `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: text/csv\r\n\r\n` +
        `${body}\r\n` +
        `--${boundary}--\r\n`;
      headers["Content-Length"] = Buffer.byteLength(postData);
    } else if (body) {
      headers["Content-Type"] = "application/json";
      postData = JSON.stringify(body);
      headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: "localhost",
        port: 5099,
        path,
        method,
        headers,
      },
      (res) => {
        let resData = "";
        res.on("data", (chunk) => (resData += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(resData);
          } catch (e) {
            parsed = resData;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  CRM Client Import Feature Backend Test Suite");
  console.log("=======================================================\n");

  await runMigrations();
  await seedDatabase();

  const server = app.listen(5099);
  console.log("Test server running on port 5099");

  const timeHash = Date.now().toString().slice(-6);
  const adminEmail = `importadmin_${timeHash}@crm.test`;
  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash("TestPass123!", 10);

  try {
    const adminRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'Admin'");
    const adminRoleId = adminRoleRes.rows[0].id;

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status) VALUES ('Import Admin', $1, $2, $3, 'active')`,
      [adminEmail, hash, adminRoleId]
    );

    const loginRes = await request("POST", "/api/auth/login", {
      email: adminEmail,
      password: "TestPass123!",
    });
    assert(loginRes.status === 200, "Admin login returned 200 OK");
    const adminToken = loginRes.body.data.token;

    console.log("--- 1. CSV Import Validation API ---");
    const csvContent = [
      "ucc_no,name,mobile_no,email,pan,dob,client_type,services,status",
      `IMP${timeHash}1,Valid Client 1,9876543210,valid1_${timeHash}@test.com,ABCDE1234F,1990-05-15,Individual,Demat|Trading,active`,
      `IMP${timeHash}2,Valid Client 2,9876543211,valid2_${timeHash}@test.com,ABCDE5678G,1988-10-20,Company,Mutual Fund,active`,
      `IMP${timeHash}1,Duplicate In CSV,9876543212,dup_${timeHash}@test.com,ABCDE9999Z,1992-01-01,Individual,Demat,active`,
      `IMP${timeHash}3,Invalid PAN Client,9876543213,invalidpan_${timeHash}@test.com,INVALIDPAN,1995-03-03,Individual,Demat,active`,
      `IMP${timeHash}4,Invalid Type Client,9876543214,invalidtype_${timeHash}@test.com,ABCDE8888X,1996-04-04,NonExistentType,Demat,active`,
    ].join("\n");

    const validateRes = await request("POST", "/api/clients/import/validate", csvContent, adminToken, true);
    assert(validateRes.status === 200, `Validate import returned 200 OK (got ${validateRes.status})`);
    assert(validateRes.body.data.summary.total_rows === 5, "Total rows identified is 5");
    assert(validateRes.body.data.summary.valid_rows === 2, "Valid rows count is 2");
    assert(validateRes.body.data.summary.duplicate_rows === 1, "Duplicate rows count is 1");
    assert(validateRes.body.data.summary.invalid_rows === 2, "Invalid rows count is 2");
    assert(validateRes.body.data.errors.length === 3, "Errors list length is 3");
    console.log("✅ PASS: CSV Validation correctly identifies valid, duplicate, and invalid rows");

    console.log("\n--- 2. Execute Client Import API ---");
    const importRes = await request("POST", "/api/clients/import", csvContent, adminToken, true);
    assert(importRes.status === 200, `Execute import returned 200 OK (got ${importRes.status})`);
    assert(importRes.body.data.imported_rows === 2, "Imported rows count is 2");
    assert(importRes.body.data.skipped_rows === 3, "Skipped rows count is 3");
    console.log("✅ PASS: Import executes transaction and imports only valid rows");

    console.log("\n--- 3. Database Verification ---");
    const dbClient1 = await pool.query("SELECT * FROM clients WHERE ucc_no = $1", [`IMP${timeHash}1`]);
    assert(dbClient1.rows.length === 1, "Valid Client 1 inserted in database");
    assert(dbClient1.rows[0].pan === "ABCDE1234F", "Client 1 PAN matches");

    const dbClient2 = await pool.query("SELECT * FROM clients WHERE ucc_no = $1", [`IMP${timeHash}2`]);
    assert(dbClient2.rows.length === 1, "Valid Client 2 inserted in database");

    // Check service assignments
    const csaRes = await pool.query(
      "SELECT csa.*, cs.name FROM client_service_assignments csa JOIN client_services cs ON cs.id = csa.service_id WHERE csa.client_id = $1",
      [dbClient1.rows[0].id]
    );
    assert(csaRes.rows.length === 2, "Client 1 has 2 assigned services (Demat and Trading)");
    console.log("✅ PASS: Clients and service assignments created correctly in database");

    console.log("\n--- 4. Existing DB Duplicate UCC Protection ---");
    const dupDbCsv = [
      "ucc_no,name,mobile_no,email,pan,dob,client_type,services,status",
      `IMP${timeHash}1,Existing DB UCC,9876543299,existing_${timeHash}@test.com,ABCDE7777Y,1991-01-01,Individual,Demat,active`,
    ].join("\n");

    const dupValidateRes = await request("POST", "/api/clients/import/validate", dupDbCsv, adminToken, true);
    assert(dupValidateRes.status === 200, "Validate duplicate UCC returned 200 OK");
    assert(dupValidateRes.body.data.summary.duplicate_rows === 1, "Duplicate UCC in database flagged");
    assert(dupValidateRes.body.data.errors[0].error.includes("already exists in database"), "Error specifies existing DB UCC");
    console.log("✅ PASS: Existing DB UCC numbers are detected and flagged as duplicate");

    console.log("\n--- 5. Audit Log Entry Verification ---");
    const auditRes = await pool.query("SELECT * FROM audit_logs WHERE action = 'IMPORT' AND module = 'CLIENTS' ORDER BY id DESC LIMIT 1");
    assert(auditRes.rows.length === 1, "Audit log entry created for client import");
    assert(auditRes.rows[0].new_values.imported_rows === 2, "Audit log records correct imported count");
    console.log("✅ PASS: Audit log automatically recorded for client import action");

    console.log("\n=======================================================");
    console.log("  Client Import Backend Tests: All 5/5 Passed");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  } finally {
    server.close();
    await pool.end();
  }
}

runTests();
