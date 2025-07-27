import React, { useState } from 'react';
import { ReferenceTableManager } from '../../components/admin/ReferenceTableManager';

const ReferenceTables: React.FC = () => {
  const [activeTable, setActiveTable] = useState<string | null>(null);

  const referenceTables = [
    {
      id: 'user_roles_ref',
      name: 'User Roles',
      fields: [
        { name: 'role_name', label: 'Role Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'permissions', label: 'Permissions (JSON)', type: 'textarea' as const, required: true },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'facility_types_ref',
      name: 'Facility Types',
      fields: [
        { name: 'type_name', label: 'Type Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'sex_ref',
      name: 'Sex/Gender',
      fields: [
        { name: 'sex_name', label: 'Sex Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'diabetes_types_ref',
      name: 'Diabetes Types',
      fields: [
        { name: 'type_name', label: 'Type Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'smoking_status_ref',
      name: 'Smoking Status',
      fields: [
        { name: 'status_name', label: 'Status Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'alcohol_consumption_ref',
      name: 'Alcohol Consumption',
      fields: [
        { name: 'consumption_level', label: 'Consumption Level', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'ulcer_types_ref',
      name: 'Ulcer Types',
      fields: [
        { name: 'type_name', label: 'Type Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'whasa_category', label: 'WHASA Category', type: 'text' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'wound_locations_ref',
      name: 'Wound Locations',
      fields: [
        { name: 'location_name', label: 'Location Name', type: 'text' as const, required: true },
        { name: 'body_region', label: 'Body Region', type: 'select' as const, options: [
          { value: 'upper_limb', label: 'Upper Limb' },
          { value: 'lower_limb', label: 'Lower Limb' },
          { value: 'trunk', label: 'Trunk' },
          { value: 'head_neck', label: 'Head/Neck' },
          { value: 'other', label: 'Other' }
        ]},
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'healability_status_ref',
      name: 'Healability Status',
      fields: [
        { name: 'status_name', label: 'Status Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'clinical_criteria', label: 'Clinical Criteria', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'compression_recommendations_ref',
      name: 'Compression Recommendations',
      fields: [
        { name: 'recommendation_name', label: 'Recommendation Name', type: 'text' as const, required: true },
        { name: 'abpi_min', label: 'ABPI Min', type: 'number' as const },
        { name: 'abpi_max', label: 'ABPI Max', type: 'number' as const },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'clinical_rationale', label: 'Clinical Rationale', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'time_tissue_types_options',
      name: 'T.I.M.E. Tissue Types',
      fields: [
        { name: 'tissue_name', label: 'Tissue Name', type: 'text' as const, required: true },
        { name: 'tissue_category', label: 'Tissue Category', type: 'select' as const, options: [
          { value: 'viable', label: 'Viable' },
          { value: 'non_viable', label: 'Non-viable' },
          { value: 'mixed', label: 'Mixed' }
        ]},
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'clinical_implications', label: 'Clinical Implications', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'infection_indicators_options',
      name: 'Infection Indicators',
      fields: [
        { name: 'indicator_name', label: 'Indicator Name', type: 'text' as const, required: true },
        { name: 'category', label: 'Category', type: 'select' as const, options: [
          { value: 'nerds', label: 'NERDS' },
          { value: 'stones', label: 'STONES' },
          { value: 'systemic', label: 'Systemic' }
        ]},
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'clinical_significance', label: 'Clinical Significance', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'moisture_levels_options',
      name: 'Moisture Levels',
      fields: [
        { name: 'level_name', label: 'Level Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'clinical_implications', label: 'Clinical Implications', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'care_plan_status_ref',
      name: 'Care Plan Status',
      fields: [
        { name: 'status_name', label: 'Status Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'treatment_objective_types_ref',
      name: 'Treatment Objectives',
      fields: [
        { name: 'objective_name', label: 'Objective Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'category', label: 'Category', type: 'select' as const, options: [
          { value: 'healing', label: 'Healing' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'palliative', label: 'Palliative' }
        ]},
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'product_categories_ref',
      name: 'Product Categories',
      fields: [
        { name: 'category_name', label: 'Category Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    },
    {
      id: 'product_types_ref',
      name: 'Product Types',
      fields: [
        { name: 'type_name', label: 'Type Name', type: 'text' as const, required: true },
        { name: 'description', label: 'Description', type: 'textarea' as const },
        { name: 'is_active', label: 'Active', type: 'boolean' as const }
      ]
    }
  ];

  const handleTableSelect = (tableId: string) => {
    setActiveTable(tableId);
  };

  const handleClose = () => {
    setActiveTable(null);
  };

  const selectedTable = referenceTables.find(table => table.id === activeTable);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reference Tables Management</h1>
          <p className="mt-2 text-gray-600">
            Manage system reference tables and lookup values
          </p>
        </div>

        {!activeTable ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {referenceTables.map(table => (
              <div
                key={table.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTableSelect(table.id)}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {table.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {table.fields.length} fields
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Table: {table.id}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Manage →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ReferenceTableManager
            tableName={selectedTable!.id}
            displayName={selectedTable!.name}
            fields={selectedTable!.fields}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default ReferenceTables; 