const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const pool = require("../config/database");

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedCount++;
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("   CLIENT PORTAL BACKEND VERIFICATION TEST SUITE");
  console.log("==========================================================\n");

  let client1Token = null;
  let client1Data = null;
  let client2Token = null;
  let client2Data = null;
  let uploadedDocId = null;
  let requirementId = null;
  let adminToken = null;

  try {
    // -----------------------------------------------------------
    // TEST 1: Valid client mobile login
    // -----------------------------------------------------------
    console.log("[TEST 1] Valid client mobile login");
    const loginRes = await fetch(`${BASE_URL}/api/client-portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_no: "9876500000" }), // Aarav Sharma
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, `Status is 200 (got ${loginRes.status})`);
    assert(loginData.success === true, "Response has success: true");
    assert(!!loginData.data.token, "Returned JWT token");
    assert(loginData.data.client.name === "Aarav Sharma", "Matched client name 'Aarav Sharma'");
    client1Token = loginData.data.token;
    client1Data = loginData.data.client;

    // -----------------------------------------------------------
    // TEST 2: Invalid mobile login
    // -----------------------------------------------------------
    console.log("\n[TEST 2] Invalid mobile login");
    const badLoginRes = await fetch(`${BASE_URL}/api/client-portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_no: "9999999999" }),
    });
    const badLoginData = await badLoginRes.json();
    assert(badLoginRes.status === 404, `Unregistered mobile returns 404 (got ${badLoginRes.status})`);
    assert(badLoginData.success === false, "Response has success: false");

    const malformedRes = await fetch(`${BASE_URL}/api/client-portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_no: "123" }),
    });
    assert(malformedRes.status === 400, `Malformed mobile returns 400 validation error (got ${malformedRes.status})`);

    // -----------------------------------------------------------
    // TEST 3: Client authentication middleware
    // -----------------------------------------------------------
    console.log("\n[TEST 3] Client authentication middleware");
    const noTokenRes = await fetch(`${BASE_URL}/api/client-portal/profile`);
    assert(noTokenRes.status === 401, `Missing token returns 401 (got ${noTokenRes.status})`);

    const bogusTokenRes = await fetch(`${BASE_URL}/api/client-portal/profile`, {
      headers: { Authorization: "Bearer bogus_token_value_xyz" },
    });
    assert(bogusTokenRes.status === 401, `Invalid token returns 401 (got ${bogusTokenRes.status})`);

    // -----------------------------------------------------------
    // TEST 4: Client can retrieve own profile
    // -----------------------------------------------------------
    console.log("\n[TEST 4] Client can retrieve own profile");
    const profileRes = await fetch(`${BASE_URL}/api/client-portal/profile`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, `Status is 200 (got ${profileRes.status})`);
    assert(profileData.data.client.id === client1Data.id, "Profile ID matches authenticated client ID");
    assert(profileData.data.client.name === "Aarav Sharma", "Profile name matches");
    assert(profileData.data.client.pan.includes("****"), `PAN is masked: ${profileData.data.client.pan}`);
    assert(profileData.data.client.password === undefined, "Password is not exposed");

    // -----------------------------------------------------------
    // TEST 5: Client cannot retrieve another client's profile
    // -----------------------------------------------------------
    console.log("\n[TEST 5] Client cannot retrieve another client's profile (IDOR protection)");
    const idorProfileRes = await fetch(`${BASE_URL}/api/client-portal/profile?client_id=2111`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    const idorProfileData = await idorProfileRes.json();
    assert(idorProfileData.data.client.id === client1Data.id, "Client ID remains 2110 regardless of query parameters");

    // -----------------------------------------------------------
    // TEST 6: Client can retrieve own pending documents
    // -----------------------------------------------------------
    console.log("\n[TEST 6] Client can retrieve own pending documents");
    const docsRes = await fetch(`${BASE_URL}/api/client-portal/documents`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    const docsData = await docsRes.json();
    assert(docsRes.status === 200, `Status is 200 (got ${docsRes.status})`);
    assert(Array.isArray(docsData.data.documents), "Returned list of documents");
    assert(docsData.data.documents.length >= 3, `Has default requirements (found ${docsData.data.documents.length})`);
    const panReq = docsData.data.documents.find((d) => d.document_type === "PAN");
    assert(!!panReq, "Has PAN requirement");
    assert(panReq.can_upload === true, "can_upload is true for pending document");
    requirementId = panReq.id;

    // -----------------------------------------------------------
    // TEST 7: Client can upload a valid document
    // -----------------------------------------------------------
    console.log("\n[TEST 7] Client can upload a valid document");
    const validPdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Title (Test Document) >>\nendobj\ntrailer\n<<>>\n%%EOF"
    );
    const validBlob = new Blob([validPdfBuffer], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", validBlob, "test_pan_card.pdf");

    const uploadRes = await fetch(`${BASE_URL}/api/client-portal/documents/${requirementId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${client1Token}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201, `Status is 201 Created (got ${uploadRes.status})`);
    assert(uploadData.success === true, "Upload returned success: true");
    assert(uploadData.data.document.status === "UNDER_REVIEW", "Document requirement status is UNDER_REVIEW");
    assert(!!uploadData.data.document.document_id, "Returned document_id in client_documents");
    uploadedDocId = uploadData.data.document.document_id;

    // Verify own document download/view
    const downloadRes = await fetch(`${BASE_URL}/api/client-portal/documents/${uploadedDocId}?download=true`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    assert(downloadRes.status === 200, `Owner can download own document (got ${downloadRes.status})`);
    const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer());
    assert(downloadedBuf.slice(0, 4).toString() === "%PDF", "Downloaded buffer matches original decrypted PDF");

    // -----------------------------------------------------------
    // TEST 8: Client cannot upload or access another client's document
    // -----------------------------------------------------------
    console.log("\n[TEST 8] Client cannot upload/access another client's document (Cross-client IDOR protection)");
    // Log in as Client 2 (Vivaan Patel)
    const client2Login = await fetch(`${BASE_URL}/api/client-portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_no: "9876500001" }),
    });
    const client2ResData = await client2Login.json();
    client2Token = client2ResData.data.token;
    client2Data = client2ResData.data.client;

    // Client 2 attempts to download Client 1's document
    const crossDownloadRes = await fetch(`${BASE_URL}/api/client-portal/documents/${uploadedDocId}`, {
      headers: { Authorization: `Bearer ${client2Token}` },
    });
    assert(crossDownloadRes.status === 403, `Cross-client download is rejected with 403 Forbidden (got ${crossDownloadRes.status})`);

    // Client 2 attempts to upload against Client 1's document requirement
    const crossFormData = new FormData();
    crossFormData.append("file", validBlob, "malicious_overwrite.pdf");
    const crossUploadRes = await fetch(`${BASE_URL}/api/client-portal/documents/${requirementId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${client2Token}` },
      body: crossFormData,
    });
    assert(crossUploadRes.status === 403, `Cross-client upload is rejected with 403 Forbidden (got ${crossUploadRes.status})`);

    // -----------------------------------------------------------
    // TEST 9: Invalid file type is rejected
    // -----------------------------------------------------------
    console.log("\n[TEST 9] Invalid file type is rejected");
    const badFileBuf = Buffer.from("MZ\x90\x00\x03\x00\x00\x00FakeWindowsExecutableFileBytes");
    const badBlob = new Blob([badFileBuf], { type: "application/octet-stream" });
    const badFormData = new FormData();
    badFormData.append("file", badBlob, "danger.exe");

    const badUploadRes = await fetch(`${BASE_URL}/api/client-portal/documents/${requirementId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${client1Token}` },
      body: badFormData,
    });
    assert(badUploadRes.status === 400, `Non-whitelisted file type is rejected with 400 (got ${badUploadRes.status})`);

    // -----------------------------------------------------------
    // TEST 10: Logout / revocation works
    // -----------------------------------------------------------
    console.log("\n[TEST 10] Logout / revocation works");
    const logoutRes = await fetch(`${BASE_URL}/api/client-portal/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    assert(logoutRes.status === 200, `Logout returns 200 (got ${logoutRes.status})`);

    // Attempting to access profile with revoked token
    const afterLogoutRes = await fetch(`${BASE_URL}/api/client-portal/profile`, {
      headers: { Authorization: `Bearer ${client1Token}` },
    });
    assert(afterLogoutRes.status === 401, `Revoked session token returns 401 Unauthorized (got ${afterLogoutRes.status})`);

    // -----------------------------------------------------------
    // TEST 11: Document upload creates the expected internal notification
    // -----------------------------------------------------------
    console.log("\n[TEST 11] Document upload creates internal CRM notification");
    const notifQuery = await pool.query(
      `SELECT id, recipient_user_id, type, title, message, entity_type, entity_id 
       FROM notifications 
       WHERE entity_id = $1 AND entity_type = 'DOCUMENT'
       ORDER BY id DESC LIMIT 5`,
      [uploadedDocId]
    );
    assert(notifQuery.rows.length > 0, `Database notification generated for document #${uploadedDocId}`);
    const latestNotif = notifQuery.rows[0];
    assert(latestNotif.type === "DOCUMENT_PENDING", `Notification type is 'DOCUMENT_PENDING' (got ${latestNotif.type})`);
    assert(latestNotif.message.includes("Aarav Sharma"), `Notification message mentions client: "${latestNotif.message}"`);

    // -----------------------------------------------------------
    // TEST 12: Existing Admin/Staff authentication tests continue to pass
    // -----------------------------------------------------------
    console.log("\n[TEST 12] Existing Admin/Staff authentication continues to pass");
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "password123" }),
    });
    
    assert(adminLoginRes.status === 200, `Admin login returns 200 (got ${adminLoginRes.status})`);
    const adminLoginData = await adminLoginRes.json();
    const adminTokenToTest = adminLoginData.data.accessToken || adminLoginData.data.token;
    assert(!!adminTokenToTest, "Admin received valid access token");

    // Verify admin can access CRM admin endpoints
    const adminMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminTokenToTest}` },
    });
    assert(adminMeRes.status === 200, "Admin can authenticate against CRM /api/auth/me");

    // Verify Admin token CANNOT be used on client portal endpoints
    const adminOnClientPortal = await fetch(`${BASE_URL}/api/client-portal/profile`, {
      headers: { Authorization: `Bearer ${adminTokenToTest}` },
    });
    assert(adminOnClientPortal.status === 401, "Admin token is cryptographically isolated and rejected by Client Portal");


    console.log("\n==========================================================");
    console.log(`   ALL TESTS COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("==========================================================\n");
  } catch (err) {
    console.error("Test execution halted with error:", err);
  } finally {
    await pool.end();
  }
}

runTests();
