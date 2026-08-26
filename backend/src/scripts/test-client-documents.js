require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
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

function makeMultipartRequest(method, pathUrl, documentType, documentName, fileName, fileBuffer, mimeType, token = null) {
  return new Promise((resolve, reject) => {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const url = new URL(pathUrl, baseUrl);

    let bodyParts = [];

    if (documentType !== null && documentType !== undefined) {
      bodyParts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="document_type"\r\n\r\n${documentType}\r\n`
      ));
    }

    if (documentName !== null && documentName !== undefined) {
      bodyParts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="document_name"\r\n\r\n${documentName}\r\n`
      ));
    }

    if (fileName && fileBuffer) {
      bodyParts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      ));
      bodyParts.push(fileBuffer);
      bodyParts.push(Buffer.from("\r\n"));
    }

    bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(bodyParts);

    const headers = {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": fullBody.length,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(data);
        try {
          const parsed = JSON.parse(raw.toString("utf8"));
          resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers, raw });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: raw.toString("utf8"), headers: res.headers, raw });
        }
      });
    });

    req.on("error", reject);
    req.write(fullBody);
    req.end();
  });
}

function makeJsonRequest(method, pathUrl, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
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
      let data = [];
      res.on("data", (chunk) => data.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(data);
        try {
          const parsed = JSON.parse(raw.toString("utf8"));
          resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers, raw });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: raw.toString("utf8"), headers: res.headers, raw });
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
  console.log("  CRM Client Document Management Backend Test Suite    ");
  console.log("=======================================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  try {
    const rolesRes = await pool.query("SELECT id, name FROM roles");
    const adminRole = rolesRes.rows.find((r) => r.name === "Admin");
    const staffRole = rolesRes.rows.find((r) => r.name === "Staff");

    await pool.query("DELETE FROM clients WHERE ucc_no LIKE 'DOCUCC%'");
    await pool.query("DELETE FROM users WHERE email LIKE '%@doctest.com'");

    const adminUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
      ["Admin Doc Test", "admin@doctest.com", "$2b$10$abcdefghijklmnopqrstuu", adminRole.id]
    );
    const adminUser = adminUserRes.rows[0];

    const staffUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
      ["Staff Doc Test", "staff@doctest.com", "$2b$10$abcdefghijklmnopqrstuu", staffRole.id]
    );
    const staffUser = staffUserRes.rows[0];

    const restrictedRoleRes = await pool.query(
      `INSERT INTO roles (name, description) VALUES ('Restricted Doc Staff', 'No update/delete') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`
    );
    const restrictedRoleId = restrictedRoleRes.rows[0].id;

    const restrictedStaffRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
      ["Restricted Doc Staff", "restricted_doc@doctest.com", "$2b$10$abcdefghijklmnopqrstuu", restrictedRoleId]
    );
    const restrictedUser = restrictedStaffRes.rows[0];

    // Assign permissions
    const permsRes = await pool.query("SELECT id, permission_key FROM permissions");
    for (const p of permsRes.rows) {
      await pool.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [adminRole.id, p.id]);
    }

    const docPermKeys = ["client.view", "document.view", "document.create", "document.edit", "document.update", "document.verify", "document.delete"];
    for (const p of permsRes.rows) {
      if (docPermKeys.includes(p.permission_key)) {
        await pool.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [staffRole.id, p.id]);
      }
    }

    for (const p of permsRes.rows) {
      if (["client.view", "document.view", "document.create"].includes(p.permission_key)) {
        await pool.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [restrictedRoleId, p.id]);
      }
    }

    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "antigravity_jwt_secret_key_2026_crm";
    const adminToken = jwt.sign({ id: adminUser.id, role_id: adminRole.id, role_name: "Admin" }, secret, { expiresIn: "1h" });
    const staffToken = jwt.sign({ id: staffUser.id, role_id: staffRole.id, role_name: "Staff" }, secret, { expiresIn: "1h" });
    const restrictedToken = jwt.sign({ id: restrictedUser.id, role_id: restrictedRoleId, role_name: "Restricted Staff" }, secret, { expiresIn: "1h" });

    // Seed Clients
    const ctRes = await pool.query("SELECT id FROM client_types LIMIT 1");
    const clientTypeId = ctRes.rows[0].id;

    const c1Res = await pool.query(
      `INSERT INTO clients (ucc_no, name, client_type_id, status) VALUES ($1, $2, $3, 'active') RETURNING id`,
      ["DOCUCC001", "Client Alpha", clientTypeId]
    );
    const client1Id = c1Res.rows[0].id;

    const c2Res = await pool.query(
      `INSERT INTO clients (ucc_no, name, client_type_id, status) VALUES ($1, $2, $3, 'active') RETURNING id`,
      ["DOCUCC002", "Client Beta", clientTypeId]
    );
    const client2Id = c2Res.rows[0].id;

    // Headers with Magic Bytes
    const pdfHeader = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Title (Test Document) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");
    const pdfHeader2 = Buffer.from("%PDF-1.4\n2 0 obj\n<< /Title (Updated Document) >>\nendobj\ntrailer\n<< /Root 2 0 R >>\n%%EOF\n");
    const jpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fakeTextBuffer = Buffer.from("THIS IS PLAIN TEXT NOT ALLOWED");

    console.log("--- 1. Upload & Validation Tests ---");

    // 1. Admin can upload
    const uploadRes1 = await makeMultipartRequest(
      "POST",
      `/api/clients/${client1Id}/documents`,
      "PAN",
      null,
      "pan_card.pdf",
      pdfHeader,
      "application/pdf",
      adminToken
    );
    assert(uploadRes1.statusCode === 201 && uploadRes1.body.data.document.id > 0, "1. Admin can upload document (201 Created)");
    const doc1Id = uploadRes1.body.data.document.id;

    // 2. Staff with document.create can upload
    const uploadRes2 = await makeMultipartRequest(
      "POST",
      `/api/clients/${client1Id}/documents`,
      "AADHAAR",
      null,
      "aadhaar.jpg",
      jpgHeader,
      "image/jpeg",
      staffToken
    );
    assert(uploadRes2.statusCode === 201 && uploadRes2.body.data.document.id > 0, "2. Staff with document.create can upload (201 Created)");
    const doc2Id = uploadRes2.body.data.document.id;

    // 3. Unauthorized user cannot upload
    const unauthUploadRes = await makeMultipartRequest(
      "POST",
      `/api/clients/${client1Id}/documents`,
      "PAN",
      null,
      "pan.pdf",
      pdfHeader,
      "application/pdf"
    );
    assert(unauthUploadRes.statusCode === 401, "3. Unauthorized user cannot upload (401 Unauthorized)");

    // 4. OTHER document type validation (empty document_name rejected)
    const otherEmptyRes = await makeMultipartRequest(
      "POST",
      `/api/clients/${client1Id}/documents`,
      "OTHER",
      "",
      "property.pdf",
      pdfHeader,
      "application/pdf",
      adminToken
    );
    assert(otherEmptyRes.statusCode === 400 && otherEmptyRes.body.message.includes("Document name is required"), "4. OTHER document type with empty document_name rejected (400 Bad Request)");

    // 5. OTHER document type with custom document_name succeeds
    const otherValidRes = await makeMultipartRequest(
      "POST",
      `/api/clients/${client1Id}/documents`,
      "OTHER",
      "Property Agreement",
      "property_deed.pdf",
      pdfHeader,
      "application/pdf",
      adminToken
    );
    assert(otherValidRes.statusCode === 201 && otherValidRes.body.data.document.document_name === "Property Agreement", "5. OTHER document type with custom document_name succeeds");
    const otherDocId = otherValidRes.body.data.document.id;

    console.log("\n--- 2. Document Replacement & Permission Tests ---");

    // 6. User without document.update permission cannot replace
    const unauthReplaceRes = await makeMultipartRequest(
      "PATCH",
      `/api/clients/${client1Id}/documents/${doc1Id}/replace`,
      "PAN",
      null,
      "new_pan.pdf",
      pdfHeader2,
      "application/pdf",
      restrictedToken
    );
    assert(unauthReplaceRes.statusCode === 403, "6. User without document.update permission receives 403 Forbidden");

    // 7. User with document.update can replace PENDING document
    const replacePendingRes = await makeMultipartRequest(
      "PATCH",
      `/api/clients/${client1Id}/documents/${doc1Id}/replace`,
      "PAN",
      null,
      "updated_pan.pdf",
      pdfHeader2,
      "application/pdf",
      staffToken
    );
    assert(replacePendingRes.statusCode === 200 && replacePendingRes.body.data.document.status === "PENDING", "7. User with document.update can replace PENDING document");

    // 8. Approve document -> VERIFIED
    const approveRes1 = await makeJsonRequest("PATCH", `/api/admin/documents/${doc1Id}/approve`, null, adminToken);
    assert(approveRes1.statusCode === 200 && approveRes1.body.data.document.status === "VERIFIED", "8. Document approved -> status VERIFIED");

    // 9. Replace VERIFIED document resets status to PENDING
    const replaceVerifiedRes = await makeMultipartRequest(
      "PATCH",
      `/api/clients/${client1Id}/documents/${doc1Id}/replace`,
      "PAN",
      null,
      "v3_pan.pdf",
      pdfHeader2,
      "application/pdf",
      staffToken
    );
    assert(replaceVerifiedRes.statusCode === 200 && replaceVerifiedRes.body.data.document.status === "PENDING", "9. Replace VERIFIED document resets status to PENDING");

    // 10. Reject PENDING document -> REJECTED
    const rejectRes1 = await makeJsonRequest("PATCH", `/api/admin/documents/${doc2Id}/reject`, { rejection_reason: "Blurry file" }, adminToken);
    assert(rejectRes1.statusCode === 200 && rejectRes1.body.data.document.status === "REJECTED", "10. Document rejected -> status REJECTED");

    // 11. Replace REJECTED document resets status to PENDING and clears rejection reason
    const replaceRejectedRes = await makeMultipartRequest(
      "PATCH",
      `/api/clients/${client1Id}/documents/${doc2Id}/replace`,
      "AADHAAR",
      null,
      "new_aadhaar.jpg",
      jpgHeader,
      "image/jpeg",
      staffToken
    );
    assert(replaceRejectedRes.statusCode === 200 && replaceRejectedRes.body.data.document.status === "PENDING", "11. Replace REJECTED document resets status to PENDING");

    // 12. Client isolation on replacement (cannot replace doc using wrong client ID)
    const crossClientReplaceRes = await makeMultipartRequest(
      "PATCH",
      `/api/clients/${client2Id}/documents/${doc1Id}/replace`,
      "PAN",
      null,
      "hack.pdf",
      pdfHeader2,
      "application/pdf",
      adminToken
    );
    assert(crossClientReplaceRes.statusCode === 403, "12. Replacing document for wrong client ID rejected (403 Forbidden)");

    console.log("\n--- 3. Listing & Display Tests ---");

    // 13. List client documents returns custom document_name
    const clientListRes = await makeJsonRequest("GET", `/api/clients/${client1Id}/documents`, null, adminToken);
    const retrievedOtherDoc = clientListRes.body.data.documents.find((d) => d.id === otherDocId);
    assert(retrievedOtherDoc && retrievedOtherDoc.document_name === "Property Agreement", "13. List documents returns custom document_name for OTHER document");

    // 14. Admin list documents returns custom document_name
    const adminListRes = await makeJsonRequest("GET", "/api/admin/documents", null, adminToken);
    const adminOtherDoc = adminListRes.body.data.documents.find((d) => d.id === otherDocId);
    assert(adminOtherDoc && adminOtherDoc.document_name === "Property Agreement", "14. Admin list documents returns custom document_name for OTHER document");

    // Clean up test records
    await pool.query("DELETE FROM clients WHERE ucc_no LIKE 'DOCUCC%'");
    await pool.query("DELETE FROM users WHERE email LIKE '%@doctest.com'");
    await pool.query("DELETE FROM roles WHERE name = 'Restricted Doc Staff'");
    console.log("\nClient Document Management Backend Test Suite cleanup completed.");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await pool.end();
    console.log("\n=======================================================");
    console.log(`  Document Management Backend Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
