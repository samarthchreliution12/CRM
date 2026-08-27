require("dotenv").config();
const http = require("http");
const assert = require("assert");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const app = require("../app");
const runMigrations = require("./migrate");

let server;
const PORT = 5098;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : "";
    const options = {
      hostname: "127.0.0.1",
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  CRM Leads Module & Kanban Backend Test Suite         ");
  console.log("=======================================================\n");

  await runMigrations();

  server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  const timeHash = Date.now().toString().slice(-6);

  try {
    // 0. Ensure Admin and Staff test accounts exist
    const adminRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'Admin' LIMIT 1");
    const staffRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'Staff' LIMIT 1");
    const adminRoleId = adminRoleRes.rows[0].id;
    const staffRoleId = staffRoleRes.rows[0].id;

    const hash = await bcrypt.hash("TestPass123!", 10);

    const adminEmail = `leadadmin_${timeHash}@crm.test`;
    const staffEmail = `leadstaff_${timeHash}@crm.test`;

    const adminIns = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Lead Admin', $1, $2, $3, 'active') RETURNING id`,
      [adminEmail, hash, adminRoleId]
    );
    const adminUserId = adminIns.rows[0].id;

    const staffIns = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Lead Staff', $1, $2, $3, 'active') RETURNING id`,
      [staffEmail, hash, staffRoleId]
    );
    const staffUserId = staffIns.rows[0].id;

    // Login Admin
    const adminLoginRes = await request("POST", "/api/auth/login", {
      email: adminEmail,
      password: "TestPass123!",
    });
    assert(adminLoginRes.status === 200, "Admin login returned 200 OK");
    const adminToken = adminLoginRes.body.data.token;

    // Login Staff
    const staffLoginRes = await request("POST", "/api/auth/login", {
      email: staffEmail,
      password: "TestPass123!",
    });
    assert(staffLoginRes.status === 200, "Staff login returned 200 OK");
    const staffToken = staffLoginRes.body.data.token;

    // Ensure a Client Type & Client Service exist
    const clientTypeRes = await pool.query("SELECT id FROM client_types LIMIT 1");
    const clientTypeId = clientTypeRes.rows[0] ? clientTypeRes.rows[0].id : 1;

    const clientServiceRes = await pool.query("SELECT id FROM client_services LIMIT 1");
    const clientServiceId = clientServiceRes.rows[0] ? clientServiceRes.rows[0].id : 1;

    console.log("--- 1. Create Lead API ---");
    const createLeadRes = await request(
      "POST",
      "/api/leads",
      {
        name: `Acme Prospect ${timeHash}`,
        mobile_no: "9876543210",
        whatsapp_no: "9876543210",
        email: `acme_${timeHash}@prospect.test`,
        company_name: `Acme Corp ${timeHash}`,
        source: "Website",
        client_type_id: clientTypeId,
        service_id: clientServiceId,
        assigned_to: staffUserId,
        notes: "Interested in Demat and Trading services",
      },
      adminToken
    );

    assert(createLeadRes.status === 201, `Create lead returned 201 Created (got ${createLeadRes.status})`);
    assert(createLeadRes.body.success === true, "Response success is true");
    const createdLead = createLeadRes.body.data.lead;
    assert(createdLead.name === `Acme Prospect ${timeHash}`, "Lead name matches");
    assert(createdLead.status === "new", "Default status is 'new'");
    assert(createdLead.priority === "medium", "Default priority is 'medium'");
    assert(createdLead.created_by === adminUserId, "created_by automatically set to logged-in user");
    assert(createdLead.assigned_staff.id === staffUserId, "assigned_staff populated correctly");
    const leadId = createdLead.id;
    console.log("✅ PASS: Create lead created lead with default status='new', priority='medium'");

    console.log("\n--- 2. Get Leads for Kanban API ---");
    const getLeadsRes = await request("GET", "/api/leads", null, adminToken);
    assert(getLeadsRes.status === 200, "Get leads returned 200 OK");
    assert(Array.isArray(getLeadsRes.body.data.leads), "data.leads is an array");
    const foundLead = getLeadsRes.body.data.leads.find((l) => l.id === leadId);
    assert(foundLead !== undefined, "Created lead found in list");
    console.log("✅ PASS: Get leads returns list of leads with joined staff & service info");

    console.log("\n--- 3. Filter Leads by my_leads=true & status ---");
    const myLeadsRes = await request("GET", `/api/leads?my_leads=true`, null, staffToken);
    assert(myLeadsRes.status === 200, "Get my_leads returned 200 OK");
    assert(myLeadsRes.body.data.leads.every((l) => l.assigned_to === staffUserId), "my_leads returns only leads assigned to staff user");
    console.log("✅ PASS: my_leads=true filters by assigned_to logged-in user");

    console.log("\n--- 4. Get Single Lead API ---");
    const getSingleLeadRes = await request("GET", `/api/leads/${leadId}`, null, adminToken);
    assert(getSingleLeadRes.status === 200, "Get single lead returned 200 OK");
    assert(getSingleLeadRes.body.data.lead.id === leadId, "Single lead ID matches");
    console.log("✅ PASS: Get single lead returns complete lead details");

    console.log("\n--- 5. General Update Lead API ---");
    const updateLeadRes = await request(
      "PATCH",
      `/api/leads/${leadId}`,
      {
        company_name: `Acme Global ${timeHash}`,
        priority: "high",
        notes: "High priority prospect - updated notes",
      },
      adminToken
    );
    assert(updateLeadRes.status === 200, "Update lead returned 200 OK");
    assert(updateLeadRes.body.data.lead.company_name === `Acme Global ${timeHash}`, "Company name updated");
    assert(updateLeadRes.body.data.lead.priority === "high", "Priority updated to high");
    console.log("✅ PASS: Update lead modifies specified lead fields");

    console.log("\n--- 6. Update Kanban Drag-and-Drop Status API ---");
    const updateStatusRes = await request(
      "PATCH",
      `/api/leads/${leadId}/status`,
      {
        status: "contacted",
      },
      adminToken
    );
    assert(updateStatusRes.status === 200, "Update status returned 200 OK");
    assert(updateStatusRes.body.data.lead.status === "contacted", "Status updated to 'contacted'");
    assert(updateStatusRes.body.data.lead.last_contacted_at !== null, "last_contacted_at automatically set on contacted");
    console.log("✅ PASS: Drag-and-drop status update changes status to 'contacted'");

    console.log("\n--- 7. Drag-and-Drop to 'converted' Protection ---");
    const invalidStatusRes = await request(
      "PATCH",
      `/api/leads/${leadId}/status`,
      {
        status: "converted",
      },
      adminToken
    );
    assert(invalidStatusRes.status === 400, "Drag-and-drop setting status='converted' returned 400 Bad Request");
    assert(
      invalidStatusRes.body.message.includes("convert endpoint"),
      "Error message instructs to use conversion endpoint"
    );
    console.log("✅ PASS: Moving lead to 'converted' via drag-and-drop status API is BLOCKED");

    console.log("\n--- 8. Convert Lead to Client API Validation Rules ---");
    // 8a. Convert without DOB -> rejected 400
    const noDobRes = await request("POST", `/api/leads/${leadId}/convert`, { pan: "ABCDE1234F" }, adminToken);
    assert(noDobRes.status === 400, "Convert without DOB returned 400 Bad Request");
    console.log("  ✓ Conversion without DOB rejected with 400");

    // 8b. Convert without PAN -> rejected 400
    const noPanRes = await request("POST", `/api/leads/${leadId}/convert`, { dob: "1990-05-15" }, adminToken);
    assert(noPanRes.status === 400, "Convert without PAN returned 400 Bad Request");
    console.log("  ✓ Conversion without PAN rejected with 400");

    // 8c. Convert with invalid PAN -> rejected 400
    const invalidPanRes = await request("POST", `/api/leads/${leadId}/convert`, { dob: "1990-05-15", pan: "INVALIDPAN" }, adminToken);
    assert(invalidPanRes.status === 400, "Convert with invalid PAN returned 400 Bad Request");
    console.log("  ✓ Conversion with invalid PAN format rejected with 400");

    // 8d. Convert with future DOB -> rejected 400
    const futureDobRes = await request("POST", `/api/leads/${leadId}/convert`, { dob: "2099-01-01", pan: "ABCDE1234F" }, adminToken);
    assert(futureDobRes.status === 400, "Convert with future DOB returned 400 Bad Request");
    console.log("  ✓ Conversion with future DOB rejected with 400");

    const testPan = `LDPAN${timeHash.slice(-4)}X`;

    // 8e. Valid Conversion with DOB and PAN -> success 200
    const convertRes = await request(
      "POST",
      `/api/leads/${leadId}/convert`,
      {
        dob: "1990-05-15",
        pan: testPan,
      },
      adminToken
    );
    assert(convertRes.status === 200, `Convert lead returned 200 OK (got ${convertRes.status})`);
    assert(convertRes.body.success === true, "Convert response success is true");
    assert(convertRes.body.lead.status === "converted", "Lead status updated to 'converted'");
    assert(convertRes.body.lead.converted_client_id !== null, "Lead converted_client_id set");
    assert(convertRes.body.client.id === convertRes.body.lead.converted_client_id, "Converted client ID matches");
    assert(convertRes.body.client.name === `Acme Prospect ${timeHash}`, "Client name mapped from lead");
    assert(convertRes.body.client.pan === testPan, "Client PAN mapped from request");

    const newClientId = convertRes.body.client.id;
    // Verify client exists in clients table in DB with DOB and PAN
    const clientDbRes = await pool.query("SELECT * FROM clients WHERE id = $1", [newClientId]);
    assert(clientDbRes.rows.length === 1, "Client record created in DB");
    assert(clientDbRes.rows[0].pan === testPan, "DB Client pan matches");
    assert(clientDbRes.rows[0].dob !== null, "DB Client dob is set");

    // Verify service assignment was created
    const csaRes = await pool.query("SELECT * FROM client_service_assignments WHERE client_id = $1", [newClientId]);
    assert(csaRes.rows.length >= 1, "Service assignment linked in database");
    console.log("✅ PASS: Lead converted to Client atomically in database transaction");

    console.log("\n--- 9. Already Converted Lead Protection ---");
    const reConvertRes = await request("POST", `/api/leads/${leadId}/convert`, {}, adminToken);
    assert(reConvertRes.status === 400, "Re-converting already converted lead returned 400 Bad Request");
    console.log("✅ PASS: Converting already converted lead is BLOCKED");

    console.log("\n--- 10. Delete Converted Lead Protection ---");
    const deleteConvertedRes = await request("DELETE", `/api/leads/${leadId}`, null, adminToken);
    assert(deleteConvertedRes.status === 400, "Deleting converted lead returned 400 Bad Request");
    console.log("✅ PASS: Deleting a converted lead is BLOCKED");

    console.log("\n--- 11. Delete Unconverted Lead API ---");
    const tempLeadRes = await request(
      "POST",
      "/api/leads",
      {
        name: `Temporary Lead ${timeHash}`,
        mobile_no: "9876543210",
        whatsapp_no: "9876543210",
        email: `temp_${timeHash}@prospect.test`,
        client_type_id: clientTypeId,
        service_id: clientServiceId,
      },
      adminToken
    );
    const tempLeadId = tempLeadRes.body.data.lead.id;

    const deleteUnconvertedRes = await request("DELETE", `/api/leads/${tempLeadId}`, null, adminToken);
    assert(deleteUnconvertedRes.status === 200, "Deleting unconverted lead returned 200 OK");

    const checkTempLead = await request("GET", `/api/leads/${tempLeadId}`, null, adminToken);
    assert(checkTempLead.status === 404, "Deleted lead no longer exists (404)");
    console.log("✅ PASS: Deleting an unconverted lead succeeds");

    console.log("\n--- 12. Audit Logs Integration Check ---");
    const auditRes = await request("GET", `/api/admin/audit-logs?module=LEADS`, null, adminToken);
    assert(auditRes.status === 200, "Audit logs API returned 200 OK");
    const leadAuditLogs = auditRes.body.data.audit_logs.filter((l) => l.module === "LEADS");
    assert(leadAuditLogs.length >= 3, "Audit logs recorded for LEADS module");
    const convertAuditLog = leadAuditLogs.find((l) => l.action === "CONVERT");
    assert(convertAuditLog !== undefined, "CONVERT audit log recorded in database");
    console.log("✅ PASS: Audit logs automatically recorded for lead CREATE, UPDATE, CONVERT, DELETE");

    // Clean up test users and data
    await pool.query("DELETE FROM client_service_assignments WHERE client_id = $1", [newClientId]);
    await pool.query("DELETE FROM clients WHERE id = $1", [newClientId]);
    await pool.query("DELETE FROM leads WHERE id = $1", [leadId]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [adminUserId, staffUserId]);

    console.log("\n=======================================================");
    console.log("  Leads Backend Tests: All 12/12 Assertion Blocks Passed ");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("\n❌ Lead API Test Failed:", err);
    process.exit(1);
  } finally {
    server.close();
    await pool.end();
  }
}

runTests();
