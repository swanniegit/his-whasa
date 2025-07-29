import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { NurseOncall, OncallFormData, OncallModalProps } from '../../types/booking'
import { useReferenceData } from '../../hooks/useReferenceData'
import { useOncall } from '../../hooks/useOncall'
import { toast } from 'react-hot-toast'

const OncallModal: React.FC<OncallModalProps> = ({
  isOpen,
  onClose,
  date,
  existing_assignments = []
}) => {
  const [assignments, setAssignments] = useState<OncallFormData[]>([])
  const [loading, setLoading] = useState(false)
  const { nurses } = useReferenceData()
  const { createOncall, deleteOncall } = useOncall()

  // Initialize assignments from existing data
  useEffect(() => {
    if (existing_assignments.length > 0) {
      const initialAssignments: OncallFormData[] = existing_assignments.map(assignment => ({
        nurse_id: assignment.nurse_id,
        oncall_date: assignment.oncall_date,
        call_type: assignment.call_type
      }))
      setAssignments(initialAssignments)
    } else {
      // Initialize with empty assignments for first and second call
      setAssignments([
        { nurse_id: '', oncall_date: date || format(new Date(), 'yyyy-MM-dd'), call_type: 'first_call' },
        { nurse_id: '', oncall_date: date || format(new Date(), 'yyyy-MM-dd'), call_type: 'second_call' }
      ])
    }
  }, [existing_assignments, date])

  const handleAssignmentChange = (callType: 'first_call' | 'second_call', nurseId: string) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.call_type === callType 
          ? { ...assignment, nurse_id: nurseId }
          : assignment
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Delete existing assignments first
      for (const existing of existing_assignments) {
        await deleteOncall(existing.id)
      }

      // Create new assignments
      const results = await Promise.all(
        assignments
          .filter(assignment => assignment.nurse_id)
          .map(assignment => createOncall(assignment))
      )

      const hasErrors = results.some(result => !result.success)
      
      if (hasErrors) {
        toast.error('Some assignments could not be saved')
      } else {
        toast.success('On-call assignments updated successfully!')
        onClose()
      }
    } catch (error) {
      console.error('Error updating on-call assignments:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getNurseColor = (nurseId: string) => {
    const nurse = nurses.find(n => n.id === nurseId)
    return nurse?.color_code || '#6b7280'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              On-Call Assignments
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(new Date(date || new Date()), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* First Call Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                First Call Nurse
              </label>
              <div className="space-y-3">
                <select
                  className="clinical-input"
                  value={assignments.find(a => a.call_type === 'first_call')?.nurse_id || ''}
                  onChange={(e) => handleAssignmentChange('first_call', e.target.value)}
                >
                  <option value="">Select nurse</option>
                  {nurses.map(nurse => (
                    <option key={nurse.id} value={nurse.id}>
                      {nurse.name}
                    </option>
                  ))}
                </select>
                
                {assignments.find(a => a.call_type === 'first_call')?.nurse_id && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: getNurseColor(assignments.find(a => a.call_type === 'first_call')?.nurse_id || '') 
                      }}
                    />
                    <span className="text-sm font-medium text-blue-900">
                      {nurses.find(n => n.id === assignments.find(a => a.call_type === 'first_call')?.nurse_id)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Second Call Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Second Call Nurse
              </label>
              <div className="space-y-3">
                <select
                  className="clinical-input"
                  value={assignments.find(a => a.call_type === 'second_call')?.nurse_id || ''}
                  onChange={(e) => handleAssignmentChange('second_call', e.target.value)}
                >
                  <option value="">Select nurse</option>
                  {nurses.map(nurse => (
                    <option key={nurse.id} value={nurse.id}>
                      {nurse.name}
                    </option>
                  ))}
                </select>
                
                {assignments.find(a => a.call_type === 'second_call')?.nurse_id && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: getNurseColor(assignments.find(a => a.call_type === 'second_call')?.nurse_id || '') 
                      }}
                    />
                    <span className="text-sm font-medium text-purple-900">
                      {nurses.find(n => n.id === assignments.find(a => a.call_type === 'second_call')?.nurse_id)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Nurse Color Legend */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Nurse Colors</h4>
              <div className="grid grid-cols-2 gap-2">
                {nurses.slice(0, 8).map(nurse => (
                  <div key={nurse.id} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: nurse.color_code }}
                    />
                    <span className="text-gray-600">{nurse.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="clinical-button-primary px-4 py-2"
            onClick={handleSubmit}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              'Save Assignments'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OncallModal