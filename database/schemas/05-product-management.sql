-- WHASA Database Schema - Module 5: Product Management
-- Products, categories, dressing recommendations

-- =====================================================
-- REFERENCE TABLES (Single-select only)
-- =====================================================

-- Product categories reference table
CREATE TABLE product_categories_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES product_categories_ref(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product types reference table
CREATE TABLE product_types_ref (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories_ref(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCT TABLES
-- =====================================================

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES product_categories_ref(id),
    product_type_id UUID REFERENCES product_types_ref(id),
    manufacturer VARCHAR(200),
    supplier VARCHAR(200),
    description TEXT,
    specifications JSONB, -- size, material, features
    instructions TEXT,
    contraindications TEXT[],
    side_effects TEXT[],
    cost_per_unit DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'ZAR',
    unit_of_measure VARCHAR(20), -- 'piece', 'box', 'roll', 'pack'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dressing recommendations table
CREATE TABLE dressing_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wound_assessment_id UUID REFERENCES wound_assessments(id) ON DELETE CASCADE,
    primary_dressing_product_id UUID REFERENCES products(id),
    secondary_dressing_product_id UUID REFERENCES products(id),
    compression_product_id UUID REFERENCES products(id),
    recommendation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    clinical_rationale TEXT,
    application_instructions TEXT,
    frequency VARCHAR(50), -- 'daily', 'twice_daily', 'weekly', 'as_needed'
    duration_days INTEGER,
    contraindications_checked BOOLEAN DEFAULT FALSE,
    patient_allergies_checked BOOLEAN DEFAULT FALSE,
    recommended_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default product categories
INSERT INTO product_categories_ref (category_name, description) VALUES
('Primary Dressings', 'Direct contact with wound bed'),
('Secondary Dressings', 'Cover and secure primary dressings'),
('Compression Therapy', 'Compression bandages and garments'),
('Debridement', 'Products for tissue removal'),
('Antimicrobial', 'Products with antimicrobial properties'),
('Moisture Management', 'Products for exudate control'),
('Adhesives', 'Tapes and adhesive products'),
('Protection', 'Protective barriers and films'),
('Offloading', 'Pressure redistribution products'),
('Cleansing', 'Wound cleansing solutions');

-- Insert default product types
INSERT INTO product_types_ref (type_name, description, category_id) VALUES
-- Primary Dressings
('Hydrocolloid', 'Moisture-retentive dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Primary Dressings')),
('Hydrogel', 'Water-based gel dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Primary Dressings')),
('Alginate', 'Seaweed-based dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Primary Dressings')),
('Foam', 'Polyurethane foam dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Primary Dressings')),
('Film', 'Transparent film dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Primary Dressings')),
('Collagen', 'Collagen-based dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Primary Dressings')),

-- Secondary Dressings
('Gauze', 'Cotton gauze bandages', (SELECT id FROM product_categories_ref WHERE category_name = 'Secondary Dressings')),
('Non-adherent', 'Non-stick dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Secondary Dressings')),
('Absorbent', 'High-absorbency dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Secondary Dressings')),

-- Compression Therapy
('Compression Bandage', 'Elastic compression bandages', (SELECT id FROM product_categories_ref WHERE category_name = 'Compression Therapy')),
('Compression Garment', 'Compression stockings/sleeves', (SELECT id FROM product_categories_ref WHERE category_name = 'Compression Therapy')),
('Multi-layer', 'Multi-layer compression systems', (SELECT id FROM product_categories_ref WHERE category_name = 'Compression Therapy')),

-- Debridement
('Enzymatic', 'Enzyme-based debridement', (SELECT id FROM product_categories_ref WHERE category_name = 'Debridement')),
('Mechanical', 'Mechanical debridement tools', (SELECT id FROM product_categories_ref WHERE category_name = 'Debridement')),
('Autolytic', 'Autolytic debridement dressings', (SELECT id FROM product_categories_ref WHERE category_name = 'Debridement')),

-- Antimicrobial
('Silver', 'Silver-based antimicrobial', (SELECT id FROM product_categories_ref WHERE category_name = 'Antimicrobial')),
('Iodine', 'Iodine-based antimicrobial', (SELECT id FROM product_categories_ref WHERE category_name = 'Antimicrobial')),
('Honey', 'Medical-grade honey', (SELECT id FROM product_categories_ref WHERE category_name = 'Antimicrobial')),

-- Moisture Management
('Super Absorbent', 'High-absorbency products', (SELECT id FROM product_categories_ref WHERE category_name = 'Moisture Management')),
('Moisture Barrier', 'Moisture protection products', (SELECT id FROM product_categories_ref WHERE category_name = 'Moisture Management')),

-- Adhesives
('Medical Tape', 'Adhesive tapes', (SELECT id FROM product_categories_ref WHERE category_name = 'Adhesives')),
('Adhesive Remover', 'Adhesive removal products', (SELECT id FROM product_categories_ref WHERE category_name = 'Adhesives')),

-- Protection
('Barrier Film', 'Protective barrier films', (SELECT id FROM product_categories_ref WHERE category_name = 'Protection')),
('Skin Protectant', 'Skin protection products', (SELECT id FROM product_categories_ref WHERE category_name = 'Protection')),

-- Offloading
('Heel Protector', 'Heel offloading devices', (SELECT id FROM product_categories_ref WHERE category_name = 'Offloading')),
('Pressure Redistribution', 'Pressure redistribution products', (SELECT id FROM product_categories_ref WHERE category_name = 'Offloading')),

-- Cleansing
('Saline', 'Normal saline solution', (SELECT id FROM product_categories_ref WHERE category_name = 'Cleansing')),
('Antiseptic', 'Antiseptic solutions', (SELECT id FROM product_categories_ref WHERE category_name = 'Cleansing')),
('Surfactant', 'Surfactant-based cleansers', (SELECT id FROM product_categories_ref WHERE category_name = 'Cleansing'));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(product_type_id);
CREATE INDEX idx_products_manufacturer ON products(manufacturer);
CREATE INDEX idx_products_active ON products(is_active);

CREATE INDEX idx_dressing_recommendations_wound_assessment ON dressing_recommendations(wound_assessment_id);
CREATE INDEX idx_dressing_recommendations_primary_product ON dressing_recommendations(primary_dressing_product_id);
CREATE INDEX idx_dressing_recommendations_secondary_product ON dressing_recommendations(secondary_dressing_product_id);
CREATE INDEX idx_dressing_recommendations_compression_product ON dressing_recommendations(compression_product_id);
CREATE INDEX idx_dressing_recommendations_date ON dressing_recommendations(recommendation_date);
CREATE INDEX idx_dressing_recommendations_recommended_by ON dressing_recommendations(recommended_by);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dressing_recommendations_updated_at BEFORE UPDATE ON dressing_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 