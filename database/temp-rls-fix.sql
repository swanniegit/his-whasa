-- Temporary RLS Fix for Booking System
-- This allows all authenticated users to access the booking system tables
-- Run this in Supabase SQL Editor to test if the issue is with user_roles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view active nurse staff" ON nurse_staff;
DROP POLICY IF EXISTS "Nurses and admins can manage nurse staff" ON nurse_staff;
DROP POLICY IF EXISTS "Users can view active intervention types" ON intervention_types;
DROP POLICY IF EXISTS "Nurses and admins can manage intervention types" ON intervention_types;
DROP POLICY IF EXISTS "Users can view active places" ON places;
DROP POLICY IF EXISTS "Nurses and admins can manage places" ON places;
DROP POLICY IF EXISTS "Users can view bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Nurses and admins can create bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Nurses and admins can update bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON nurse_bookings;
DROP POLICY IF EXISTS "Users can view oncall assignments" ON nurse_oncall;
DROP POLICY IF EXISTS "Nurses and admins can manage oncall assignments" ON nurse_oncall;

-- Create simple policies that allow all authenticated users
CREATE POLICY "All authenticated users can view nurse staff" ON nurse_staff
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can manage nurse staff" ON nurse_staff
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can view intervention types" ON intervention_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can manage intervention types" ON intervention_types
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can view places" ON places
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can manage places" ON places
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can view bookings" ON nurse_bookings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can create bookings" ON nurse_bookings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update bookings" ON nurse_bookings
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can view oncall assignments" ON nurse_oncall
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can manage oncall assignments" ON nurse_oncall
    FOR ALL USING (auth.uid() IS NOT NULL);