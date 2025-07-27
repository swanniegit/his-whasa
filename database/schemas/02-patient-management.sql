-- WHASA Database Schema - Module 2: Patient Management
-- Patients, Medical History, Physical Assessments

-- =====================================================
-- REFERENCE TABLES (Single-select only)
-- =====================================================

-- Sex/Gender reference table
CREATE TABLE sex_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sex_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diabetes types reference table
CREATE TABLE diabetes_types_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smoking status reference table
CREATE TABLE smoking_status_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alcohol consumption reference table
CREATE TABLE alcohol_consumption_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumption_level VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PATIENT TABLES
-- =====================================================

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number VARCHAR(20) UNIQUE NOT NULL,
    surname VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    id_number VARCHAR(13) UNIQUE,
    date_of_birth DATE NOT NULL,
    sex_id UUID REFERENCES sex_ref(id),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address JSONB, -- structured address data
    emergency_contact JSONB, -- name, relationship, phone
    referring_doctor VARCHAR(200),
    practice_number VARCHAR(50),
    icd10_code VARCHAR(10),
    medical_aid_name VARCHAR(100),
    medical_aid_number VARCHAR(50),
    member_number VARCHAR(50),
    case_manager_name VARCHAR(100),
    case_manager_contact VARCHAR(100),
    initial_evaluation_date DATE NOT NULL,
    case_number VARCHAR(50) UNIQUE,
    facility_id UUID REFERENCES facilities(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical history table
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    diabetes BOOLEAN DEFAULT FALSE,
    diabetes_type_id UUID REFERENCES diabetes_types_ref(id),
    diabetes_controlled BOOLEAN,
    hypertension BOOLEAN DEFAULT FALSE,
    hypertension_controlled BOOLEAN,
    obesity BOOLEAN DEFAULT FALSE,
    bmi DECIMAL(4,2),
    autoimmune_diseases TEXT[],
    cardiac_conditions TEXT[],
    respiratory_conditions TEXT[],
    previous_surgeries JSONB, -- array of {surgery, date, complications}
    lymphatic_alterations BOOLEAN DEFAULT FALSE,
    radiation_exposure BOOLEAN DEFAULT FALSE,
    radiation_site VARCHAR(100),
    previous_amputation BOOLEAN DEFAULT FALSE,
    amputation_details TEXT,
    gait_changes BOOLEAN DEFAULT FALSE,
    gait_description TEXT,
    smoking_status_id UUID REFERENCES smoking_status_ref(id),
    smoking_pack_years INTEGER,
    alcohol_consumption_id UUID REFERENCES alcohol_consumption_ref(id),
    medications JSONB, -- array of {name, dosage, frequency}
    allergies TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Physical assessments table
CREATE TABLE physical_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature DECIMAL(4,2), -- Celsius
    respiration_rate INTEGER,
    pulse INTEGER,
    height DECIMAL(5,2), -- cm
    weight DECIMAL(5,2), -- kg
    calculated_bmi DECIMAL(4,2),
    oxygen_saturation INTEGER,
    pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
    general_appearance TEXT,
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default sex options
INSERT INTO sex_ref (sex_name, description) VALUES
('Male', 'Male'),
('Female', 'Female'),
('Other', 'Other or prefer not to specify');

-- Insert default diabetes types
INSERT INTO diabetes_types_ref (type_name, description) VALUES
('Type 1', 'Type 1 diabetes mellitus'),
('Type 2', 'Type 2 diabetes mellitus'),
('Gestational', 'Gestational diabetes'),
('Other', 'Other types of diabetes');

-- Insert default smoking status
INSERT INTO smoking_status_ref (status_name, description) VALUES
('Never', 'Never smoked'),
('Former', 'Former smoker'),
('Current', 'Current smoker');

-- Insert default alcohol consumption levels
INSERT INTO alcohol_consumption_ref (consumption_level, description) VALUES
('None', 'No alcohol consumption'),
('Social', 'Social/occasional drinking'),
('Moderate', 'Moderate regular consumption'),
('Heavy', 'Heavy regular consumption');

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_patients_patient_number ON patients(patient_number);
CREATE INDEX idx_patients_id_number ON patients(id_number);
CREATE INDEX idx_patients_case_number ON patients(case_number);
CREATE INDEX idx_patients_facility ON patients(facility_id);
CREATE INDEX idx_patients_active ON patients(is_active);
CREATE INDEX idx_patients_created_by ON patients(created_by);

CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX idx_medical_history_diabetes ON medical_history(diabetes);
CREATE INDEX idx_medical_history_hypertension ON medical_history(hypertension);

CREATE INDEX idx_physical_assessments_patient ON physical_assessments(patient_id);
CREATE INDEX idx_physical_assessments_date ON physical_assessments(assessment_date);
CREATE INDEX idx_physical_assessments_performed_by ON physical_assessments(performed_by);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 