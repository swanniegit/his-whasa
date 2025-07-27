# WHASA Modular Database Setup Guide

## 🎯 **Overview**

This guide covers the new **modular database design** with reference tables instead of enums, allowing for flexible CRUD operations and better maintainability.

## 📁 **Database Module Structure**

### **Module 1: Core System** (`01-core-system.sql`)
- **Purpose**: Users, roles, facilities, and authentication
- **Tables**: `users`, `user_roles`, `facilities`, `user_roles_ref`, `facility_types_ref`
- **Dependencies**: None (foundation module)

### **Module 2: Patient Management** (`02-patient-management.sql`)
- **Purpose**: Patients, medical history, physical assessments
- **Tables**: `patients`, `medical_history`, `physical_assessments`, `sex_ref`, `diabetes_types_ref`, `smoking_status_ref`, `alcohol_consumption_ref`
- **Dependencies**: Module 1 (facilities, users)

### **Module 3: Wound Assessment** (`03-wound-assessment.sql`)
- **Purpose**: Wound data, T.I.M.E. framework, ABPI assessments
- **Tables**: 
  - **Single-select**: `wounds`, `wound_assessments`, `ulcer_types_ref`, `wound_locations_ref`, `healability_status_ref`, `compression_recommendations_ref`
  - **Multi-select options**: `time_tissue_types_options`, `infection_indicators_options`, `moisture_levels_options`
  - **Multi-select junctions**: `time_tissue_composition`, `time_infection_indicators`, `time_moisture_assessment`
  - **Additional**: `time_edge_assessment`, `wound_images`
- **Dependencies**: Module 2 (patients, users)

### **Module 4: Care Planning** (`04-care-planning.sql`)
- **Purpose**: Care plans, objectives, treatment frameworks
- **Tables**: `care_plans`, `care_plan_objectives`, `care_plan_status_ref`, `treatment_objective_types_ref`
- **Dependencies**: Module 2 (patients), Module 3 (wounds), Module 1 (users)

### **Module 5: Product Management** (`05-product-management.sql`)
- **Purpose**: Products, categories, dressing recommendations
- **Tables**: `products`, `dressing_recommendations`, `product_categories_ref`, `product_types_ref`
- **Dependencies**: Module 3 (wound_assessments), Module 1 (users)

## 🚀 **Setup Instructions**

### **Step 1: Reset Database (if needed)**
```sql
-- Run the reset script to clear existing data
-- This is in database/reset-database.sql
```

### **Step 2: Execute Modules in Order**
```sql
-- Execute each module in sequence:
-- 1. Core System (foundation)
-- 2. Patient Management
-- 3. Wound Assessment
-- 4. Care Planning
-- 5. Product Management
```

### **Step 3: Verify Setup**
```sql
-- Check that all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check reference table data
SELECT 'user_roles_ref' as table_name, COUNT(*) as count FROM user_roles_ref
UNION ALL
SELECT 'facility_types_ref', COUNT(*) FROM facility_types_ref
UNION ALL
SELECT 'sex_ref', COUNT(*) FROM sex_ref
-- ... continue for other reference tables
```

## 🔧 **Key Design Principles**

### **1. Reference Tables vs Enums**
- **Before**: `healability_assessment healability_enum NOT NULL`
- **After**: `healability_status_id UUID REFERENCES healability_status_ref(id)`

### **2. Multi-Select Junction Tables**
For scenarios where multiple values can be selected:

```sql
-- Example: Infection indicators for a wound assessment
CREATE TABLE time_infection_indicators (
    wound_assessment_id UUID REFERENCES wound_assessments(id),
    infection_indicator_id UUID REFERENCES infection_indicators_options(id),
    is_present BOOLEAN DEFAULT FALSE,
    severity VARCHAR(20),
    notes TEXT,
    PRIMARY KEY (wound_assessment_id, infection_indicator_id)
);
```

### **3. Structured Data Storage**
- **JSONB fields** for complex, flexible data
- **Array fields** for simple lists
- **Structured tables** for relational data

## 📊 **CRUD Operations**

### **Reference Table Management**
Use the **ReferenceTableManager** component for all reference tables:

```typescript
// Example: Managing ulcer types
<ReferenceTableManager
  tableName="ulcer_types_ref"
  displayName="Ulcer Types"
  fields={[
    { name: 'type_name', label: 'Type Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'whasa_category', label: 'WHASA Category', type: 'text' },
    { name: 'is_active', label: 'Active', type: 'boolean' }
  ]}
  onClose={handleClose}
/>
```

### **Multi-Select Data Management**
For junction tables, use specialized components:

```typescript
// Example: Managing T.I.M.E. tissue composition
const handleTissueComposition = async (assessmentId: string, tissueData: TissueComposition[]) => {
  // Clear existing data
  await supabase
    .from('time_tissue_composition')
    .delete()
    .eq('wound_assessment_id', assessmentId);
  
  // Insert new data
  await supabase
    .from('time_tissue_composition')
    .insert(tissueData.map(item => ({
      wound_assessment_id: assessmentId,
      tissue_type_id: item.tissue_type_id,
      percentage: item.percentage,
      notes: item.notes
    })));
};
```

## 🎨 **Frontend Integration**

### **1. Reference Table Dropdowns**
```typescript
const [ulcerTypes, setUlcerTypes] = useState([]);

useEffect(() => {
  const loadUlcerTypes = async () => {
    const { data } = await supabase
      .from('ulcer_types_ref')
      .select('id, type_name')
      .eq('is_active', true)
      .order('type_name');
    setUlcerTypes(data || []);
  };
  loadUlcerTypes();
}, []);

// In JSX:
<select value={selectedType} onChange={handleTypeChange}>
  <option value="">Select Ulcer Type</option>
  {ulcerTypes.map(type => (
    <option key={type.id} value={type.id}>
      {type.type_name}
    </option>
  ))}
</select>
```

### **2. Multi-Select Components**
```typescript
const [selectedIndicators, setSelectedIndicators] = useState([]);

const handleIndicatorToggle = (indicatorId: string) => {
  setSelectedIndicators(prev => 
    prev.includes(indicatorId)
      ? prev.filter(id => id !== indicatorId)
      : [...prev, indicatorId]
  );
};

// In JSX:
{infectionIndicators.map(indicator => (
  <label key={indicator.id} className="flex items-center">
    <input
      type="checkbox"
      checked={selectedIndicators.includes(indicator.id)}
      onChange={() => handleIndicatorToggle(indicator.id)}
    />
    <span>{indicator.indicator_name}</span>
  </label>
))}
```

## 🔒 **Security Considerations**

### **Row Level Security (RLS)**
```sql
-- Example: Users can only see their own patients
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (created_by = auth.uid());

-- Example: Wound specialists can manage wound data
CREATE POLICY "Wound specialists can manage wounds" ON wounds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN user_roles_ref urr ON ur.role_id = urr.id
      WHERE ur.user_id = auth.uid()
      AND urr.role_name = 'wound_specialist_nurse'
    )
  );
```

### **Data Validation**
```sql
-- Example: ABPI values must be between 0 and 2.0
ALTER TABLE wound_assessments 
ADD CONSTRAINT check_abpi_range 
CHECK (abpi_left >= 0 AND abpi_left <= 2.0);

-- Example: Pain score must be between 0 and 10
ALTER TABLE wound_assessments 
ADD CONSTRAINT check_pain_score 
CHECK (pain_score >= 0 AND pain_score <= 10);
```

## 📈 **Performance Optimization**

### **Indexes**
- **Primary keys**: Automatically indexed
- **Foreign keys**: Automatically indexed
- **Frequently queried columns**: Manual indexes added
- **Composite indexes**: For complex queries

### **Query Optimization**
```sql
-- Example: Efficient patient search with joins
SELECT 
  p.patient_number,
  p.full_name,
  f.facility_name,
  COUNT(w.id) as wound_count
FROM patients p
LEFT JOIN facilities f ON p.facility_id = f.id
LEFT JOIN wounds w ON p.id = w.patient_id AND w.is_active = true
WHERE p.is_active = true
GROUP BY p.id, p.patient_number, p.full_name, f.facility_name
ORDER BY p.full_name;
```

## 🧪 **Testing**

### **Unit Tests**
```typescript
// Example: Testing reference table operations
describe('ReferenceTableManager', () => {
  it('should create new reference item', async () => {
    const mockData = { type_name: 'Test Type', description: 'Test Description' };
    const { data, error } = await supabase
      .from('ulcer_types_ref')
      .insert([mockData]);
    
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].type_name).toBe('Test Type');
  });
});
```

### **Integration Tests**
```typescript
// Example: Testing complete wound assessment flow
describe('Wound Assessment Flow', () => {
  it('should create wound with T.I.M.E. assessment', async () => {
    // Create patient
    const patient = await createTestPatient();
    
    // Create wound
    const wound = await createTestWound(patient.id);
    
    // Create wound assessment
    const assessment = await createTestWoundAssessment(wound.id);
    
    // Add T.I.M.E. tissue composition
    await addTissueComposition(assessment.id, [
      { tissue_type_id: 'granulation-id', percentage: 60 },
      { tissue_type_id: 'slough-id', percentage: 40 }
    ]);
    
    // Verify data integrity
    const result = await getWoundAssessmentWithTIME(assessment.id);
    expect(result.tissue_composition).toHaveLength(2);
  });
});
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Foreign Key Constraint Errors**
   ```sql
   -- Check if referenced data exists
   SELECT * FROM ulcer_types_ref WHERE id = 'missing-id';
   ```

2. **Multi-Select Junction Table Issues**
   ```sql
   -- Verify junction table data
   SELECT 
     wa.assessment_date,
     tto.tissue_name,
     ttc.percentage
   FROM time_tissue_composition ttc
   JOIN wound_assessments wa ON ttc.wound_assessment_id = wa.id
   JOIN time_tissue_types_options tto ON ttc.tissue_type_id = tto.id
   WHERE wa.id = 'assessment-id';
   ```

3. **Reference Table Data Missing**
   ```sql
   -- Check default data was inserted
   SELECT COUNT(*) FROM user_roles_ref;
   SELECT COUNT(*) FROM facility_types_ref;
   ```

### **Recovery Procedures**

1. **Reset and Rebuild**
   ```sql
   -- Run reset script
   -- Re-execute modules in order
   -- Verify data integrity
   ```

2. **Data Migration**
   ```sql
   -- If migrating from old schema
   -- Create migration scripts
   -- Test thoroughly before production
   ```

## 📚 **Next Steps**

### **Phase 1: Core Clinical Modules**
1. **Complete remaining modules** (Therapy Execution, Inventory & Cost, Clinical Support)
2. **Implement advanced features** (audit logging, data export, reporting)
3. **Add comprehensive testing** (unit, integration, end-to-end)
4. **Performance monitoring** (query optimization, indexing strategy)
5. **User training** (admin interface, clinical workflows)

### **Phase 2: Business Operations (TODO)**
6. **Booking System**
   - Patient appointment scheduling
   - Resource allocation (rooms, equipment, staff)
   - Calendar integration
   - Reminder notifications
   - Waitlist management

7. **Stock Control System**
   - Inventory tracking for medical supplies
   - Automatic reorder points
   - Supplier management
   - Cost tracking and analysis
   - Expiry date monitoring
   - Barcode scanning integration

8. **Payment/Billing System**
   - Medical aid claim processing
   - Patient billing and invoicing
   - Payment tracking and reconciliation
   - Financial reporting
   - Tax compliance (VAT, etc.)

9. **Medical Aid Integration**
   - **MediKredit.co.za integration**
   - Real-time medical aid verification
   - Pre-authorization requests
   - Claim submission and tracking
   - Benefit checking and limits
   - Electronic fund transfers

10. **AI-Predictive Analysis Agent**
    - Wound healing prediction models
    - Risk assessment algorithms
    - Treatment outcome forecasting
    - Resource optimization recommendations
    - Clinical decision support enhancement
    - Patient outcome analytics

11. **Online Communications System**
    - Real-time chat system for clinical teams
    - Task management with AI-assisted prioritization
    - Smart alerts with AI-driven urgency assessment
    - Patient communication portal with AI responses
    - Voice-to-text transcription for clinical notes
    - Emergency notification system with escalation protocols

---

**Note**: This modular design provides flexibility for future enhancements while maintaining data integrity and clinical accuracy according to WHASA guidelines. 