-- Check User Roles and Permissions
-- Run this in Supabase SQL Editor to debug RLS issues

-- 1. Check if user_roles_ref table exists and has data
SELECT 'user_roles_ref table' as table_name, COUNT(*) as count FROM user_roles_ref;

-- 2. Check if user_roles table exists and has data
SELECT 'user_roles table' as table_name, COUNT(*) as count FROM user_roles;

-- 3. Check current user's roles (replace 'your-user-id' with actual user ID)
-- You can get your user ID from the auth.users table or from the browser console
SELECT 
    ur.user_id,
    urr.role_name
FROM user_roles ur
JOIN user_roles_ref urr ON ur.role_id = urr.id
WHERE ur.user_id = 'your-user-id'; -- Replace with your actual user ID

-- 4. Check if booking system tables exist and have data
SELECT 'nurse_staff' as table_name, COUNT(*) as count FROM nurse_staff;
SELECT 'intervention_types' as table_name, COUNT(*) as count FROM intervention_types;
SELECT 'places' as table_name, COUNT(*) as count FROM places;

-- 5. Test RLS policies by trying to select from tables
-- This will show if the current user can access the tables
SELECT 'nurse_staff test' as test_name, COUNT(*) as accessible_rows FROM nurse_staff WHERE is_active = true;
SELECT 'intervention_types test' as test_name, COUNT(*) as accessible_rows FROM intervention_types WHERE is_active = true;
SELECT 'places test' as test_name, COUNT(*) as accessible_rows FROM places WHERE is_active = true;

-- 6. Check RLS policies on booking system tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('nurse_staff', 'intervention_types', 'places', 'nurse_bookings', 'nurse_oncall')
ORDER BY tablename, policyname;