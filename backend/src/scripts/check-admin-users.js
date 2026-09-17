const pool = require("../config/database");

async function checkUsers() {
  try {
    console.log("=== Checking Users in Database ===");
    const res = await pool.query(
      `SELECT u.id, u.name, u.email, u.mobile, u.role_id, u.status, u.created_at, r.name AS role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.id ASC`
    );

    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error("Error checking users:", err);
    process.exit(1);
  }
}

checkUsers();
