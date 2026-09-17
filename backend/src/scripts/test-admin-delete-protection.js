const assert = require("assert");
const pool = require("../config/database");
const AdminStaffService = require("../services/adminStaff.service");
const UserModel = require("../models/user.model");
const RoleModel = require("../models/role.model");

async function runTest() {
  console.log("=== Testing Admin User Deletion Protection ===");

  try {
    // 1. Find or create an Admin user
    let adminUser = await pool.query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name AS role_name 
       FROM users u 
       JOIN roles r ON r.id = u.role_id 
       WHERE LOWER(r.name) = 'admin' 
       LIMIT 1`
    );

    let adminId;
    if (adminUser.rows.length > 0) {
      adminId = adminUser.rows[0].id;
      console.log(`✓ Found existing Admin user ID ${adminId} (${adminUser.rows[0].email})`);
    } else {
      const adminRole = await RoleModel.findByName("Admin");
      const newAdmin = await UserModel.createUser({
        name: "Test System Admin",
        email: "systemadmin_test@parshwa.com",
        password_hash: "hashedpass",
        mobile: "9876543210",
        role_id: adminRole ? adminRole.id : 1,
        status: "active",
      });
      adminId = newAdmin.id;
      console.log(`✓ Created new test Admin user ID ${adminId}`);
    }

    // 2. Attempt to delete Admin user
    console.log("-> Testing deletion of Admin user...");
    let errorCaught = false;
    let errorMessage = "";
    let statusCode = 0;

    try {
      await AdminStaffService.deleteStaff(adminId, 99999);
    } catch (err) {
      errorCaught = true;
      errorMessage = err.message;
      statusCode = err.statusCode;
    }

    assert(errorCaught, "Expected Admin deletion to throw an error, but it succeeded.");
    assert(statusCode === 400, `Expected status code 400, got ${statusCode}`);
    assert(
      errorMessage.includes("Admin users cannot be deleted"),
      `Expected error message 'Admin users cannot be deleted.', got '${errorMessage}'`
    );
    console.log(`✓ PASSED: Correctly blocked deleting Admin user (Status: ${statusCode}, Message: "${errorMessage}")`);

    // 3. Verify Admin user still exists in database
    const checkUser = await UserModel.findStaffById(adminId);
    assert(checkUser !== null, "Admin user should still exist in database");
    console.log(`✓ PASSED: Admin user ID ${adminId} remains safe in database.`);

    console.log("\n=== ALL ADMIN DELETION PROTECTION TESTS PASSED SUCCESSFULLY! ===");
    process.exit(0);
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  }
}

runTest();
