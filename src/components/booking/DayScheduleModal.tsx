import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { NurseBooking, NurseOncall } from '../../types/booking'
import { useBookings } from '../../hooks/useBookings'
import { useOncall } from '../../hooks/useOncall'
import { useReferenceData } from '../../hooks/useReferenceData'
import BookingModal from './BookingModal'

interface DayScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
}

const DayScheduleModal: React.FC<DayScheduleModalProps> = ({
  isOpen,
  onClose,
  date
}) => {
  const [selectedBooking, setSelectedBooking] = useState<NurseBooking | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingModalMode, setBookingModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')

  const { bookings, deleteBooking } = useBookings()
  const { oncall_assignments } = useOncall()
  const { nurses } = useReferenceData()

  // Time slots from 08:00 to 17:00 in 30-minute intervals
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00'
  ]

  const dayBookings = bookings.filter(b => b.booking_date === date)
  const dayOncall = oncall_assignments.filter(o => o.oncall_date === date)

  const getNurseColor = (nurseId: string) => {
    const nurse = nurses.find(n => n.id === nurseId)
    return nurse?.color_code || '#6b7280'
  }

  const getPaymentStatus = (booking: NurseBooking) => {
    const { outstanding_amount, paid_amount } = booking
    if (outstanding_amount === 0 && paid_amount === 0) return { type: 'no_payment', label: 'No Payment', color: 'bg-gray-100 text-gray-800' }
    if (paid_amount >= outstanding_amount) return { type: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' }
    if (paid_amount > 0) return { type: 'partial', label: 'Partial', color: 'bg-yellow-100 text-yellow-800' }
    return { type: 'outstanding', label: 'Outstanding', color: 'bg-red-100 text-red-800' }
  }

  const handleAddBooking = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
    setBookingModalMode('create')
    setShowBookingModal(true)
  }

  const handleEditBooking = (booking: NurseBooking) => {
    setSelectedBooking(booking)
    setBookingModalMode('edit')
    setShowBookingModal(true)
  }

  const handleViewBooking = (booking: NurseBooking) => {
    setSelectedBooking(booking)
    setBookingModalMode('view')
    setShowBookingModal(true)
  }

  const handleDeleteBooking = async (booking: NurseBooking) => {
    if (window.confirm(`Are you sure you want to delete the booking for ${booking.patient_name}?`)) {
      const result = await deleteBooking(booking.id)
      if (result?.success) {
        // Success handled by toast in hook
      }
    }
  }

  const handleBookingModalClose = () => {
    setShowBookingModal(false)
    setSelectedBooking(null)
    setSelectedTimeSlot('')
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Schedule for {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {dayBookings.length} booking(s) • {dayOncall.length} on-call assignment(s)
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* On-Call Assignments */}
            {dayOncall.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium mb-3 text-gray-900">On-Call Assignments</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dayOncall.map(oncall => (
                    <div
                      key={oncall.id}
                      className="p-4 rounded-lg border"
                      style={{ 
                        borderLeftColor: getNurseColor(oncall.nurse_id), 
                        borderLeftWidth: '4px' 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{oncall.nurse?.name}</div>
                          <div className="text-sm text-gray-600 capitalize">
                            {oncall.call_type.replace('_', ' ')} call
                          </div>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getNurseColor(oncall.nurse_id) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-900 mb-3">Time Slots</h4>
              {timeSlots.map(time => {
                const slotBookings = dayBookings.filter(b => b.slot_time === time)
                
                return (
                  <div key={time} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center border-b bg-gray-50 px-4 py-3">
                      <div className="w-20 text-sm font-medium text-gray-700">
                        {time}
                      </div>
                      <div className="flex-1 ml-4">
                        {slotBookings.length > 0 ? (
                          <span className="text-sm text-gray-600">
                            {slotBookings.length} booking(s)
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Available</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddBooking(time)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Add Booking
                      </button>
                    </div>
                    
                    <div className="p-4">
                      {slotBookings.length > 0 ? (
                        <div className="space-y-3">
                          {slotBookings.map(booking => {
                            const paymentStatus = getPaymentStatus(booking)
                            return (
                              <div
                                key={booking.id}
                                className="p-3 rounded-lg border"
                                style={{ 
                                  backgroundColor: getNurseColor(booking.nurse_id || '') + '10',
                                  borderLeftColor: getNurseColor(booking.nurse_id || ''),
                                  borderLeftWidth: '4px'
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h5 className="font-medium text-gray-900">
                                        {booking.patient_name}
                                      </h5>
                                      {booking.patient_id_case_assess && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                          {booking.patient_id_case_assess}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                      <div>
                                        <span className="font-medium">Nurse:</span> {booking.nurse?.name || 'Unassigned'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Service:</span> {booking.intervention_type?.name || 'Not specified'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Location:</span> {booking.place?.name || 'Not specified'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Payment:</span>
                                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${paymentStatus.color}`}>
                                          {paymentStatus.label}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {booking.notes && (
                                      <div className="mt-2 text-sm text-gray-500">
                                        <span className="font-medium">Notes:</span> {booking.notes}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      onClick={() => handleViewBooking(booking)}
                                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                      title="View details"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleEditBooking(booking)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Edit booking"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBooking(booking)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete booking"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm">No bookings for this time slot</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total: {dayBookings.length} booking(s) • {dayOncall.length} on-call assignment(s)
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={handleBookingModalClose}
          booking={selectedBooking}
          date={date}
          time={selectedTimeSlot}
          mode={bookingModalMode}
        />
      )}
    </>
  )
}

export default DayScheduleModal