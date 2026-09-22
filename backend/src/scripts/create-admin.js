require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/database");

async function createAdmin() {
  try {
    const hash = await bcrypt.hash("admin123", 10);
    const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'Admin'");
    const adminRoleId = roleRes.rows.length > 0 ? roleRes.rows[0].id : 1;

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'`,
      ["Admin User", "admin@gmail.com", hash, adminRoleId]
    );
    console.log("Admin account successfully created/updated:");
    console.log("Email: admin@gmail.com");
    console.log("Password: admin123");
  } catch (err) {
    console.error("Error creating admin account:", err);
  } finally {
    await pool.end();
  }
}

createAdmin();
