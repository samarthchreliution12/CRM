require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

async function runMigrations() {
  console.log("Starting database migrations...");
  try {
    const schemaPath = path.join(__dirname, "../../../database/schema/schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(sql);

    // Migration step: Add action column if missing & backfill existing records
    await pool.query(`
      ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR(50);
      UPDATE permissions
      SET action = SPLIT_PART(permission_key, '.', 2)
      WHERE (action IS NULL OR action = '') AND permission_key LIKE '%.%';
    `);

    console.log("Database migrations completed successfully.");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
