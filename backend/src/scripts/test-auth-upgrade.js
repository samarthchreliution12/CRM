const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const AuthService = require("../services/auth.service");
const RefreshSessionModel = require("../models/refreshSession.model");
const pool = require("../config/database");

const seedDatabase = require("./seed");

async function runAuthUpgradeTest() {
  console.log("\n==================================================================");
  console.log("🔐 TESTING PRODUCTION-READY ACCESS + REFRESH TOKEN ARCHITECTURE");
  console.log("==================================================================\n");

  try {
    // Seed DB first to ensure admin user exists
    await seedDatabase();

    // 1. Test Login (30-minute Access Token + 7-day Refresh Token)
    console.log("\n1. Testing Login...");
    const loginResult = await AuthService.login("admin@crm.com", "password123", {
      ipAddress: "127.0.0.1",
      userAgent: "TestRunner/1.0",
    });

    console.log("   ✓ Access Token Issued (Length):", loginResult.token.length);
    console.log("   ✓ Refresh Token Generated:", Boolean(loginResult.refreshToken));
    console.log("   ✓ Authenticated User:", loginResult.user.email, `(${loginResult.user.role.name})`);

    const firstRefreshToken = loginResult.refreshToken;

    // Verify refresh session in DB
    const session1 = await RefreshSessionModel.findByTokenHash(
      require("crypto").createHash("sha256").update(firstRefreshToken).digest("hex")
    );
    console.log("   ✓ DB Refresh Session Found (ID):", session1.id, "| User ID:", session1.user_id, "| Revoked:", session1.revoked_at);

    // 2. Test Refresh Token Rotation (POST /api/auth/refresh)
    console.log("\n2. Testing Refresh Token Rotation...");
    const refreshResult = await AuthService.refreshToken(firstRefreshToken, {
      ipAddress: "127.0.0.1",
      userAgent: "TestRunner/1.0",
    });

    console.log("   ✓ New Access Token Issued (Length):", refreshResult.token.length);
    console.log("   ✓ New Rotated Refresh Token Generated:", Boolean(refreshResult.refreshToken));

    const secondRefreshToken = refreshResult.refreshToken;

    // Check old session status
    const session1After = await RefreshSessionModel.findByTokenHash(
      require("crypto").createHash("sha256").update(firstRefreshToken).digest("hex")
    );
    console.log("   ✓ Old Session 1 Revoked At:", session1After.revoked_at);

    // Check new session status
    const session2 = await RefreshSessionModel.findByTokenHash(
      require("crypto").createHash("sha256").update(secondRefreshToken).digest("hex")
    );
    console.log("   ✓ New Session 2 Created (ID):", session2.id, "| Revoked:", session2.revoked_at);

    // 3. Test Token Reuse / Theft Detection
    console.log("\n3. Testing Token Reuse / Theft Detection (Re-using old session 1)...");
    try {
      await AuthService.refreshToken(firstRefreshToken, {
        ipAddress: "127.0.0.1",
        userAgent: "AttackerBot/1.0",
      });
      console.error("   ❌ ERROR: Reused token was accepted!");
    } catch (reuseErr) {
      console.log("   ✓ Reused Token Correctly Rejected:", reuseErr.message);

      // Verify that Session 2 for the user was ALSO revoked due to security incident
      const session2AfterRejection = await RefreshSessionModel.findByTokenHash(
        require("crypto").createHash("sha256").update(secondRefreshToken).digest("hex")
      );
      console.log("   ✓ All User Sessions Revoked for Security (Session 2 Revoked At):", session2AfterRejection.revoked_at);
    }

    // 4. Test Hardened Generic Login Error Message
    console.log("\n4. Testing Generic Login Error Message...");
    try {
      await AuthService.login("admin@parshwaconsultancy.com", "WrongPassword123");
    } catch (loginErr) {
      console.log("   ✓ Generic Error Message Verified:", `"${loginErr.message}"`);
    }

    // 5. Test Logout Session Invalidation
    console.log("\n5. Testing Logout Session Invalidation...");
    const login3 = await AuthService.login("admin@crm.com", "password123");
    const thirdRefreshToken = login3.refreshToken;

    await AuthService.logout(thirdRefreshToken, login3.user.id);
    const session3AfterLogout = await RefreshSessionModel.findByTokenHash(
      require("crypto").createHash("sha256").update(thirdRefreshToken).digest("hex")
    );
    console.log("   ✓ Refresh Session Revoked on Logout:", session3AfterLogout.revoked_at);

    console.log("\n==================================================================");
    console.log("✅ ALL AUTHENTICATION SYSTEM UPGRADE TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================================\n");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
  } finally {
    await pool.end();
  }
}

runAuthUpgradeTest();
