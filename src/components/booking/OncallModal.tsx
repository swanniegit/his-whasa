import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { OncallFormData, OncallModalProps } from '../../types/booking'
import { useReferenceData } from '../../hooks/useReferenceData'
import { useOncall } from '../../hooks/useOncall'
import { toast } from 'react-hot-toast'

const OncallModal: React.FC<OncallModalProps> = ({
  onClose,
  date
}) => {
  const [assignments, setAssignments] = useState<OncallFormData[]>([])
  const [loading, setLoading] = useState(false)
  const { nurses } = useReferenceData()
  const { createOncall, deleteOncall, oncall_assignments } = useOncall()

  // Get existing assignments for the selected date - use useMemo to prevent infinite loops
  const existingAssignments = useMemo(() => {
    return oncall_assignments.filter(
      assignment => assignment.oncall_date === date
    )
  }, [oncall_assignments, date])

  // Initialize assignments from existing data - only run when existingAssignments or date changes
  useEffect(() => {
    if (existingAssignments.length > 0) {
      const initialAssignments: OncallFormData[] = existingAssignments.map(assignment => ({
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
  }, [existingAssignments, date])

  const handleAssignmentChange = useCallback((callType: 'first_call' | 'second_call', nurseId: string) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.call_type === callType 
          ? { ...assignment, nurse_id: nurseId }
          : assignment
      )
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Delete existing assignments first
      for (const existing of existingAssignments) {
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

  const getNurseColor = useCallback((nurseId: string) => {
    const nurse = nurses.find(n => n.id === nurseId)
    return nurse?.color_code || '#6b7280'
  }, [nurses])

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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* First Call */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Call
              </label>
              <select
                value={assignments.find(a => a.call_type === 'first_call')?.nurse_id || ''}
                onChange={(e) => handleAssignmentChange('first_call', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a nurse</option>
                {nurses.map(nurse => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Second Call */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Second Call
              </label>
              <select
                value={assignments.find(a => a.call_type === 'second_call')?.nurse_id || ''}
                onChange={(e) => handleAssignmentChange('second_call', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a nurse</option>
                {nurses.map(nurse => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Preview */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
              <div className="space-y-2">
                {assignments.map(assignment => {
                  const nurse = nurses.find(n => n.id === assignment.nurse_id)
                  return (
                    <div key={assignment.call_type} className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getNurseColor(assignment.nurse_id) }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {assignment.call_type === 'first_call' ? 'First Call' : 'Second Call'}:
                      </span>
                      <span className="text-sm text-gray-600">
                        {nurse ? nurse.name : 'Unassigned'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OncallModal