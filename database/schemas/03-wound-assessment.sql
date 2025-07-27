-- WHASA Database Schema - Module 3: Wound Assessment
-- Wound data, T.I.M.E. framework, ABPI assessments

-- =====================================================
-- REFERENCE TABLES (Single-select only)
-- =====================================================

-- Ulcer types reference table
CREATE TABLE ulcer_types_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    whasa_category VARCHAR(50), -- WHASA classification
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wound locations reference table
CREATE TABLE wound_locations_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name VARCHAR(100) UNIQUE NOT NULL,
    body_region VARCHAR(50), -- 'upper_limb', 'lower_limb', 'trunk', 'head_neck'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Healability status reference table
CREATE TABLE healability_status_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    clinical_criteria TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compression recommendations reference table
CREATE TABLE compression_recommendations_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_name VARCHAR(50) UNIQUE NOT NULL,
    abpi_min DECIMAL(3,2),
    abpi_max DECIMAL(3,2),
    description TEXT,
    clinical_rationale TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MULTI-SELECT OPTION TABLES
-- =====================================================

-- T.I.M.E. tissue types options
CREATE TABLE time_tissue_types_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tissue_name VARCHAR(50) UNIQUE NOT NULL,
    tissue_category VARCHAR(20), -- 'viable', 'non_viable', 'mixed'
    description TEXT,
    clinical_implications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Infection indicators options
CREATE TABLE infection_indicators_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(20), -- 'nerds', 'stones', 'systemic'
    description TEXT,
    clinical_significance TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moisture levels options
CREATE TABLE moisture_levels_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    clinical_implications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WOUND TABLES
-- =====================================================

-- Wounds table
CREATE TABLE wounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    wound_number INTEGER NOT NULL, -- sequential for patient
    wound_name VARCHAR(200),
    wound_location_id UUID REFERENCES wound_locations_ref(id),
    ulcer_type_id UUID REFERENCES ulcer_types_ref(id),
    wound_duration_days INTEGER,
    initial_assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    healability_status_id UUID REFERENCES healability_status_ref(id),
    compression_recommendation_id UUID REFERENCES compression_recommendations_ref(id),
    urgent_referral_required BOOLEAN DEFAULT FALSE,
    referral_reason TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, wound_number)
);

-- Wound assessments table
CREATE TABLE wound_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wound_id UUID REFERENCES wounds(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    assessment_number INTEGER, -- sequential for wound
    
    -- Vascular Assessment (ABPI)
    abpi_left DECIMAL(3,2) CHECK (abpi_left >= 0 AND abpi_left <= 2.0),
    abpi_right DECIMAL(3,2) CHECK (abpi_right >= 0 AND abpi_right <= 2.0),
    leg_circumference_left DECIMAL(5,2), -- cm
    leg_circumference_right DECIMAL(5,2), -- cm
    toe_pressure_left INTEGER, -- mmHg
    toe_pressure_right INTEGER, -- mmHg
    
    -- Wound Measurements
    length_cm DECIMAL(5,2),
    width_cm DECIMAL(5,2),
    depth_cm DECIMAL(5,2),
    area_cm2 DECIMAL(8,2), -- calculated or measured
    volume_cm3 DECIMAL(10,2),
    
    -- Pain Assessment
    pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
    pain_location VARCHAR(100),
    pain_character VARCHAR(100),
    pain_frequency VARCHAR(50),
    
    -- Additional Classifications
    diabetic_foot_staging VARCHAR(20), -- University of Texas staging
    pressure_injury_stage VARCHAR(20), -- NPIAP classification
    skin_tear_type VARCHAR(10), -- Type 1, Type 2, Type 3
    burn_depth VARCHAR(20),
    burn_percentage DECIMAL(5,2),
    
    -- Intrinsic and Extrinsic Factors
    intrinsic_factors JSONB, -- age, oxygenation, medication, nutrition, infection, perfusion
    extrinsic_factors JSONB, -- pressure, friction, shear, moisture, chemical irritants
    
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MULTI-SELECT JUNCTION TABLES
-- =====================================================

-- T.I.M.E. Assessment - Tissue composition (multi-select)
CREATE TABLE time_tissue_composition (
    wound_assessment_id UUID REFERENCES wound_assessments(id) ON DELETE CASCADE,
    tissue_type_id UUID REFERENCES time_tissue_types_options(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    notes TEXT,
    PRIMARY KEY (wound_assessment_id, tissue_type_id)
);

-- T.I.M.E. Assessment - Infection indicators (multi-select)
CREATE TABLE time_infection_indicators (
    wound_assessment_id UUID REFERENCES wound_assessments(id) ON DELETE CASCADE,
    infection_indicator_id UUID REFERENCES infection_indicators_options(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
    notes TEXT,
    PRIMARY KEY (wound_assessment_id, infection_indicator_id)
);

-- T.I.M.E. Assessment - Moisture assessment (multi-select)
CREATE TABLE time_moisture_assessment (
    wound_assessment_id UUID REFERENCES wound_assessments(id) ON DELETE CASCADE,
    moisture_level_id UUID REFERENCES moisture_levels_options(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT FALSE,
    notes TEXT,
    PRIMARY KEY (wound_assessment_id, moisture_level_id)
);

-- =====================================================
-- ADDITIONAL ASSESSMENT TABLES
-- =====================================================

-- T.I.M.E. Assessment - Edge assessment (structured data)
CREATE TABLE time_edge_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wound_assessment_id UUID REFERENCES wound_assessments(id) ON DELETE CASCADE,
    edge_type VARCHAR(50), -- 'attached', 'non_attached', 'rolled', 'epithelial_advancing'
    surrounding_skin_condition VARCHAR(100),
    undermining_present BOOLEAN DEFAULT FALSE,
    undermining_depth_cm DECIMAL(5,2),
    tunneling_present BOOLEAN DEFAULT FALSE,
    tunneling_direction VARCHAR(50),
    tunneling_depth_cm DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wound images table
CREATE TABLE wound_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wound_assessment_id UUID REFERENCES wound_assessments(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    image_type VARCHAR(20), -- 'overview', 'close_up', 'measurement', 'before', 'after'
    image_size_bytes BIGINT,
    image_width INTEGER,
    image_height INTEGER,
    annotations JSONB, -- measurement overlays, arrows, text
    capture_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info JSONB, -- camera settings, device model
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default ulcer types
INSERT INTO ulcer_types_ref (type_name, description, whasa_category) VALUES
('venous', 'Venous leg ulcer', 'venous_ulcer'),
('arterial', 'Arterial ulcer', 'arterial_ulcer'),
('mixed', 'Mixed arterial/venous ulcer', 'mixed_ulcer'),
('diabetic_foot', 'Diabetic foot ulcer', 'diabetic_ulcer'),
('pressure_injury', 'Pressure injury/ulcer', 'pressure_ulcer'),
('skin_tear', 'Skin tear', 'skin_tear'),
('burn', 'Burn wound', 'burn'),
('moisture_associated', 'Moisture associated skin damage', 'masd'),
('surgical', 'Surgical wound', 'surgical'),
('other', 'Other wound type', 'other');

-- Insert default wound locations
INSERT INTO wound_locations_ref (location_name, body_region, description) VALUES
('Left lower leg', 'lower_limb', 'Left lower leg'),
('Right lower leg', 'lower_limb', 'Right lower leg'),
('Left foot', 'lower_limb', 'Left foot'),
('Right foot', 'lower_limb', 'Right foot'),
('Left ankle', 'lower_limb', 'Left ankle'),
('Right ankle', 'lower_limb', 'Right ankle'),
('Sacrum', 'trunk', 'Sacral area'),
('Coccyx', 'trunk', 'Coccygeal area'),
('Left heel', 'lower_limb', 'Left heel'),
('Right heel', 'lower_limb', 'Right heel'),
('Left thigh', 'lower_limb', 'Left thigh'),
('Right thigh', 'lower_limb', 'Right thigh'),
('Other', 'other', 'Other location');

-- Insert default healability status
INSERT INTO healability_status_ref (status_name, description, clinical_criteria) VALUES
('healable', 'Wound has potential to heal', 'Adequate blood supply, no underlying disease preventing healing'),
('maintenance', 'Wound can be maintained but not healed', 'Limited healing potential due to underlying conditions'),
('non_healable', 'Wound cannot be healed', 'Severe underlying disease or poor blood supply preventing healing');

-- Insert default compression recommendations
INSERT INTO compression_recommendations_ref (recommendation_name, abpi_min, abpi_max, description, clinical_rationale) VALUES
('No compression', 0.0, 0.6, 'No compression therapy', 'ABPI < 0.6 indicates arterial insufficiency'),
('Light compression', 0.6, 0.8, 'Light compression therapy', 'ABPI 0.6-0.8 requires careful monitoring'),
('Standard compression', 0.8, 1.3, 'Standard compression therapy', 'ABPI 0.8-1.3 is normal range for compression'),
('Caution with compression', 1.3, 2.0, 'Compression with caution', 'ABPI > 1.3 may indicate calcified vessels');

-- Insert default T.I.M.E. tissue types options
INSERT INTO time_tissue_types_options (tissue_name, tissue_category, description, clinical_implications) VALUES
('Granulation', 'viable', 'Healthy red granulation tissue', 'Good healing potential'),
('Epithelial', 'viable', 'Epithelial tissue', 'Wound is healing'),
('Slough', 'non_viable', 'Yellow/white slough tissue', 'Requires debridement'),
('Necrotic', 'non_viable', 'Black necrotic tissue', 'Requires debridement'),
('Mixed', 'mixed', 'Combination of tissue types', 'Assess each component');

-- Insert default infection indicators options
INSERT INTO infection_indicators_options (indicator_name, category, description, clinical_significance) VALUES
('Non-blanchable erythema', 'nerds', 'Redness that does not blanch', 'Local infection sign'),
('Edema', 'nerds', 'Swelling around wound', 'Local infection sign'),
('Increased exudate', 'nerds', 'Increased wound drainage', 'Local infection sign'),
('Delayed healing', 'nerds', 'Wound not progressing', 'Local infection sign'),
('Smell', 'nerds', 'Foul odor from wound', 'Local infection sign'),
('Size increased', 'nerds', 'Wound getting larger', 'Local infection sign'),
('Shallow', 'stones', 'Wound depth changes', 'Deep infection sign'),
('Temperature', 'stones', 'Increased local temperature', 'Deep infection sign'),
('Os probe', 'stones', 'Bone visible or palpable', 'Deep infection sign'),
('New areas', 'stones', 'New areas of breakdown', 'Deep infection sign'),
('Exudate', 'stones', 'Increased exudate', 'Deep infection sign'),
('Smell', 'stones', 'Foul odor', 'Deep infection sign'),
('Fever', 'systemic', 'Systemic fever', 'Systemic infection'),
('Chills', 'systemic', 'Systemic chills', 'Systemic infection'),
('Malaise', 'systemic', 'General feeling of illness', 'Systemic infection');

-- Insert default moisture levels options
INSERT INTO moisture_levels_options (level_name, description, clinical_implications) VALUES
('none', 'No exudate present', 'Wound may be too dry'),
('minimal', 'Minimal exudate', 'Optimal moisture level'),
('moderate', 'Moderate exudate', 'Monitor for infection'),
('heavy', 'Heavy exudate', 'May need more absorbent dressing'),
('excessive', 'Excessive exudate', 'Consider infection and dressing change');

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_wounds_patient ON wounds(patient_id);
CREATE INDEX idx_wounds_location ON wounds(wound_location_id);
CREATE INDEX idx_wounds_type ON wounds(ulcer_type_id);
CREATE INDEX idx_wounds_status ON wounds(healability_status_id);
CREATE INDEX idx_wounds_assessment_date ON wounds(initial_assessment_date);
CREATE INDEX idx_wounds_active ON wounds(is_active);

CREATE INDEX idx_wound_assessments_wound ON wound_assessments(wound_id);
CREATE INDEX idx_wound_assessments_date ON wound_assessments(assessment_date);
CREATE INDEX idx_wound_assessments_performed_by ON wound_assessments(performed_by);

CREATE INDEX idx_time_tissue_composition_assessment ON time_tissue_composition(wound_assessment_id);
CREATE INDEX idx_time_tissue_composition_type ON time_tissue_composition(tissue_type_id);

CREATE INDEX idx_time_infection_indicators_assessment ON time_infection_indicators(wound_assessment_id);
CREATE INDEX idx_time_infection_indicators_indicator ON time_infection_indicators(infection_indicator_id);

CREATE INDEX idx_time_moisture_assessment_assessment ON time_moisture_assessment(wound_assessment_id);
CREATE INDEX idx_time_moisture_assessment_level ON time_moisture_assessment(moisture_level_id);

CREATE INDEX idx_time_edge_assessment_wound_assessment ON time_edge_assessment(wound_assessment_id);

CREATE INDEX idx_wound_images_wound_assessment ON wound_images(wound_assessment_id);
CREATE INDEX idx_wound_images_capture_time ON wound_images(capture_timestamp);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_wounds_updated_at BEFORE UPDATE ON wounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wound_assessments_updated_at BEFORE UPDATE ON wound_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 