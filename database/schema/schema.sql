-- CRM Database Schema - Authentication, Authorization & Client Module

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

-- Ensure action column exists if table already existed without it
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
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Drop client_categories table if it previously existed
DROP TABLE IF EXISTS client_categories CASCADE;

-- 6. Clients Table
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

-- Safe migrations for removed or added columns
ALTER TABLE clients DROP COLUMN IF EXISTS category_id;
ALTER TABLE clients DROP COLUMN IF EXISTS assigned_staff_id;
ALTER TABLE clients DROP COLUMN IF EXISTS family_head;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_name VARCHAR(150);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- 7. Client Family Members Table
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

-- Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON permissions(module, action);

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
