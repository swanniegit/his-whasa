-- Fix Booking System RLS Policies
-- This script updates the RLS policies to allow wound_specialist_nurse role access

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage nurse staff" ON nurse_staff;
DROP POLICY IF EXISTS "Admins can manage intervention types" ON intervention_types;
DROP POLICY IF EXISTS "Admins can manage places" ON places;
DROP POLICY IF EXISTS "Users can create bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Admins can manage oncall assignments" ON nurse_oncall;

-- Create updated policies that include wound_specialist_nurse role
CREATE POLICY "Nurses and admins can manage nurse staff" ON nurse_staff
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

CREATE POLICY "Nurses and admins can manage intervention types" ON intervention_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

CREATE POLICY "Nurses and admins can manage places" ON places
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

CREATE POLICY "Nurses and admins can create bookings" ON nurse_bookings
    FOR INSERT WITH CHECK (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

CREATE POLICY "Nurses and admins can update bookings" ON nurse_bookings
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = updated_by OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

CREATE POLICY "Nurses and admins can manage oncall assignments" ON nurse_oncall
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

-- TEMPORARY: More permissive policies for testing (run this section if the above policies are too restrictive)
-- This allows any authenticated user to access the booking system tables
-- Remove these policies once role assignment is working properly

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Nurses and admins can manage nurse staff" ON nurse_staff;
DROP POLICY IF EXISTS "Nurses and admins can manage intervention types" ON intervention_types;
DROP POLICY IF EXISTS "Nurses and admins can manage places" ON places;
DROP POLICY IF EXISTS "Nurses and admins can create bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Nurses and admins can update bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Nurses and admins can manage oncall assignments" ON nurse_oncall;

-- Create permissive policies for testing
CREATE POLICY "Allow authenticated users to manage nurse staff" ON nurse_staff
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage intervention types" ON intervention_types
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage places" ON places
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage bookings" ON nurse_bookings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage oncall assignments" ON nurse_oncall
    FOR ALL USING (auth.role() = 'authenticated');