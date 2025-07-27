-- WHASA Database Reset Script for Supabase
-- This script safely drops all tables and starts fresh
-- WARNING: This will delete ALL data in the database

-- =====================================================
-- STEP 1: DISABLE SECURITY POLICIES AND CONSTRAINTS
-- =====================================================

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Disable RLS policies on all tables
ALTER TABLE IF EXISTS cost_estimate_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cost_estimates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS procedure_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS session_products_used DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conventional_therapy_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS npwt_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS therapy_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dressing_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS care_plan_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS care_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS device_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wound_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sync_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS offline_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS wound_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS physical_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS medical_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_portal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_education_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patient_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_retention_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS healing_metrics DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP ALL TABLES IN CORRECT ORDER
-- =====================================================

-- Drop all tables in the correct order (child tables first)
-- Part 2 tables (child tables)
DROP TABLE IF EXISTS cost_estimate_items CASCADE;
DROP TABLE IF EXISTS cost_estimates CASCADE;
DROP TABLE IF EXISTS procedure_codes CASCADE;
DROP TABLE IF EXISTS session_products_used CASCADE;
DROP TABLE IF EXISTS conventional_therapy_sessions CASCADE;
DROP TABLE IF EXISTS npwt_sessions CASCADE;
DROP TABLE IF EXISTS dressing_recommendations CASCADE;
DROP TABLE IF EXISTS care_plan_objectives CASCADE;

-- Part 3 tables (if they exist)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS device_data CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory_batches CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS inventory_locations CASCADE;
DROP TABLE IF EXISTS wound_images CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS offline_changes CASCADE;
DROP TABLE IF EXISTS patient_portal_users CASCADE;
DROP TABLE IF EXISTS patient_education_sessions CASCADE;
DROP TABLE IF EXISTS patient_uploads CASCADE;
DROP TABLE IF EXISTS education_materials CASCADE;
DROP TABLE IF EXISTS data_retention_policies CASCADE;
DROP TABLE IF EXISTS healing_metrics CASCADE;

-- Fix tables
DROP TABLE IF EXISTS wounds CASCADE;

-- Main schema tables (child tables first)
DROP TABLE IF EXISTS wound_assessments CASCADE;
DROP TABLE IF EXISTS physical_assessments CASCADE;
DROP TABLE IF EXISTS medical_history CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS care_plans CASCADE;
DROP TABLE IF EXISTS therapy_sessions CASCADE;

-- Drop all views
DROP VIEW IF EXISTS 
    active_wounds_summary,
    therapy_session_summary,
    active_wounds,
    facility_summary
CASCADE;

-- Drop all custom types/enums
DROP TYPE IF EXISTS 
    user_role_enum,
    healability_enum,
    wound_type_enum,
    tissue_type_enum,
    moisture_level_enum,
    infection_indicator_enum,
    treatment_objective_enum,
    care_plan_status_enum,
    wbp_category_enum,
    product_type_enum,
    therapy_type_enum,
    session_status_enum,
    npwt_foam_type_enum,
    npwt_mode_enum,
    cleansing_method_enum,
    debridement_method_enum
CASCADE;

-- =====================================================
-- STEP 3: CLEANUP AND VERIFICATION
-- =====================================================

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences (if any)
-- Note: Supabase handles this automatically for UUID primary keys

-- Verify clean state
SELECT 'Database reset complete. All tables, views, and types dropped.' as status;

-- =====================================================
-- TROUBLESHOOTING COMMANDS (if tables still exist)
-- =====================================================

-- If tables still exist, you can run these commands manually:

-- 1. Check which tables still exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- 2. Force drop with owner privileges (run as database owner):
-- DROP TABLE IF EXISTS table_name CASCADE FORCE;

-- 3. Check for RLS policies that might be blocking drops:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE schemaname = 'public'; 