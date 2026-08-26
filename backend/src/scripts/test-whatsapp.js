require("dotenv").config();
const http = require("http");
const app = require("../app");
const pool = require("../config/database");
const axios = require("axios");

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
          resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
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
  console.log("    CRM WhatsApp Backend Module Test Suite            ");
  console.log("=======================================================\n");

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  try {
    // Setup test user & JWT token
    const rolesRes = await pool.query("SELECT id, name FROM roles WHERE name = 'Admin'");
    const adminRole = rolesRes.rows[0];

    const adminUserRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      ["Admin WA Test", "admin@watsapptest.com", "$2b$10$abcdefghijklmnopqrstuu", adminRole.id]
    );
    const adminUser = adminUserRes.rows[0];

    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "antigravity_jwt_secret_key_2026_crm";
    const token = jwt.sign({ id: adminUser.id, role_id: adminRole.id, role_name: "Admin" }, secret, { expiresIn: "1h" });

    // Mock axios post & get to prevent actual ChatterPillar network calls during test suite
    const originalPost = axios.post;
    const originalGet = axios.get;
    let lastCpRequestUrl = "";
    let lastCpHeaders = {};
    let lastCpBody = "";
    let mockResponseFunc = null;

    axios.post = async (url, data, config) => {
      lastCpRequestUrl = url;
      lastCpHeaders = config?.headers || {};
      lastCpBody = data;

      if (mockResponseFunc) {
        return mockResponseFunc(url, data, config);
      }

      if (url.includes("getWhatsAppAccountInfo")) {
        let parsed = {};
        try { parsed = JSON.parse(data); } catch(e) {}
        if (parsed.mobile === "918888888888") {
          return {
            status: 200,
            data: {
              code: 200,
              message: "Whatsapp account information.",
              data: [{ whatsapp_account_id: 888, mobile: "918888888888" }],
            },
          };
        } else {
          return {
            status: 200,
            data: {
              code: 200,
              message: "Whatsapp account information.",
              data: [],
            },
          };
        }
      }

      if (url.includes("sendMessage")) {
        return {
          status: 200,
          data: {
            messaging_product: "whatsapp",
            contacts: [{ input: "918888888888", wa_id: "918888888888" }],
            messages: [{ id: "wamid.test12345", message_status: "accepted" }],
          },
        };
      }

      return { status: 200, data: {} };
    };

    axios.get = async (url, config) => {
      lastCpRequestUrl = url;
      lastCpHeaders = config?.headers || {};

      if (mockResponseFunc) {
        return mockResponseFunc(url, null, config);
      }

      if (url.includes("getTemplateList")) {
        return {
          status: 200,
          data: {
            code: 200,
            message: "Template List.",
            data: [
              { template_id: "99999999", template_name: "birthday_wish", language: "en" },
              { template_id: "88888888", template_name: "ipo_update", language: "en" }
            ],
          },
        };
      }

      return { status: 200, data: {} };
    };

    console.log("--- 1. Verification of Database Table ---");
    const dbCheck = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'whatsapp_templates'`
    );
    assert(dbCheck.rows.length >= 4, "whatsapp_templates table exists in database schema");

    console.log("\n--- 2. Account Info API (/api/whatsapp/getWhatsAppAccountInfo) ---");

    // 1. WhatsApp account API requires authentication
    const unauthAccRes = await makeRequest("POST", "/api/whatsapp/getWhatsAppAccountInfo", { mobile: "918888888888" });
    assert(unauthAccRes.statusCode === 401, "1. WhatsApp account API requires authentication (401 Unauthorized)");

    // 4. Invalid mobile is rejected
    const invalidMobRes = await makeRequest("POST", "/api/whatsapp/getWhatsAppAccountInfo", { mobile: "abc" }, token);
    assert(invalidMobRes.statusCode === 400, "4. Invalid mobile format is rejected (400 Bad Request)");

    // 2. Valid mobile calls ChatterPillar correctly
    const validAccRes = await makeRequest("POST", "/api/whatsapp/getWhatsAppAccountInfo", { mobile: "918888888888" }, token);
    assert(
      validAccRes.statusCode === 200 &&
      validAccRes.body.success === true &&
      Array.isArray(validAccRes.body.data) &&
      validAccRes.body.data[0].whatsapp_account_id === 888,
      "2. Valid mobile calls ChatterPillar correctly and returns 200 OK"
    );

    // 3. Missing mobile sends an empty request body {}
    await makeRequest("POST", "/api/whatsapp/getWhatsAppAccountInfo", {}, token);
    assert(lastCpBody === "{}", "3. Missing mobile sends an empty request body '{}' to ChatterPillar");

    // 5. ChatterPillar account response is returned correctly
    assert(validAccRes.body.message.includes("verified") || validAccRes.body.message.includes("information"), "5. ChatterPillar account response is returned correctly");


    console.log("\n--- 3. Send Template Message API (/api/whatsapp/send-template) ---");

    // 6. Send-template API requires authentication
    const unauthSendRes = await makeRequest("POST", "/api/whatsapp/send-template", { template_id: "t1", mobile: "918888888888", full_name: "John" });
    assert(unauthSendRes.statusCode === 401, "6. Send-template API requires authentication (401 Unauthorized)");

    // 7. Missing template_id is rejected
    const missingTplRes = await makeRequest("POST", "/api/whatsapp/send-template", { mobile: "918888888888", full_name: "John" }, token);
    assert(missingTplRes.statusCode === 400 && missingTplRes.body.message.includes("template_id"), "7. Missing template_id is rejected (400 Bad Request)");

    // 8. Missing mobile is rejected
    const missingMobRes = await makeRequest("POST", "/api/whatsapp/send-template", { template_id: "9999", full_name: "John" }, token);
    assert(missingMobRes.statusCode === 400 && missingMobRes.body.message.includes("mobile"), "8. Missing mobile is rejected (400 Bad Request)");

    // 9. Valid template request is sent correctly
    const sendValidRes = await makeRequest("POST", "/api/whatsapp/send-template", {
      whatsapp_account_id: 888,
      template_id: "99999999",
      mobile: "918888888888",
      full_name: "John Paul",
      body_variable_values: ["John", "100"],
    }, token);
    assert(
      sendValidRes.statusCode === 200 &&
      sendValidRes.body.success === true &&
      sendValidRes.body.data.messages[0].message_status === "accepted",
      "9. Valid template request is sent correctly and returns success response"
    );

    // 10. CP-API-KEY is NEVER returned in the response
    const jsonString = JSON.stringify(sendValidRes.body);
    const hasSecret = jsonString.includes("CP_KEY") || jsonString.includes("CP-API-KEY");
    assert(!hasSecret, "10. CP-API-KEY is NEVER returned in the API response");

    // 11. ChatterPillar API errors are handled safely
    mockResponseFunc = () => {
      const err = new Error("ChatterPillar error");
      err.response = { status: 500, data: { message: "Internal CP Failure" } };
      throw err;
    };
    const cpErrRes = await makeRequest("POST", "/api/whatsapp/getWhatsAppAccountInfo", { mobile: "918888888888" }, token);
    assert(cpErrRes.statusCode === 502 && cpErrRes.body.message.includes("provider"), "11. ChatterPillar API errors are handled safely (502 Bad Gateway)");


    console.log("\n--- 4. Template List API (/api/whatsapp/templates) ---");

    // Reset mockResponseFunc
    mockResponseFunc = null;

    // Unauthenticated template list request rejected
    const unauthTplListRes = await makeRequest("GET", "/api/whatsapp/templates");
    assert(unauthTplListRes.statusCode === 401, "12. GET /api/whatsapp/templates requires authentication (401 Unauthorized)");

    // Authenticated template list request succeeds
    const tplListRes = await makeRequest("GET", "/api/whatsapp/templates", null, token);
    assert(
      tplListRes.statusCode === 200 &&
      tplListRes.body.success === true &&
      Array.isArray(tplListRes.body.data.data),
      "13. GET /api/whatsapp/templates calls ChatterPillar and returns template list (200 OK)"
    );

    // Restore original axios methods
    axios.post = originalPost;
    axios.get = originalGet;

    // Clean test user
    await pool.query("DELETE FROM users WHERE email = 'admin@watsapptest.com'");
    console.log("\nWhatsApp Module Test Suite cleanup completed.");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await pool.end();
    console.log("\n=======================================================");
    console.log(`  WhatsApp Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
