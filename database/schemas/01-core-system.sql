-- WHASA Database Schema - Module 1: Core System
-- Users, Roles, Facilities, and Authentication

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- REFERENCE TABLES (Single-select only)
-- =====================================================

-- User roles reference table
CREATE TABLE user_roles_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facility types reference table
CREATE TABLE facility_types_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    professional_registration VARCHAR(50), -- SANC registration number
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    two_factor_secret VARCHAR(32),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles junction table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES user_roles_ref(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Facilities table
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(200) NOT NULL,
    facility_type_id UUID REFERENCES facility_types_ref(id),
    address JSONB, -- structured address data
    contact_person VARCHAR(200),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    license_number VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default user roles
INSERT INTO user_roles_ref (role_name, description, permissions) VALUES
('wound_specialist_nurse', 'Wound specialist registered nurse', '{"patient": ["create", "read", "update"], "assessment": ["create", "read", "update"], "care_plan": ["create", "read", "update"], "therapy": ["create", "read", "update"]}'),
('case_manager', 'Medical aid case manager', '{"patient": ["read"], "assessment": ["read"], "care_plan": ["read"], "reports": ["read"]}'),
('administrator', 'System administrator', '{"all": ["create", "read", "update", "delete"]}');

-- Insert default facility types
INSERT INTO facility_types_ref (type_name, description) VALUES
('hospital', 'General hospital or medical center'),
('clinic', 'Outpatient clinic or medical practice'),
('private_practice', 'Private medical practice'),
('home_care', 'Home healthcare service'),
('rehabilitation_center', 'Rehabilitation and therapy center');

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_professional_registration ON users(professional_registration);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

CREATE INDEX idx_facilities_name ON facilities(facility_name);
CREATE INDEX idx_facilities_type ON facilities(facility_type_id);
CREATE INDEX idx_facilities_active ON facilities(is_active);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_ref_updated_at BEFORE UPDATE ON user_roles_ref
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 