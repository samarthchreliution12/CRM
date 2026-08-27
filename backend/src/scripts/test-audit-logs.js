require("dotenv").config();
const http = require("http");
const app = require("../app");
const pool = require("../config/database");

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function request(method, path, body = null, token = null) {
  const url = new URL(path, baseUrl);
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !(body instanceof Buffer) && typeof body === "object") {
    headers["Content-Type"] = "application/json";
  }

  const options = {
    method,
    headers,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on("error", reject);
    if (body) {
      if (typeof body === "string") req.write(body);
      else if (Buffer.isBuffer(body)) req.write(body);
      else req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  CRM Centralized Audit Logs Backend Test Suite        ");
  console.log("=======================================================\n");

  await startServer();

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
    // 0. Ensure Test Admin exists in database
    const bcrypt = require("bcryptjs");
    const adminRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'Admin' LIMIT 1");
    const adminRoleId = adminRoleRes.rows[0].id;
    const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 10);

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Audit Admin Test', 'auditadmin@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'`,
      [adminPasswordHash, adminRoleId]
    );

    // 1. Login as Admin
    const adminLoginRes = await request("POST", "/api/auth/login", {
      email: "auditadmin@crm.test",
      password: "AdminPassword123!",
    });
    assert(adminLoginRes.status === 200, "Admin login returned 200 OK");
    const adminToken = adminLoginRes.body.data.token;
    const adminUserId = adminLoginRes.body.data.user.id;

    // Verify LOGIN audit log was recorded
    const loginAuditRes = await request("GET", `/api/admin/audit-logs?action=LOGIN&user_id=${adminUserId}`, null, adminToken);
    assert(loginAuditRes.status === 200, "Fetch LOGIN audit log returned 200 OK");
    assert(
      loginAuditRes.body.data.audit_logs.some((l) => l.action === "LOGIN" && l.module === "AUTH"),
      "LOGIN audit log recorded in database with user_id and ip_address"
    );

    // 2. Create Client
    const timeHash = Date.now().toString().slice(-6);
    const clientTypeRes = await pool.query("SELECT id FROM client_types LIMIT 1");
    const clientTypeId = clientTypeRes.rows[0].id;

    const createClientRes = await request(
      "POST",
      "/api/clients",
      {
        ucc_no: `AUD${timeHash}`,
        name: "Audit Test Client",
        business_name: "Audit Corp",
        mobile_no: "9876500001",
        email: `auditclient_${timeHash}@example.com`,
        pan: "ABCDE1234F",
        dob: "1995-01-01",
        client_type_id: clientTypeId,
      },
      adminToken
    );
    assert(createClientRes.status === 201, "Create client returned 201 Created");
    const clientId = createClientRes.body.data.client.id;

    // Verify CREATE CLIENT audit log
    const createClientAuditRes = await request("GET", `/api/admin/audit-logs?module=CLIENTS&action=CREATE`, null, adminToken);
    const createLog = createClientAuditRes.body.data.audit_logs.find((l) => l.entity_id === clientId);
    assert(Boolean(createLog), "CREATE CLIENT audit log recorded with correct entity_id");
    assert(createLog.description.includes("Created client"), "CREATE CLIENT description is human-readable");

    // 3. Update Client (verify diff calculation)
    const updateClientRes = await request(
      "PATCH",
      `/api/clients/${clientId}`,
      {
        mobile_no: "9876500099",
      },
      adminToken
    );
    assert(updateClientRes.status === 200, `Update client returned 200 OK (got ${updateClientRes.status}: ${JSON.stringify(updateClientRes.body)})`);

    const updateClientAuditRes = await request("GET", `/api/admin/audit-logs?module=CLIENTS&action=UPDATE`, null, adminToken);
    const updateLog = updateClientAuditRes.body.data.audit_logs.find((l) => l.entity_id === clientId);
    assert(Boolean(updateLog), "UPDATE CLIENT audit log recorded");
    assert(
      updateLog.old_values && updateLog.old_values.mobile_no === "9876500001",
      "UPDATE CLIENT old_values captured changed mobile_no"
    );
    assert(
      updateLog.new_values && updateLog.new_values.mobile_no === "9876500099",
      "UPDATE CLIENT new_values captured updated mobile_no"
    );
    assert(!updateLog.old_values.name, "Unchanged fields (name) omitted from UPDATE diff");

    // 4. Export Clients
    const exportRes = await request(
      "POST",
      "/api/clients/export",
      {
        client_ids: [clientId],
        format: "csv",
      },
      adminToken
    );
    assert(exportRes.status === 200, "Export clients returned 200 OK");

    const exportAuditRes = await request("GET", `/api/admin/audit-logs?module=CLIENTS&action=EXPORT`, null, adminToken);
    assert(
      exportAuditRes.body.data.audit_logs.some((l) => l.action === "EXPORT"),
      "EXPORT CLIENTS audit log recorded"
    );

    // 5. Create Staff User
    const staffRoleRes = await pool.query("SELECT id FROM roles WHERE name = 'Staff' LIMIT 1");
    const staffRoleId = staffRoleRes.rows[0] ? staffRoleRes.rows[0].id : 2;

    const staffEmail = `staff_audit_${timeHash}@example.com`;
    const createStaffRes = await request(
      "POST",
      "/api/admin/staff",
      {
        name: "Audit Staff",
        email: staffEmail,
        password: "StaffPassword123!",
        role_id: staffRoleId,
      },
      adminToken
    );
    assert(createStaffRes.status === 201, "Create staff user returned 201 Created");
    const staffId = createStaffRes.body.data.staff.id;

    const userAuditRes = await request("GET", `/api/admin/audit-logs?module=USERS&action=CREATE`, null, adminToken);
    const userLog = userAuditRes.body.data.audit_logs.find((l) => l.entity_id === staffId);
    assert(Boolean(userLog), "CREATE USER audit log recorded");
    assert(
      !JSON.stringify(userLog.new_values || {}).includes("StaffPassword123!"),
      "Sensitive data (password) is NOT stored in audit log"
    );

    // Login as Staff User
    const staffLoginRes = await request("POST", "/api/auth/login", {
      email: staffEmail,
      password: "StaffPassword123!",
    });
    assert(staffLoginRes.status === 200, "Staff user login returned 200 OK");
    const staffToken = staffLoginRes.body.data.token;

    // 6. Test Audit Log Authorization (Staff user forbidden from accessing audit logs)
    const unauthorizedAuditRes = await request("GET", "/api/admin/audit-logs", null, staffToken);
    assert(unauthorizedAuditRes.status === 403, "Non-Admin staff user blocked from /api/admin/audit-logs (403 Forbidden)");

    // 7. Create Custom Group
    const createGroupRes = await request(
      "POST",
      "/api/roles/groups",
      {
        name: `AuditGroup_${timeHash}`,
        description: "Group for audit test",
      },
      adminToken
    );
    assert(createGroupRes.status === 201, "Create group returned 201 Created");
    const groupId = createGroupRes.body.data.group.id;

    const groupAuditRes = await request("GET", `/api/admin/audit-logs?module=GROUPS&action=CREATE`, null, adminToken);
    assert(
      groupAuditRes.body.data.audit_logs.some((l) => l.entity_id === groupId),
      "CREATE GROUP audit log recorded"
    );

    // 8. Add User to Group
    const addGroupMemberRes = await request(
      "POST",
      `/api/roles/groups/${groupId}/members`,
      {
        userIds: [staffId],
      },
      adminToken
    );
    assert(addGroupMemberRes.status === 200, "Add user to group returned 200 OK");

    const addMemberAuditRes = await request("GET", `/api/admin/audit-logs?module=GROUPS&action=ADD_MEMBERS`, null, adminToken);
    assert(
      addMemberAuditRes.body.data.audit_logs.some((l) => l.entity_id === groupId),
      "ADD USER TO GROUP audit log recorded"
    );

    // 9. Update Group Permissions
    const permRes = await pool.query("SELECT id FROM permissions LIMIT 2");
    const permIds = permRes.rows.map((r) => r.id);

    const updateGroupPermRes = await request(
      "PUT",
      `/api/roles/groups/${groupId}/permissions`,
      {
        permission_ids: permIds,
      },
      adminToken
    );
    assert(updateGroupPermRes.status === 200, "Update permissions returned 200 OK");

    const permAuditRes = await request("GET", `/api/admin/audit-logs?module=PERMISSIONS&action=UPDATE`, null, adminToken);
    assert(
      permAuditRes.body.data.audit_logs.some((l) => l.entity_id === groupId),
      "UPDATE PERMISSIONS audit log recorded"
    );

    // 10. Remove User from Group
    const removeGroupMemberRes = await request(
      "DELETE",
      `/api/roles/groups/${groupId}/members/${staffId}`,
      null,
      adminToken
    );
    assert(removeGroupMemberRes.status === 200, "Remove user from group returned 200 OK");

    // 11. Delete Group
    const deleteGroupRes = await request("DELETE", `/api/roles/groups/${groupId}`, null, adminToken);
    assert(deleteGroupRes.status === 200, "Delete group returned 200 OK");

    const deleteGroupAuditRes = await request("GET", `/api/admin/audit-logs?module=GROUPS&action=DELETE`, null, adminToken);
    assert(
      deleteGroupAuditRes.body.data.audit_logs.some((l) => l.entity_id === groupId),
      "DELETE GROUP audit log recorded"
    );

    // 12. Communication - Create Channel
    const createChannelRes = await request(
      "POST",
      "/api/communication/channels",
      {
        name: `AuditChan_${timeHash}`,
      },
      adminToken
    );
    assert(createChannelRes.status === 201, `Create channel returned 201 Created (got ${createChannelRes.status}: ${JSON.stringify(createChannelRes.body)})`);
    const channelId = createChannelRes.body.data ? createChannelRes.body.data.id || createChannelRes.body.data.channel?.id : null;

    const channelAuditRes = await request("GET", `/api/admin/audit-logs?module=COMMUNICATION&action=CREATE`, null, adminToken);
    assert(
      channelAuditRes.body.data.audit_logs.some((l) => l.entity_id === channelId),
      "CREATE CHANNEL audit log recorded"
    );

    // 13. Add Channel Member
    const addChanMemberRes = await request(
      "POST",
      `/api/communication/conversations/${channelId}/members`,
      {
        userIds: [staffId],
      },
      adminToken
    );
    assert(addChanMemberRes.status === 200, "Add channel member returned 200 OK");

    // 14. Remove Channel Member
    const removeChanMemberRes = await request(
      "DELETE",
      `/api/communication/conversations/${channelId}/members/${staffId}`,
      null,
      adminToken
    );
    assert(removeChanMemberRes.status === 200, "Remove channel member returned 200 OK");

    // 15. Delete Channel
    const deleteChanRes = await request("DELETE", `/api/communication/channels/${channelId}`, null, adminToken);
    assert(deleteChanRes.status === 200, "Delete channel returned 200 OK");

    const deleteChanAuditRes = await request("GET", `/api/admin/audit-logs?module=COMMUNICATION&action=DELETE`, null, adminToken);
    assert(
      deleteChanAuditRes.body.data.audit_logs.some((l) => l.entity_id === channelId),
      "DELETE CHANNEL audit log recorded"
    );

    // 16. Delete Client
    const deleteClientRes = await request("DELETE", `/api/clients/${clientId}`, null, adminToken);
    assert(deleteClientRes.status === 200, "Delete client returned 200 OK");

    const deleteClientAuditRes = await request("GET", `/api/admin/audit-logs?module=CLIENTS&action=DELETE`, null, adminToken);
    assert(
      deleteClientAuditRes.body.data.audit_logs.some((l) => l.entity_id === clientId),
      "DELETE CLIENT audit log recorded"
    );

    // 17. Verify Pagination & Search Filters
    const searchRes = await request("GET", "/api/admin/audit-logs?page=1&limit=5&search=Audit", null, adminToken);
    assert(searchRes.status === 200, "Search audit logs returned 200 OK");
    assert(searchRes.body.data.pagination.limit === 5, "Pagination limit applied correctly");
    assert(searchRes.body.data.audit_logs.length <= 5, "Returned items count matches pagination limit");

    console.log("\n=======================================================");
    console.log(`  Audit Logs Backend Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================\n");
  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    server.close();
    await pool.end();
  }
}

runTests();
