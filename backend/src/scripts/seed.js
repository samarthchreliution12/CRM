require("dotenv").config();
const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const ROLES = [
  { name: "Admin", description: "Full system administrator access", status: "active" },
  { name: "Staff", description: "Staff operational access", status: "active" },
  { name: "Client", description: "Client account access", status: "active" },
];

const CLIENT_TYPES = [
  { name: "Individual", description: "Individual retail client account", status: "active" },
  { name: "HUF", description: "Hindu Undivided Family account", status: "active" },
  { name: "Company", description: "Corporate corporate/institutional entity account", status: "active" },
  { name: "Trust", description: "Registered trust or non-profit account", status: "active" },
  { name: "NRI", description: "Non-Resident Individual account", status: "active" },
];

const PERMISSIONS = [
  // Client Module
  { permission_key: "client.view", module: "client", action: "view", description: "View client records" },
  { permission_key: "client.create", module: "client", action: "create", description: "Create new client records" },
  { permission_key: "client.edit", module: "client", action: "edit", description: "Update client records" },
  { permission_key: "client.delete", module: "client", action: "delete", description: "Delete client records" },

  // Lead Module
  { permission_key: "lead.view", module: "lead", action: "view", description: "View lead records" },
  { permission_key: "lead.create", module: "lead", action: "create", description: "Create new lead records" },
  { permission_key: "lead.edit", module: "lead", action: "edit", description: "Update lead records" },
  { permission_key: "lead.assign", module: "lead", action: "assign", description: "Assign lead records to staff members" },
  { permission_key: "lead.delete", module: "lead", action: "delete", description: "Delete lead records" },

  // Task Module
  { permission_key: "task.view", module: "task", action: "view", description: "View task records" },
  { permission_key: "task.create", module: "task", action: "create", description: "Create new task records" },
  { permission_key: "task.edit", module: "task", action: "edit", description: "Update task records" },
  { permission_key: "task.delete", module: "task", action: "delete", description: "Delete task records" },

  // Document Module
  { permission_key: "document.view", module: "document", action: "view", description: "View document records" },
  { permission_key: "document.create", module: "document", action: "create", description: "Upload document records" },
  { permission_key: "document.edit", module: "document", action: "edit", description: "Update document records" },
  { permission_key: "document.delete", module: "document", action: "delete", description: "Delete document records" },

  // Communication Module
  { permission_key: "communication.view", module: "communication", action: "view", description: "View communication logs" },
  { permission_key: "communication.create", module: "communication", action: "create", description: "Create communication logs" },
  { permission_key: "communication.edit", module: "communication", action: "edit", description: "Update communication logs" },
  { permission_key: "communication.delete", module: "communication", action: "delete", description: "Delete communication logs" },
];

const ROLE_PERMISSION_MAP = {
  Admin: PERMISSIONS.map((p) => p.permission_key),
  Staff: [
    "client.view", "client.create", "client.edit",
    "lead.view", "lead.create", "lead.edit",
    "task.view", "task.create", "task.edit",
    "document.view", "communication.view"
  ],
  Client: [
    "client.view"
  ]
};

async function seedDatabase() {
  console.log("Starting database seeding...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clean up any roles not in target list (e.g. Manager)
    const allowedRoleNames = ROLES.map((r) => r.name);
    await client.query("DELETE FROM roles WHERE name NOT IN ($1, $2, $3)", allowedRoleNames);

    // 1. Seed Roles
    const roleMap = {};
    for (const r of ROLES) {
      const res = await client.query(
        `INSERT INTO roles (name, description, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
         RETURNING id, name`,
        [r.name, r.description, r.status]
      );
      roleMap[r.name] = res.rows[0].id;
    }
    console.log("Seeded roles:", Object.keys(roleMap));

    // 2. Seed Client Types
    for (const ct of CLIENT_TYPES) {
      await client.query(
        `INSERT INTO client_types (name, description, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
        [ct.name, ct.description, ct.status]
      );
    }
    console.log("Seeded client types:", CLIENT_TYPES.map((ct) => ct.name));

    // 3. Seed Permissions
    const permMap = {};
    for (const p of PERMISSIONS) {
      const res = await client.query(
        `INSERT INTO permissions (permission_key, description, module, action)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (permission_key) DO UPDATE SET description = EXCLUDED.description, module = EXCLUDED.module, action = EXCLUDED.action, updated_at = CURRENT_TIMESTAMP
         RETURNING id, permission_key`,
        [p.permission_key, p.description, p.module, p.action]
      );
      permMap[p.permission_key] = res.rows[0].id;
    }
    console.log("Seeded permissions:", Object.keys(permMap).length, "permissions");

    // 4. Seed Role-Permissions Mapping
    for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
      const roleId = roleMap[roleName];
      if (!roleId) continue;

      for (const permKey of permKeys) {
        const permId = permMap[permKey];
        if (!permId) continue;

        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleId, permId]
        );
      }
    }
    console.log("Seeded role-permission mappings.");

    // 5. Optionally seed initial admin account if SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are provided
    if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
      const adminRoleId = roleMap["Admin"];
      const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 10);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (email) DO NOTHING`,
        ["System Admin", process.env.SEED_ADMIN_EMAIL, passwordHash, adminRoleId]
      );
      console.log(`Seeded admin user from environment: ${process.env.SEED_ADMIN_EMAIL}`);
    }

    await client.query("COMMIT");
    console.log("Database seeding completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
