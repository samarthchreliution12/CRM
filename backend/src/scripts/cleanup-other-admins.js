const pool = require("../config/database");

async function cleanupOtherAdmins() {
  const client = await pool.connect();
  try {
    console.log("=== Cleaning Up Other Admin Users ===");
    await client.query("BEGIN");

    // 1. Get primary admin user (admin@gmail.com)
    const primaryAdminRes = await client.query(
      `SELECT id, email, name FROM users WHERE LOWER(email) = 'admin@gmail.com'`
    );

    if (primaryAdminRes.rows.length === 0) {
      throw new Error("Primary admin user 'admin@gmail.com' not found in database!");
    }

    const primaryAdmin = primaryAdminRes.rows[0];
    console.log(`✓ Primary Admin found: ID ${primaryAdmin.id} (${primaryAdmin.email})`);

    // 2. Get all other Admin users (role_id = 1 or role_name = 'Admin', email != 'admin@gmail.com')
    const otherAdminsRes = await client.query(
      `SELECT u.id, u.name, u.email, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE LOWER(r.name) = 'admin' AND LOWER(u.email) != 'admin@gmail.com'`
    );

    const otherAdmins = otherAdminsRes.rows;
    console.log(`Found ${otherAdmins.length} other Admin user(s) to remove:`);
    console.table(otherAdmins);

    if (otherAdmins.length === 0) {
      console.log("No extra admin users to delete.");
      await client.query("COMMIT");
      process.exit(0);
    }

    const otherAdminIds = otherAdmins.map((u) => u.id);

    // 3. Reassign dependent FK references to primaryAdmin.id
    console.log("-> Reassigning dependent foreign key references to primary admin ID:", primaryAdmin.id);

    const updateQueries = [
      `UPDATE audit_logs SET user_id = $1 WHERE user_id = ANY($2::int[])`,
      `UPDATE document_audit_logs SET user_id = $1 WHERE user_id = ANY($2::int[])`,
      `UPDATE client_documents SET uploaded_by = $1 WHERE uploaded_by = ANY($2::int[])`,
      `UPDATE client_documents SET verified_by = $1 WHERE verified_by = ANY($2::int[])`,
      `UPDATE internal_conversations SET created_by = $1 WHERE created_by = ANY($2::int[])`,
      `UPDATE internal_conversation_members SET user_id = $1 WHERE user_id = ANY($2::int[])`,
      `UPDATE internal_messages SET sender_id = $1 WHERE sender_id = ANY($2::int[])`,
      `UPDATE leads SET assigned_to = $1 WHERE assigned_to = ANY($2::int[])`,
      `UPDATE leads SET created_by = $1 WHERE created_by = ANY($2::int[])`,
      `UPDATE tasks SET assigned_to = $1 WHERE assigned_to = ANY($2::int[])`,
      `UPDATE tasks SET created_by = $1 WHERE created_by = ANY($2::int[])`,
      `UPDATE whatsapp_settings SET created_by = $1 WHERE created_by = ANY($2::int[])`,
    ];

    for (const q of updateQueries) {
      try {
        const res = await client.query(q, [primaryAdmin.id, otherAdminIds]);
        console.log(`✓ Executed FK update: ${res.rowCount} row(s) updated.`);
      } catch (err) {
        console.warn(`Warning executing query (${q}):`, err.message);
      }
    }

    // Also remove duplicate member entries in internal_conversation_members if primaryAdmin is already in conversation
    await client.query(`
      DELETE FROM internal_conversation_members m1
      USING internal_conversation_members m2
      WHERE m1.conversation_id = m2.conversation_id
        AND m1.user_id = $1
        AND m2.user_id = $1
        AND m1.ctid < m2.ctid
    `, [primaryAdmin.id]);

    // 4. Delete other admin users
    const deleteRes = await client.query(
      `DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id, name, email`,
      [otherAdminIds]
    );

    console.log(`\n✓ Deleted ${deleteRes.rowCount} other Admin user account(s):`);
    console.table(deleteRes.rows);

    await client.query("COMMIT");

    // 5. Verify remaining users
    const remainingUsers = await client.query(
      `SELECT u.id, u.name, u.email, u.status, r.name AS role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.id ASC`
    );
    console.log("\n=== Remaining Users in Database ===");
    console.table(remainingUsers.rows);

    console.log("\n=== ALL OTHER ADMIN USERS REMOVED SUCCESSFULLY! ===");
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

cleanupOtherAdmins();
