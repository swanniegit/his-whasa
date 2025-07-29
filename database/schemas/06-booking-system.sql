-- Booking System Plugin Module Schema
-- Adapted from PHP/MySQL system to Supabase PostgreSQL

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Nurse/Staff Reference Table
CREATE TABLE IF NOT EXISTS nurse_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    professional_registration VARCHAR(100),
    specialization VARCHAR(100),
    contact_number VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    color_code VARCHAR(7) DEFAULT '#ff6b9d', -- Default color for visual coding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intervention Types Reference Table
CREATE TABLE IF NOT EXISTS intervention_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Places/Locations Reference Table
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    facility_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nurse Bookings Table
CREATE TABLE IF NOT EXISTS nurse_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nurse_id UUID REFERENCES nurse_staff(id) ON DELETE RESTRICT,
    patient_name VARCHAR(255) NOT NULL,
    patient_id_case_assess VARCHAR(100),
    booking_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    intervention_type_id UUID REFERENCES intervention_types(id) ON DELETE RESTRICT,
    place_id UUID REFERENCES places(id) ON DELETE RESTRICT,
    outstanding_amount DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_method VARCHAR(20) DEFAULT 'pending' CHECK (payment_method IN ('cash', 'credit_card', 'pending')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nurse On-Call Table
CREATE TABLE IF NOT EXISTS nurse_oncall (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nurse_id UUID NOT NULL REFERENCES nurse_staff(id) ON DELETE CASCADE,
    oncall_date DATE NOT NULL,
    call_type VARCHAR(20) NOT NULL CHECK (call_type IN ('first_call', 'second_call')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nurse_id, oncall_date, call_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nurse_bookings_date ON nurse_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_nurse_bookings_nurse_date ON nurse_bookings(nurse_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_nurse_bookings_time ON nurse_bookings(slot_time);
CREATE INDEX IF NOT EXISTS idx_nurse_bookings_patient ON nurse_bookings(patient_id_case_assess);
CREATE INDEX IF NOT EXISTS idx_nurse_oncall_date ON nurse_oncall(oncall_date);
CREATE INDEX IF NOT EXISTS idx_nurse_oncall_nurse ON nurse_oncall(nurse_id);

-- Enable Row Level Security
ALTER TABLE nurse_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurse_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurse_oncall ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nurse_staff
CREATE POLICY "Users can view active nurse staff" ON nurse_staff
    FOR SELECT USING (is_active = true);

CREATE POLICY "Nurses and admins can manage nurse staff" ON nurse_staff
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

-- RLS Policies for intervention_types
CREATE POLICY "Users can view active intervention types" ON intervention_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Nurses and admins can manage intervention types" ON intervention_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

-- RLS Policies for places
CREATE POLICY "Users can view active places" ON places
    FOR SELECT USING (is_active = true);

CREATE POLICY "Nurses and admins can manage places" ON places
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

-- RLS Policies for nurse_bookings
CREATE POLICY "Users can view bookings" ON nurse_bookings
    FOR SELECT USING (true);

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

CREATE POLICY "Admins can manage all bookings" ON nurse_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name = 'administrator'
        )
    );

-- RLS Policies for nurse_oncall
CREATE POLICY "Users can view oncall assignments" ON nurse_oncall
    FOR SELECT USING (true);

CREATE POLICY "Nurses and admins can manage oncall assignments" ON nurse_oncall
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN user_roles_ref urr ON ur.role_id = urr.id
            WHERE ur.user_id = auth.uid() AND urr.role_name IN ('administrator', 'wound_specialist_nurse')
        )
    );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_nurse_staff_updated_at BEFORE UPDATE ON nurse_staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_types_updated_at BEFORE UPDATE ON intervention_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_bookings_updated_at BEFORE UPDATE ON nurse_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_oncall_updated_at BEFORE UPDATE ON nurse_oncall
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO nurse_staff (name, professional_registration, specialization, color_code) VALUES
('Nurse Pink', 'NUR001', 'Wound Care Specialist', '#ff6b9d'),
('Nurse Purple', 'NUR002', 'Wound Care Specialist', '#8b5cf6'),
('Nurse Cyan', 'NUR003', 'Wound Care Specialist', '#06b6d4'),
('Nurse Green', 'NUR004', 'Wound Care Specialist', '#10b981'),
('Nurse Orange', 'NUR005', 'Wound Care Specialist', '#f59e0b'),
('Nurse Red', 'NUR006', 'Wound Care Specialist', '#ef4444'),
('Nurse Brown', 'NUR007', 'Wound Care Specialist', '#8b5a2b'),
('Nurse Gray', 'NUR008', 'Wound Care Specialist', '#6b7280')
ON CONFLICT DO NOTHING;

INSERT INTO intervention_types (name, description, duration_minutes) VALUES
('Wound Assessment', 'Comprehensive wound evaluation and documentation', 30),
('NPWT Application', 'Negative Pressure Wound Therapy setup and monitoring', 45),
('Dressing Change', 'Standard wound dressing application', 30),
('Debridement', 'Surgical or mechanical debridement procedure', 60),
('Compression Therapy', 'Compression bandaging application', 45),
('Patient Education', 'Wound care education and instruction', 30),
('Follow-up Visit', 'Routine follow-up assessment', 30),
('Emergency Assessment', 'Urgent wound evaluation', 45)
ON CONFLICT DO NOTHING;

INSERT INTO places (name, facility_type) VALUES
('Main Clinic', 'Outpatient Clinic'),
('Wound Care Unit', 'Specialized Unit'),
('Home Visit', 'Mobile Service'),
('Hospital Ward A', 'Inpatient'),
('Hospital Ward B', 'Inpatient'),
('Emergency Department', 'Emergency Care'),
('Operating Theatre', 'Surgical Suite'),
('Rehabilitation Center', 'Rehabilitation')
ON CONFLICT DO NOTHING;