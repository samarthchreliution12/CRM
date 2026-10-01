/**
 * Database Migration Script: Seed Menu and Submenu Permissions
 * 
 * Safely and idempotently inserts any missing permissions for all CRM sidebar
 * menus and submodules, and grants the Admin role (ID 1) full access to them.
 * 
 * Conforms to:
 * - staff.view, staff.create, staff.edit, staff.delete
 * - role.view, role.create, role.edit, role.delete
 * - permission.view, permission.edit
 * - audit.view
 * - communication.view, communication.create, communication.edit
 * - calendar.view, calendar.create, calendar.edit, calendar.delete
 */

require("dotenv").config();
const pool = require("../config/database");

const MENU_PERMISSIONS = [
  // Settings: Staff / Users
  { permission_key: "staff.view", module: "staff", action: "view", description: "View staff user directory and profiles" },
  { permission_key: "staff.create", module: "staff", action: "create", description: "Create and invite new staff members" },
  { permission_key: "staff.edit", module: "staff", action: "edit", description: "Update staff member profiles and access status" },
  { permission_key: "staff.delete", module: "staff", action: "delete", description: "Delete staff user accounts" },

  // Settings: Roles & Groups
  { permission_key: "role.view", module: "role", action: "view", description: "View user roles and groups" },
  { permission_key: "role.create", module: "role", action: "create", description: "Create user roles and access groups" },
  { permission_key: "role.edit", module: "role", action: "edit", description: "Update user roles and assigned capabilities" },
  { permission_key: "role.delete", module: "role", action: "delete", description: "Delete user roles and groups" },

  // Settings: Permissions
  { permission_key: "permission.view", module: "permission", action: "view", description: "View system permission matrix" },
  { permission_key: "permission.edit", module: "permission", action: "edit", description: "Configure role-permission assignments" },

  // Settings: Audit Logs
  { permission_key: "audit.view", module: "audit", action: "view", description: "View system audit logs and activity history" },

  // Communication: Internal Communication
  { permission_key: "communication.view", module: "communication", action: "view", description: "View internal chat conversations and messages" },
  { permission_key: "communication.create", module: "communication", action: "create", description: "Create internal chat channels and send messages" },
  { permission_key: "communication.edit", module: "communication", action: "edit", description: "Edit or manage internal chat messages" },

  // Calendar
  { permission_key: "calendar.view", module: "calendar", action: "view", description: "View calendar schedules and events" },
  { permission_key: "calendar.create", module: "calendar", action: "create", description: "Create calendar events and scheduled tasks" },
  { permission_key: "calendar.edit", module: "calendar", action: "edit", description: "Update calendar events and schedules" },
  { permission_key: "calendar.delete", module: "calendar", action: "delete", description: "Delete calendar events and schedules" },
];

async function seedMenuPermissions() {
  console.log("Seeding menu permissions into database...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get Admin role ID
    const adminRoleRes = await client.query("SELECT id FROM roles WHERE name = 'Admin' LIMIT 1");
    if (adminRoleRes.rows.length === 0) {
      throw new Error("Admin role not found in database.");
    }
    const adminRoleId = adminRoleRes.rows[0].id;
    console.log(`Found Admin role with ID: ${adminRoleId}`);

    // 2. Insert permissions safely with ON CONFLICT DO UPDATE
    let insertedCount = 0;
    for (const p of MENU_PERMISSIONS) {
      const res = await client.query(
        `INSERT INTO permissions (permission_key, module, action, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (permission_key) DO UPDATE
         SET description = EXCLUDED.description,
             module = EXCLUDED.module,
             action = EXCLUDED.action,
             updated_at = CURRENT_TIMESTAMP
         RETURNING id, permission_key`,
        [p.permission_key, p.module, p.action, p.description]
      );

      const permId = res.rows[0].id;
      insertedCount++;

      // 3. Grant to Admin role safely with ON CONFLICT DO NOTHING
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [adminRoleId, permId]
      );
    }

    await client.query("COMMIT");
    console.log(`Successfully seeded ${insertedCount} menu permissions and granted full access to Admin!`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed menu permissions:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedMenuPermissions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
