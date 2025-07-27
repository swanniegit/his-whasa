# WHASA Supabase Database Setup Guide

## 🚨 IMPORTANT: Complete Database Reset

If you need to start completely fresh, run this first:

```sql
-- Copy and paste this into Supabase SQL Editor
-- This will drop ALL tables and start fresh
```

**File to run:** `database/reset-database.sql`

## 📋 **MODULAR EXECUTION ORDER**

The database is now organized into 5 modular files that must be executed in order:

### **Step 1: Reset Database (if needed)**
```sql
-- Run the reset-database.sql file in Supabase SQL Editor
-- This drops all tables and prepares for fresh start
```

### **Step 2: Core System**
```sql
-- Run 01-core-system.sql
-- This creates: users, user_roles, facilities, user_roles_ref, facility_types_ref
-- Foundation for all other modules
```

### **Step 3: Patient Management**
```sql
-- Run 02-patient-management.sql
-- This creates: patients, medical_history, physical_assessments
-- Plus reference tables: sex_ref, diabetes_types_ref, smoking_status_ref, alcohol_consumption_ref
-- Depends on: Module 1 (facilities, users)
```

### **Step 4: Wound Assessment**
```sql
-- Run 03-wound-assessment.sql
-- This creates: wounds, wound_assessments, time_edge_assessment, wound_images
-- Plus reference tables: ulcer_types_ref, wound_locations_ref, healability_status_ref, compression_recommendations_ref
-- Plus multi-select options: time_tissue_types_options, infection_indicators_options, moisture_levels_options
-- Plus junction tables: time_tissue_composition, time_infection_indicators, time_moisture_assessment
-- Depends on: Module 2 (patients, users)
```

### **Step 5: Care Planning**
```sql
-- Run 04-care-planning.sql
-- This creates: care_plans, care_plan_objectives
-- Plus reference tables: care_plan_status_ref, treatment_objective_types_ref
-- Depends on: Module 2 (patients), Module 3 (wounds), Module 1 (users)
```

### **Step 6: Product Management**
```sql
-- Run 05-product-management.sql
-- This creates: products, dressing_recommendations
-- Plus reference tables: product_categories_ref, product_types_ref
-- Depends on: Module 3 (wound_assessments), Module 1 (users)
```

## 🔧 **How to Execute in Supabase**

### **Method 1: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each file content in order
4. Click **Run** for each file

### **Method 2: Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db reset
supabase db push --file database/schemas/01-core-system.sql
supabase db push --file database/schemas/02-patient-management.sql
supabase db push --file database/schemas/03-wound-assessment.sql
supabase db push --file database/schemas/04-care-planning.sql
supabase db push --file database/schemas/05-product-management.sql
```

## ✅ **Verification Queries**

After running all files, verify the setup with these queries:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check reference tables have data
SELECT 'user_roles_ref' as table_name, COUNT(*) as count FROM user_roles_ref
UNION ALL
SELECT 'facility_types_ref', COUNT(*) FROM facility_types_ref
UNION ALL
SELECT 'sex_ref', COUNT(*) FROM sex_ref
UNION ALL
SELECT 'ulcer_types_ref', COUNT(*) FROM ulcer_types_ref
UNION ALL
SELECT 'wound_locations_ref', COUNT(*) FROM wound_locations_ref
UNION ALL
SELECT 'healability_status_ref', COUNT(*) FROM healability_status_ref
UNION ALL
SELECT 'compression_recommendations_ref', COUNT(*) FROM compression_recommendations_ref
UNION ALL
SELECT 'time_tissue_types_options', COUNT(*) FROM time_tissue_types_options
UNION ALL
SELECT 'infection_indicators_options', COUNT(*) FROM infection_indicators_options
UNION ALL
SELECT 'moisture_levels_options', COUNT(*) FROM moisture_levels_options
UNION ALL
SELECT 'care_plan_status_ref', COUNT(*) FROM care_plan_status_ref
UNION ALL
SELECT 'treatment_objective_types_ref', COUNT(*) FROM treatment_objective_types_ref
UNION ALL
SELECT 'product_categories_ref', COUNT(*) FROM product_categories_ref
UNION ALL
SELECT 'product_types_ref', COUNT(*) FROM product_types_ref;

-- Test a simple query
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as patient_count FROM patients;
SELECT COUNT(*) as wound_count FROM wounds;
```

## 🚨 **Troubleshooting**

### **If you get errors:**

1. **"Table already exists"** - Run the reset script first
2. **"Foreign key constraint"** - Ensure you're running files in the correct order
3. **"Permission denied"** - Check your Supabase user permissions
4. **"Reference table missing"** - Check that all reference tables were created

### **Common Issues:**

- **Supabase RLS**: Row Level Security might block operations - temporarily disable if needed
- **Extensions**: Make sure `uuid-ossp` and `pgcrypto` are enabled in Supabase
- **Schema conflicts**: Always run the reset script if you encounter conflicts
- **Multi-select data**: Junction tables require special handling in CRUD operations

## 📊 **Expected Results**

After successful execution, you should have:

### **Core Tables (15+ tables):**
- **Module 1**: `users`, `user_roles`, `facilities`, `user_roles_ref`, `facility_types_ref`
- **Module 2**: `patients`, `medical_history`, `physical_assessments`, `sex_ref`, `diabetes_types_ref`, `smoking_status_ref`, `alcohol_consumption_ref`
- **Module 3**: `wounds`, `wound_assessments`, `time_edge_assessment`, `wound_images`, `ulcer_types_ref`, `wound_locations_ref`, `healability_status_ref`, `compression_recommendations_ref`, `time_tissue_types_options`, `infection_indicators_options`, `moisture_levels_options`, `time_tissue_composition`, `time_infection_indicators`, `time_moisture_assessment`
- **Module 4**: `care_plans`, `care_plan_objectives`, `care_plan_status_ref`, `treatment_objective_types_ref`
- **Module 5**: `products`, `dressing_recommendations`, `product_categories_ref`, `product_types_ref`

### **Reference Tables (15+ tables):**
All lookup values are now in reference tables instead of enums, allowing for CRUD operations through the admin interface.

### **Multi-Select Junction Tables (3 tables):**
- `time_tissue_composition` - Links wound assessments to tissue types with percentages
- `time_infection_indicators` - Links wound assessments to infection indicators with severity
- `time_moisture_assessment` - Links wound assessments to moisture levels

## 🎯 **Next Steps**

Once the database is set up:

1. **Configure RLS policies** for security
2. **Set up authentication** in Supabase Auth
3. **Use ReferenceTableManager** for CRUD operations on reference tables
4. **Create API endpoints** for your React app
5. **Test the connection** from your React application
6. **Seed with sample data** for testing

## 📞 **Support**

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify all files are executed in the correct order
3. Ensure your Supabase project has the required extensions enabled
4. Check the `database/MODULAR_SETUP_GUIDE.md` for detailed troubleshooting
5. Review the modular design principles in the setup guide 