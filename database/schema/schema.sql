-- CRM Database Schema - Authentication, Authorization, Client Types, Client Services, Client Module, WhatsApp & Secure Documents

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  permission_key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR(50);

-- 3. Role Permissions Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Client Types Table
CREATE TABLE IF NOT EXISTS client_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE client_types ALTER COLUMN name TYPE VARCHAR(100);

-- 6. Client Services Table
CREATE TABLE IF NOT EXISTS client_services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DROP TABLE IF EXISTS client_categories CASCADE;

-- 7. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  ucc_no VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  business_name VARCHAR(150),
  mobile_no VARCHAR(20),
  whatsapp_no VARCHAR(20),
  email VARCHAR(150),
  pan VARCHAR(20),
  dob DATE,
  gender VARCHAR(20),
  occupation VARCHAR(100),
  client_type_id INTEGER NOT NULL REFERENCES client_types(id),
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE clients DROP COLUMN IF EXISTS category_id;
ALTER TABLE clients DROP COLUMN IF EXISTS assigned_staff_id;
ALTER TABLE clients DROP COLUMN IF EXISTS family_head;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_name VARCHAR(150);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- 8. Client Service Assignments Table
CREATE TABLE IF NOT EXISTS client_service_assignments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES client_services(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_client_service UNIQUE (client_id, service_id)
);

-- 9. Client Family Members Table
CREATE TABLE IF NOT EXISTS client_family_members (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  mobile_no VARCHAR(20),
  pan_no VARCHAR(20),
  dob DATE,
  gender VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Secure Client Documents Table
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

-- 12. Document Audit Logs Table
CREATE TABLE IF NOT EXISTS document_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES client_documents(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions(module, action);

-- Client Types & Services Indexes
CREATE INDEX IF NOT EXISTS idx_client_types_name ON client_types(name);
CREATE INDEX IF NOT EXISTS idx_client_types_status ON client_types(status);
CREATE INDEX IF NOT EXISTS idx_client_services_name ON client_services(name);
CREATE INDEX IF NOT EXISTS idx_client_services_status ON client_services(status);

-- Client Service Assignments Indexes
CREATE INDEX IF NOT EXISTS idx_csa_client_id ON client_service_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_csa_service_id ON client_service_assignments(service_id);

-- Client Module Indexes
CREATE INDEX IF NOT EXISTS idx_clients_ucc_no ON clients(ucc_no);
CREATE INDEX IF NOT EXISTS idx_clients_business_name ON clients(business_name);
CREATE INDEX IF NOT EXISTS idx_clients_pan ON clients(pan);
CREATE INDEX IF NOT EXISTS idx_clients_mobile_no ON clients(mobile_no);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_client_type_id ON clients(client_type_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_family_members_client_id ON client_family_members(client_id);
CREATE INDEX IF NOT EXISTS idx_family_members_pan_no ON client_family_members(pan_no);
CREATE INDEX IF NOT EXISTS idx_family_members_mobile_no ON client_family_members(mobile_no);

-- WhatsApp Templates Index
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_template_id ON whatsapp_templates(template_id);

-- Client Documents & Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_client_docs_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_docs_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_docs_status ON client_documents(status);
CREATE INDEX IF NOT EXISTS idx_doc_audit_client ON document_audit_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_doc_audit_doc ON document_audit_logs(document_id);
