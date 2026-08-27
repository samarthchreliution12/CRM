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

    // Migration step 1: Add action column if missing & backfill existing permissions
    await pool.query(`
      ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR(50);
      UPDATE permissions
      SET action = SPLIT_PART(permission_key, '.', 2)
      WHERE (action IS NULL OR action = '') AND permission_key LIKE '%.%';
    `);

    // Migration step 2: Ensure client_types and client_services tables and indexes exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS client_services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS client_service_assignments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        service_id INTEGER NOT NULL REFERENCES client_services(id) ON DELETE RESTRICT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT unique_client_service UNIQUE (client_id, service_id)
      );

      CREATE INDEX IF NOT EXISTS idx_csa_client_id ON client_service_assignments(client_id);
      CREATE INDEX IF NOT EXISTS idx_csa_service_id ON client_service_assignments(service_id);
    `);

    // Migration step 3: Migrate existing JSONB services in clients table to client_service_assignments
    const clientsWithServices = await pool.query(`SELECT id, services FROM clients WHERE services IS NOT NULL AND services != '[]'::jsonb`);
    for (const clientRow of clientsWithServices.rows) {
      let serviceNames = [];
      if (Array.isArray(clientRow.services)) {
        serviceNames = clientRow.services;
      } else if (typeof clientRow.services === "string") {
        try {
          serviceNames = JSON.parse(clientRow.services);
        } catch (e) {
          serviceNames = [clientRow.services];
        }
      }

      for (const name of serviceNames) {
        if (!name || typeof name !== "string") continue;
        let serviceRes = await pool.query(`SELECT id FROM client_services WHERE LOWER(name) = LOWER($1)`, [name.trim()]);
        let serviceId;
        if (serviceRes.rows.length === 0) {
          const insRes = await pool.query(
            `INSERT INTO client_services (name, description, status) VALUES ($1, $2, 'active') RETURNING id`,
            [name.trim(), `${name.trim()} service`]
          );
          serviceId = insRes.rows[0].id;
        } else {
          serviceId = serviceRes.rows[0].id;
        }

        await pool.query(
          `INSERT INTO client_service_assignments (client_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [clientRow.id, serviceId]
        );
      }
    }

    // Migration step 4: Ensure whatsapp_templates table and index exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id SERIAL PRIMARY KEY,
        template_id VARCHAR(100) UNIQUE NOT NULL,
        template_name VARCHAR(150),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_template_id ON whatsapp_templates(template_id);
    `);

    // Migration step 5: Ensure client_documents and document_audit_logs tables and indexes exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        document_name VARCHAR(150),
        original_file_name VARCHAR(255) NOT NULL,
        stored_file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        encryption_version VARCHAR(20) DEFAULT 'v1' NOT NULL,
        encryption_key_id VARCHAR(50) DEFAULT 'default' NOT NULL,
        iv VARCHAR(255) NOT NULL,
        auth_tag VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS document_name VARCHAR(150);
      ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING' NOT NULL;
      ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE client_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

      CREATE TABLE IF NOT EXISTS document_audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        document_id INTEGER REFERENCES client_documents(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_client_docs_client_id ON client_documents(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_docs_type ON client_documents(document_type);
      CREATE INDEX IF NOT EXISTS idx_client_docs_status ON client_documents(status);
      CREATE INDEX IF NOT EXISTS idx_doc_audit_client ON document_audit_logs(client_id);
      CREATE INDEX IF NOT EXISTS idx_doc_audit_doc ON document_audit_logs(document_id);
    `);

    // Migration step 6: Ensure internal communication tables and indexes exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS internal_conversations (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        name VARCHAR(150),
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS internal_conversation_members (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES internal_conversations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        left_at TIMESTAMP WITH TIME ZONE,
        last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT unique_conversation_member UNIQUE (conversation_id, user_id)
      );

      ALTER TABLE internal_conversation_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

      CREATE TABLE IF NOT EXISTS internal_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES internal_conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE,
        read_at TIMESTAMP WITH TIME ZONE
      );

      ALTER TABLE internal_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

      CREATE INDEX IF NOT EXISTS idx_internal_conv_type ON internal_conversations(type);
      CREATE INDEX IF NOT EXISTS idx_internal_conv_members_user ON internal_conversation_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_internal_conv_members_conv ON internal_conversation_members(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_internal_messages_conv ON internal_messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_internal_messages_sender ON internal_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_internal_messages_read_at ON internal_messages(read_at);
    `);

    // Migration step 7: Clean up communication & calendar permissions and ensure dashboard permission exists
    await pool.query(`
      DELETE FROM permissions WHERE module IN ('communication', 'calendar') OR permission_key LIKE 'communication.%' OR permission_key LIKE 'calendar.%';

      INSERT INTO permissions (permission_key, description, module, action)
      VALUES 
        ('dashboard.view', 'View dashboard statistics and analytics', 'dashboard', 'view')
      ON CONFLICT (permission_key) DO UPDATE SET 
        description = EXCLUDED.description, 
        module = EXCLUDED.module, 
        action = EXCLUDED.action, 
        updated_at = CURRENT_TIMESTAMP;
    `);

    // Migration step 8: Ensure audit_logs table and indexes exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        module VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        description TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    `);

    // Migration step 9: Ensure leads table, indexes, and permissions exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        mobile_no VARCHAR(20),
        whatsapp_no VARCHAR(20),
        email VARCHAR(150),
        company_name VARCHAR(150),
        client_type_id INTEGER REFERENCES client_types(id) ON DELETE SET NULL,
        source VARCHAR(50),
        service_id INTEGER REFERENCES client_services(id) ON DELETE SET NULL,
        status VARCHAR(30) DEFAULT 'new' NOT NULL,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        priority VARCHAR(20) DEFAULT 'medium' NOT NULL,
        next_follow_up_at TIMESTAMP WITH TIME ZONE,
        last_contacted_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        converted_client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        converted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
      CREATE INDEX IF NOT EXISTS idx_leads_client_type ON leads(client_type_id);
      CREATE INDEX IF NOT EXISTS idx_leads_service ON leads(service_id);
      CREATE INDEX IF NOT EXISTS idx_leads_converted_client ON leads(converted_client_id);
      CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_at);

      INSERT INTO permissions (permission_key, description, module, action)
      VALUES 
        ('lead.read', 'View lead records', 'lead', 'read'),
        ('lead.view', 'View lead records', 'lead', 'view'),
        ('lead.create', 'Create lead records', 'lead', 'create'),
        ('lead.update', 'Update lead records', 'lead', 'update'),
        ('lead.edit', 'Update lead records', 'lead', 'edit'),
        ('lead.assign', 'Assign lead records', 'lead', 'assign'),
        ('lead.delete', 'Delete lead records', 'lead', 'delete')
      ON CONFLICT (permission_key) DO UPDATE SET 
        description = EXCLUDED.description, 
        module = EXCLUDED.module, 
        action = EXCLUDED.action, 
        updated_at = CURRENT_TIMESTAMP;

      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name IN ('Admin', 'Staff') AND p.module = 'lead'
      ON CONFLICT DO NOTHING;
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
