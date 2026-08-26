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
