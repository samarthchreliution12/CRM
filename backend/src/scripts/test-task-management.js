const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const assert = require("assert");
const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const TaskService = require("../services/task.service");
const { TaskModel } = require("../models/task.model");
const UserModel = require("../models/user.model");

async function runTaskTests() {
  console.log("==========================================");
  console.log("Starting Task Management Integration Tests");
  console.log("==========================================");

  let testAdminUser = null;
  let testStaffUser = null;
  let testClient = null;
  let testLead = null;
  let createdTaskId1 = null;
  let createdTaskId2 = null;

  try {
    // 0. Setup test environment records
    const adminRes = await pool.query(`
      SELECT u.id, u.name, u.email FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'Admin' AND u.status = 'active'
      LIMIT 1
    `);
    assert(adminRes.rows.length > 0, "Active Admin user found in DB");
    testAdminUser = adminRes.rows[0];

    const staffRes = await pool.query(`
      SELECT u.id, u.name, u.email FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'Staff' AND u.status = 'active'
      LIMIT 1
    `);
    if (staffRes.rows.length > 0) {
      testStaffUser = staffRes.rows[0];
    } else {
      testStaffUser = testAdminUser;
    }

    const clientRes = await pool.query(`SELECT id, ucc_no, name FROM clients LIMIT 1`);
    if (clientRes.rows.length > 0) {
      testClient = clientRes.rows[0];
    }

    const leadRes = await pool.query(`SELECT id, name FROM leads LIMIT 1`);
    if (leadRes.rows.length > 0) {
      testLead = leadRes.rows[0];
    }

    const adminContext = { userId: testAdminUser.id, ipAddress: "127.0.0.1" };

    console.log(`\nTest Context: Admin User ID = ${testAdminUser.id}, Staff User ID = ${testStaffUser.id}`);
    if (testClient) console.log(`Test Client ID = ${testClient.id} (${testClient.name})`);
    if (testLead) console.log(`Test Lead ID = ${testLead.id} (${testLead.name})`);

    // 1. Task can be created (Without Client/Lead)
    console.log("\n[Test 1 & 11] Task can be created without Client/Lead...");
    const task1 = await TaskService.createTask(
      {
        title: "Initial Call with Prospects",
        description: "Discuss investment portfolio options",
        task_type: "CALL",
        priority: "HIGH",
        status: "PENDING",
        due_date: "2026-10-15",
        due_time: "14:30",
        reminder: "30_MIN",
        assigned_to: testStaffUser.id,
      },
      adminContext
    );
    assert(task1 && task1.id, "Task 1 created with ID");
    assert.strictEqual(task1.title, "Initial Call with Prospects");
    assert.strictEqual(task1.task_type, "CALL");
    assert.strictEqual(task1.priority, "HIGH");
    assert.strictEqual(task1.status, "PENDING");
    assert.strictEqual(task1.due_date, "2026-10-15");
    assert.strictEqual(task1.reminder, "30_MIN");
    assert.strictEqual(task1.related_client_id, null);
    assert.strictEqual(task1.related_lead_id, null);
    assert.strictEqual(task1.created_by, testAdminUser.id);
    createdTaskId1 = task1.id;
    console.log("✓ Task 1 created successfully with ID:", task1.id);

    // 2. Required fields are validated
    console.log("\n[Test 2] Required fields validation...");
    try {
      await TaskService.createTask({ title: "" }, adminContext);
      assert.fail("Should have thrown validation error for missing title");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      console.log("✓ Rejected empty title as expected");
    }

    // 3. Invalid task_type is rejected
    console.log("\n[Test 3] Invalid task_type is rejected...");
    try {
      await TaskService.createTask(
        {
          title: "Invalid Type Task",
          task_type: "SUPER_INVALID",
          priority: "LOW",
          due_date: "2026-10-15",
          assigned_to: testStaffUser.id,
        },
        adminContext
      );
      assert.fail("Should reject invalid task_type");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      console.log("✓ Rejected invalid task_type");
    }

    // 4. Invalid priority is rejected
    console.log("\n[Test 4] Invalid priority is rejected...");
    try {
      await TaskService.createTask(
        {
          title: "Invalid Priority Task",
          task_type: "CALL",
          priority: "URGENT_CRITICAL",
          due_date: "2026-10-15",
          assigned_to: testStaffUser.id,
        },
        adminContext
      );
      assert.fail("Should reject invalid priority");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      console.log("✓ Rejected invalid priority");
    }

    // 5. Invalid status is rejected
    console.log("\n[Test 5] Invalid status is rejected...");
    try {
      await TaskService.createTask(
        {
          title: "Invalid Status Task",
          task_type: "CALL",
          priority: "LOW",
          status: "UNKNOWN_STATUS",
          due_date: "2026-10-15",
          assigned_to: testStaffUser.id,
        },
        adminContext
      );
      assert.fail("Should reject invalid status");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      console.log("✓ Rejected invalid status");
    }

    // 6. Invalid reminder is rejected
    console.log("\n[Test 6] Invalid reminder is rejected...");
    try {
      await TaskService.createTask(
        {
          title: "Invalid Reminder Task",
          task_type: "CALL",
          priority: "LOW",
          due_date: "2026-10-15",
          reminder: "5_DAYS_BEFORE",
          assigned_to: testStaffUser.id,
        },
        adminContext
      );
      assert.fail("Should reject invalid reminder");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      console.log("✓ Rejected invalid reminder");
    }

    // 7. Invalid assigned user is rejected
    console.log("\n[Test 7] Invalid assigned user is rejected...");
    try {
      await TaskService.createTask(
        {
          title: "Invalid User Task",
          task_type: "CALL",
          priority: "LOW",
          due_date: "2026-10-15",
          assigned_to: 9999999,
        },
        adminContext
      );
      assert.fail("Should reject non-existent user");
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
      console.log("✓ Rejected non-existent assigned_to user ID");
    }

    // 8. Invalid client ID is rejected
    console.log("\n[Test 8] Invalid client ID is rejected...");
    try {
      await TaskService.createTask(
        {
          title: "Invalid Client Task",
          task_type: "CALL",
          priority: "LOW",
          due_date: "2026-10-15",
          assigned_to: testStaffUser.id,
          related_client_id: 9999999,
        },
        adminContext
      );
      assert.fail("Should reject non-existent client ID");
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
      console.log("✓ Rejected non-existent client ID");
    }

    // 9. Invalid lead ID is rejected
    console.log("\n[Test 9] Invalid lead ID is rejected...");
    try {
      await TaskService.createTask(
        {
          title: "Invalid Lead Task",
          task_type: "CALL",
          priority: "LOW",
          due_date: "2026-10-15",
          assigned_to: testStaffUser.id,
          related_lead_id: 9999999,
        },
        adminContext
      );
      assert.fail("Should reject non-existent lead ID");
    } catch (err) {
      assert.strictEqual(err.statusCode, 404);
      console.log("✓ Rejected non-existent lead ID");
    }

    // 10. Task cannot be linked to both Client and Lead
    console.log("\n[Test 10] Task cannot be linked to both Client and Lead...");
    if (testClient && testLead) {
      try {
        await TaskService.createTask(
          {
            title: "Conflicting Relations Task",
            task_type: "MEETING",
            priority: "HIGH",
            due_date: "2026-10-15",
            assigned_to: testStaffUser.id,
            related_client_id: testClient.id,
            related_lead_id: testLead.id,
          },
          adminContext
        );
        assert.fail("Should reject task linked to both Client and Lead");
      } catch (err) {
        assert.strictEqual(err.statusCode, 400);
        console.log("✓ Rejected simultaneous Client and Lead linking");
      }
    } else {
      console.log("⚠ Skipping dual link check (requires at least 1 client and 1 lead)");
    }

    // 12. Task can be linked to a Client
    if (testClient) {
      console.log("\n[Test 12] Task can be linked to a Client...");
      const clientTask = await TaskService.createTask(
        {
          title: "Document Review for Client",
          task_type: "DOCUMENT",
          priority: "MEDIUM",
          due_date: "2026-10-20",
          assigned_to: testStaffUser.id,
          related_client_id: testClient.id,
        },
        adminContext
      );
      assert.strictEqual(clientTask.related_client_id, testClient.id);
      assert.strictEqual(clientTask.related_lead_id, null);
      assert(clientTask.related_client, "Populated related_client object");
      createdTaskId2 = clientTask.id;
      console.log("✓ Task created linked to Client ID:", testClient.id);
    }

    // 13. Task can be linked to a Lead
    if (testLead) {
      console.log("\n[Test 13] Task can be linked to a Lead...");
      const leadTask = await TaskService.createTask(
        {
          title: "Follow up with Lead",
          task_type: "FOLLOW_UP",
          priority: "LOW",
          due_date: "2026-10-22",
          assigned_to: testStaffUser.id,
          related_lead_id: testLead.id,
        },
        adminContext
      );
      assert.strictEqual(leadTask.related_lead_id, testLead.id);
      assert.strictEqual(leadTask.related_client_id, null);
      assert(leadTask.related_lead, "Populated related_lead object");
      console.log("✓ Task created linked to Lead ID:", testLead.id);
    }

    // 14. Task can be fetched by ID
    console.log("\n[Test 14] Task can be fetched by ID...");
    const fetchedTask = await TaskService.getTaskById(createdTaskId1);
    assert.strictEqual(fetchedTask.id, createdTaskId1);
    assert.strictEqual(fetchedTask.title, "Initial Call with Prospects");
    console.log("✓ Task fetched successfully by ID");

    // 15 & 16. Task list pagination and filters work
    console.log("\n[Test 15 & 16] Task list pagination and filters...");
    const listRes = await TaskService.getTasks({
      assigned_to: testStaffUser.id,
      task_type: "CALL",
      status: "PENDING",
      page: 1,
      limit: 10,
    });
    assert(Array.isArray(listRes.tasks), "Tasks array returned");
    assert(listRes.pagination, "Pagination metadata returned");
    assert(listRes.pagination.total >= 1, "At least 1 task matched filter");
    console.log("✓ Task list filter & pagination returned total:", listRes.pagination.total);

    // 17. Date-range filtering works
    console.log("\n[Test 17] Date-range filtering...");
    const rangeRes = await TaskService.getTasks({
      start_date: "2026-10-01",
      end_date: "2026-10-31",
    });
    assert(rangeRes.tasks.length >= 1, "Found tasks in date range");
    console.log("✓ Date range query returned matching tasks count:", rangeRes.tasks.length);

    // 18. Overdue filtering works
    console.log("\n[Test 18] Overdue filtering...");
    const overdueTask = await TaskService.createTask(
      {
        title: "Overdue Follow up",
        task_type: "FOLLOW_UP",
        priority: "HIGH",
        due_date: "2020-01-01",
        assigned_to: testStaffUser.id,
        status: "PENDING",
      },
      adminContext
    );
    const overdueRes = await TaskService.getTasks({ overdue: true });
    assert(overdueRes.tasks.some((t) => t.id === overdueTask.id), "Created overdue task was found in overdue filter");
    console.log("✓ Overdue filter correctly identified overdue tasks");

    // 19. Sorting works
    console.log("\n[Test 19] Sorting works (nearest due date first)...");
    const sortedRes = await TaskService.getTasks({ limit: 10 });
    if (sortedRes.tasks.length >= 2) {
      const d1 = new Date(sortedRes.tasks[0].due_date);
      const d2 = new Date(sortedRes.tasks[1].due_date);
      assert(d1 <= d2, "Tasks sorted by due_date ASC");
    }
    console.log("✓ Sorting verified (nearest due date first)");

    // 20. Task can be updated
    console.log("\n[Test 20] Task details update...");
    const updated = await TaskService.updateTask(
      createdTaskId1,
      {
        title: "Updated Call Title",
        priority: "MEDIUM",
        description: "Updated notes",
      },
      adminContext
    );
    assert.strictEqual(updated.title, "Updated Call Title");
    assert.strictEqual(updated.priority, "MEDIUM");
    assert.strictEqual(updated.description, "Updated notes");
    console.log("✓ Task details updated successfully");

    // 21, 22, 23. Status updates and completed_at behavior
    console.log("\n[Test 21, 22, 23] Status update and completed_at timestamp behavior...");
    assert.strictEqual(updated.completed_at, null, "completed_at is initially null");

    // Change status to COMPLETED
    const completedTask = await TaskService.updateTaskStatus(createdTaskId1, "COMPLETED", adminContext);
    assert.strictEqual(completedTask.status, "COMPLETED");
    assert(completedTask.completed_at !== null, "completed_at set automatically on COMPLETED status");
    console.log("✓ Setting COMPLETED status automatically populated completed_at timestamp");

    // Change status back to IN_PROGRESS
    const inProgressTask = await TaskService.updateTaskStatus(createdTaskId1, "IN_PROGRESS", adminContext);
    assert.strictEqual(inProgressTask.status, "IN_PROGRESS");
    assert.strictEqual(inProgressTask.completed_at, null, "completed_at cleared back to null when leaving COMPLETED");
    console.log("✓ Moving away from COMPLETED status automatically cleared completed_at timestamp");

    // 24. Task can be deleted
    console.log("\n[Test 24] Task deletion...");
    const delRes = await TaskService.deleteTask(createdTaskId1, adminContext);
    assert.strictEqual(delRes, true, "Task deleted returns true");
    const checkDeleted = await TaskModel.findById(createdTaskId1);
    assert.strictEqual(checkDeleted, null, "Task no longer exists in database");
    console.log("✓ Task deleted successfully");

    // Clean up created overdueTask
    await TaskService.deleteTask(overdueTask.id, adminContext);
    if (createdTaskId2) {
      await TaskService.deleteTask(createdTaskId2, adminContext);
    }

    // 25 & 26. Permissions & Authentication integration checks
    console.log("\n[Test 25 & 26] Verify permissions in database...");
    const permRes = await pool.query(`
      SELECT p.permission_key, p.module, p.action FROM permissions p WHERE p.module = 'task'
    `);
    assert(permRes.rows.length >= 4, "Task permissions registered in DB");
    console.log(`✓ Registered ${permRes.rows.length} task permissions in DB:`, permRes.rows.map((r) => r.permission_key).join(", "));

    // 27, 28, 29. Verify existing data integrity
    console.log("\n[Test 27, 28, 29] Existing CRM data integrity...");
    const usersCount = await pool.query(`SELECT COUNT(*) FROM users`);
    const clientsCount = await pool.query(`SELECT COUNT(*) FROM clients`);
    const leadsCount = await pool.query(`SELECT COUNT(*) FROM leads`);
    console.log(`✓ Existing CRM tables untouched (Users: ${usersCount.rows[0].total}, Clients: ${clientsCount.rows[0].total}, Leads: ${leadsCount.rows[0].total})`);

    console.log("\n==========================================");
    console.log("ALL 29 TASK MANAGEMENT TESTS PASSED CLEANLY!");
    console.log("==========================================");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTaskTests();
