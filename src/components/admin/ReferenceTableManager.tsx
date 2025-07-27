import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ReferenceTableManagerProps {
  tableName: string;
  displayName: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'boolean' | 'number';
    required?: boolean;
    options?: { value: string; label: string }[];
  }[];
  onClose: () => void;
}

interface ReferenceItem {
  id: string;
  [key: string]: any;
}

export const ReferenceTableManager: React.FC<ReferenceTableManagerProps> = ({
  tableName,
  displayName,
  fields,
  onClose
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load reference table data
  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error(`Error loading ${displayName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [tableName]);

  // Initialize form data
  const initializeFormData = (item?: ReferenceItem) => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      initialData[field.name] = item?.[field.name] || '';
    });
    setFormData(initialData);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from(tableName)
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from(tableName)
          .insert([formData]);

        if (error) throw error;
      }

      // Reset form and reload data
      setEditingItem(null);
      setIsFormOpen(false);
      initializeFormData();
      loadItems();
    } catch (error) {
      console.error(`Error saving ${displayName}:`, error);
    }
  };

  // Handle item deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadItems();
    } catch (error) {
      console.error(`Error deleting ${displayName}:`, error);
    }
  };

  // Handle edit item
  const handleEdit = (item: ReferenceItem) => {
    setEditingItem(item);
    initializeFormData(item);
    setIsFormOpen(true);
  };

  // Handle add new item
  const handleAdd = () => {
    setEditingItem(null);
    initializeFormData();
    setIsFormOpen(true);
  };

  // Render form field
  const renderField = (field: typeof fields[0]) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            key={field.name}
            name={field.name}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            key={field.name}
            name={field.name}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <input
            key={field.name}
            type="checkbox"
            name={field.name}
            checked={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        );

      case 'number':
        return (
          <input
            key={field.name}
            type="number"
            name={field.name}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          />
        );

      default:
        return (
          <input
            key={field.name}
            type="text"
            name={field.name}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          />
        );
    }
  };

  if (!user) {
    return <div className="p-4">Please log in to manage reference tables.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{displayName} Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add New
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? `Edit ${displayName}` : `Add New ${displayName}`}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {fields.map(field => (
                  <th
                    key={field.name}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {fields.map(field => (
                    <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {field.type === 'boolean' ? (
                        item[field.name] ? 'Yes' : 'No'
                      ) : (
                        item[field.name] || '-'
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {items.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No {displayName.toLowerCase()} found. Click "Add New" to create one.
        </div>
      )}
    </div>
  );
}; 