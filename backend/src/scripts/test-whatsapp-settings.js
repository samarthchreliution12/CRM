require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
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

function makeRequest(method, pathUrl, body = null, token = null) {
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

async function loginUser(email, password) {
  const res = await makeRequest("POST", "/api/auth/login", { email, password });
  if (res.statusCode === 200 && res.body.data && res.body.data.token) {
    return res.body.data.token;
  }
  throw new Error(`Failed to login user ${email}: ${JSON.stringify(res.body)}`);
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   CRM WhatsApp Settings Integration Test Suite        ");
  console.log("=======================================================\n");

  try {
    // Start local express test server
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`Test server running on ${baseUrl}`);
        resolve();
      });
    });

    // Clean up test whatsapp_settings table
    await pool.query("DELETE FROM whatsapp_settings");

    // Login as Admin
    const adminToken = await loginUser("admin@crm.com", "password123");

    console.log("\n--- 1. Authentication & Security Enforcement ---");
    const unauthGetRes = await makeRequest("GET", "/api/whatsapp/settings");
    assert(unauthGetRes.statusCode === 401, "GET /api/whatsapp/settings enforces authentication (401)");

    const unauthPostRes = await makeRequest("POST", "/api/whatsapp/settings", { cp_api_key: "test_key" });
    assert(unauthPostRes.statusCode === 401, "POST /api/whatsapp/settings enforces authentication (401)");

    console.log("\n--- 2. Fetch Initial Empty/Default Settings ---");
    const initialGetRes = await makeRequest("GET", "/api/whatsapp/settings", null, adminToken);
    assert(initialGetRes.statusCode === 200, "GET /api/whatsapp/settings returns 200");
    assert(initialGetRes.body.data.is_connected === false, "Initial is_connected is false");
    assert(initialGetRes.body.data.cp_api_key === "", "Initial cp_api_key is empty string");

    console.log("\n--- 3. Validation & Creation Tests ---");
    const emptyPostRes = await makeRequest("POST", "/api/whatsapp/settings", {}, adminToken);
    assert(emptyPostRes.statusCode === 400, "POST without cp_api_key returns 400 Bad Request");

    const invalidMobPostRes = await makeRequest(
      "POST",
      "/api/whatsapp/settings",
      { cp_api_key: "CP_TEST_KEY_12345678", whatsapp_mobile: "123" },
      adminToken
    );
    assert(invalidMobPostRes.statusCode === 400, "POST with invalid mobile format returns 400 Bad Request");

    const validCreateRes = await makeRequest(
      "POST",
      "/api/whatsapp/settings",
      { cp_api_key: "CP_SECRET_KEY_999988887777", whatsapp_mobile: "918888888888" },
      adminToken
    );
    assert(validCreateRes.statusCode === 201, "POST /api/whatsapp/settings creates configuration (201 Created)");
    assert(validCreateRes.body.data.provider === "ChatterPillar", "Provider is ChatterPillar");
    assert(validCreateRes.body.data.whatsapp_mobile === "918888888888", "WhatsApp mobile stored correctly");
    assert(
      validCreateRes.body.data.cp_api_key !== "CP_SECRET_KEY_999988887777",
      "Full API key is NEVER exposed in response body"
    );
    assert(
      validCreateRes.body.data.cp_api_key.includes("..."),
      "API key is properly masked (e.g. CP_S...7777)"
    );

    console.log("\n--- 4. Update Settings Tests ---");
    const updateRes = await makeRequest(
      "PUT",
      "/api/whatsapp/settings",
      { whatsapp_mobile: "919999999999" },
      adminToken
    );
    assert(updateRes.statusCode === 200, "PUT /api/whatsapp/settings updates configuration (200 OK)");
    assert(updateRes.body.data.whatsapp_mobile === "919999999999", "Mobile updated without overriding API key");
    assert(updateRes.body.data.cp_api_key.includes("..."), "API key remains masked after update");

    console.log("\n--- 5. Connection Status API ---");
    const statusRes = await makeRequest("GET", "/api/whatsapp/settings/status", null, adminToken);
    assert(statusRes.statusCode === 200, "GET /api/whatsapp/settings/status returns 200 OK");
    assert(statusRes.body.data.provider === "ChatterPillar", "Status provider is ChatterPillar");
    assert(statusRes.body.data.whatsapp_mobile === "919999999999", "Status whatsapp_mobile matches stored mobile");
    assert(statusRes.body.data.cp_api_key === undefined, "Status response completely omits cp_api_key");

    console.log("\n--- 6. Connection Test (Missing/Unconfigured Setup) ---");
    await pool.query("DELETE FROM whatsapp_settings");
    const noConfigTestRes = await makeRequest("POST", "/api/whatsapp/settings/test-connection", {}, adminToken);
    assert(noConfigTestRes.statusCode === 200 || noConfigTestRes.statusCode === 400, "Test connection on unconfigured setup returns proper status without crashing");
    assert(noConfigTestRes.body.data.is_connected === false, "Test connection returns is_connected = false when missing credentials");

    console.log("\n--- 7. Re-populate Setting & Test API Key Security ---");
    await makeRequest(
      "POST",
      "/api/whatsapp/settings",
      { cp_api_key: "CP_SAMPLE_VALID_KEY_12345", whatsapp_mobile: "918888888888" },
      adminToken
    );

    const dbRowRes = await pool.query("SELECT * FROM whatsapp_settings ORDER BY id DESC LIMIT 1");
    const dbRow = dbRowRes.rows[0];
    assert(dbRow.cp_api_key_encrypted !== undefined, "Database stores encrypted cp_api_key_encrypted");
    assert(dbRow.cp_api_key_encrypted !== "CP_SAMPLE_VALID_KEY_12345", "Plaintext API key is NOT stored in DB");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();

    console.log("\n=======================================================");
    console.log(`  WhatsApp Settings Integration Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
