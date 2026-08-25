require("dotenv").config();
const pool = require("../config/database");

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

async function runClientDBTests() {
  console.log("\n=========================================");
  console.log("  CRM Client Module Database Test Suite  ");
  console.log("=========================================\n");

  const client = await pool.connect();

  try {
    // 1. Table Verification
    console.log("--- 1. Database Table Verification ---");
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('client_types', 'clients', 'client_family_members')
    `);
    const tableNames = tablesRes.rows.map((r) => r.table_name);

    assert(tableNames.includes("client_types"), "client_types table exists");
    assert(tableNames.includes("clients"), "clients table exists");
    assert(tableNames.includes("client_family_members"), "client_family_members table exists");

    // 2. Client Types Seed Verification
    console.log("\n--- 2. Client Types Seed Verification ---");
    const typesRes = await client.query("SELECT * FROM client_types ORDER BY id ASC");
    const typeNames = typesRes.rows.map((r) => r.name);
    assert(typesRes.rows.length === 5, "5 client types seeded");
    assert(typeNames.includes("Individual"), "Client type 'Individual' seeded");
    assert(typeNames.includes("HUF"), "Client type 'HUF' seeded");
    assert(typeNames.includes("Company"), "Client type 'Company' seeded");
    assert(typeNames.includes("Trust"), "Client type 'Trust' seeded");
    assert(typeNames.includes("NRI"), "Client type 'NRI' seeded");

    const individualType = typesRes.rows.find((r) => r.name === "Individual");

    // 3. Client Insertion & Foreign Keys Verification
    console.log("\n--- 3. Client Insertion & Foreign Keys ---");

    const newClientRes = await client.query(
      `INSERT INTO clients (
        ucc_no, name, mobile_no, whatsapp_no, email, pan, dob, gender, occupation,
        client_type_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, ucc_no, name`,
      [
        "UCC1001", "John Doe Client", "9876543210", "9876543210", "johndoe@client.com",
        "ABCDE1234F", "1990-01-01", "Male", "Business",
        individualType.id, "active"
      ]
    );
    const dbClient = newClientRes.rows[0];
    assert(dbClient.ucc_no === "UCC1001", "Inserted client with UCC number UCC1001");

    // 4. UCC Uniqueness Constraint Verification
    console.log("\n--- 4. UCC Uniqueness Constraint ---");
    let duplicateUccFailed = false;
    try {
      await client.query(
        `INSERT INTO clients (ucc_no, name, client_type_id)
         VALUES ($1, $2, $3)`,
        ["UCC1001", "Another Client", individualType.id]
      );
    } catch (err) {
      duplicateUccFailed = err.code === "23505";
    }
    assert(duplicateUccFailed, "Duplicate UCC number rejected (23505 Unique Constraint)");

    // 5. Client Family Member Insertion & Cascading Delete Verification
    console.log("\n--- 5. Family Member FK & Cascading Deletion ---");
    const fmRes = await client.query(
      `INSERT INTO client_family_members (client_id, relationship, name, email, mobile_no, pan_no)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [dbClient.id, "Spouse", "Jane Doe", "janedoe@client.com", "9876543211", "ABCDE5678G"]
    );
    const fmId = fmRes.rows[0].id;
    assert(Boolean(fmId), "Inserted family member referencing clients.id");

    // Delete client and verify cascading deletion of family members
    await client.query("DELETE FROM clients WHERE id = $1", [dbClient.id]);
    const checkFmRes = await client.query("SELECT * FROM client_family_members WHERE id = $1", [fmId]);
    assert(checkFmRes.rows.length === 0, "Deleting client automatically cascades and deletes family members");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    client.release();
    await pool.end();
    console.log("\n=========================================");
    console.log(`  Client DB Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runClientDBTests();
