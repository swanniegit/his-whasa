-- WHASA Database Schema - Module 4: Care Planning
-- Care plans, objectives, treatment frameworks

-- =====================================================
-- REFERENCE TABLES (Single-select only)
-- =====================================================

-- Care plan status reference table
CREATE TABLE care_plan_status_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment objective types reference table
CREATE TABLE treatment_objective_types_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'healing', 'maintenance', 'palliative'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CARE PLANNING TABLES
-- =====================================================

-- Care plans table
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    wound_id UUID REFERENCES wounds(id) ON DELETE CASCADE,
    care_plan_number INTEGER NOT NULL, -- sequential for patient
    status_id UUID REFERENCES care_plan_status_ref(id),
    start_date DATE NOT NULL,
    target_completion_date DATE,
    actual_completion_date DATE,
    primary_diagnosis VARCHAR(200),
    secondary_diagnoses TEXT[],
    treatment_goals TEXT,
    risk_factors JSONB, -- structured risk assessment
    contraindications TEXT[],
    special_instructions TEXT,
    family_involvement_required BOOLEAN DEFAULT FALSE,
    family_instructions TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, care_plan_number)
);

-- Care plan objectives table
CREATE TABLE care_plan_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_plan_id UUID REFERENCES care_plans(id) ON DELETE CASCADE,
    objective_type_id UUID REFERENCES treatment_objective_types_ref(id),
    objective_description TEXT NOT NULL,
    target_date DATE,
    priority VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    measurable_criteria TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    completion_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default care plan statuses
INSERT INTO care_plan_status_ref (status_name, description) VALUES
('draft', 'Care plan is in draft stage'),
('active', 'Care plan is currently active'),
('on_hold', 'Care plan is temporarily on hold'),
('completed', 'Care plan has been completed'),
('cancelled', 'Care plan has been cancelled');

-- Insert default treatment objective types
INSERT INTO treatment_objective_types_ref (objective_name, description, category) VALUES
('Wound healing', 'Achieve complete wound closure', 'healing'),
('Infection control', 'Control and eliminate infection', 'healing'),
('Pain management', 'Reduce pain to acceptable levels', 'healing'),
('Debridement', 'Remove non-viable tissue', 'healing'),
('Moisture balance', 'Maintain optimal wound moisture', 'healing'),
('Compression therapy', 'Implement appropriate compression', 'healing'),
('Offloading', 'Reduce pressure on wound area', 'healing'),
('Education', 'Patient and caregiver education', 'maintenance'),
('Prevention', 'Prevent wound recurrence', 'maintenance'),
('Symptom control', 'Manage symptoms without healing', 'palliative'),
('Quality of life', 'Improve overall quality of life', 'palliative');

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_care_plans_patient ON care_plans(patient_id);
CREATE INDEX idx_care_plans_wound ON care_plans(wound_id);
CREATE INDEX idx_care_plans_status ON care_plans(status_id);
CREATE INDEX idx_care_plans_start_date ON care_plans(start_date);
CREATE INDEX idx_care_plans_created_by ON care_plans(created_by);

CREATE INDEX idx_care_plan_objectives_care_plan ON care_plan_objectives(care_plan_id);
CREATE INDEX idx_care_plan_objectives_type ON care_plan_objectives(objective_type_id);
CREATE INDEX idx_care_plan_objectives_completed ON care_plan_objectives(is_completed);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plan_objectives_updated_at BEFORE UPDATE ON care_plan_objectives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 