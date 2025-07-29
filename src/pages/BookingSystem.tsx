import React, { useState } from 'react'
import { format } from 'date-fns'
import { useBookings } from '../hooks/useBookings'
import { useOncall } from '../hooks/useOncall'
import { useReferenceData } from '../hooks/useReferenceData'
import BookingCalendar from '../components/booking/BookingCalendar'
import BookingModal from '../components/booking/BookingModal'
import DayScheduleModal from '../components/booking/DayScheduleModal'
import OncallModal from '../components/booking/OncallModal'

const BookingSystem: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showDayScheduleModal, setShowDayScheduleModal] = useState(false)
  const [showOncallModal, setShowOncallModal] = useState(false)
  const [bookingModalMode, setBookingModalMode] = useState<'create' | 'edit' | 'view'>('create')

  const { bookings } = useBookings()
  const { oncall_assignments } = useOncall()
  const { loading: referenceLoading, error: referenceError } = useReferenceData()

  // Render loading state
  if (referenceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading booking system...</h2>
          <p className="text-gray-600">This may take a few moments</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (referenceError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking System</h1>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800">Error Loading Booking System</h3>
              <p className="mt-2 text-sm text-red-700">{referenceError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render main booking system
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking System</h1>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Total Bookings</h3>
              <p className="text-2xl font-bold text-blue-900">{bookings.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">Today's Bookings</h3>
              <p className="text-2xl font-bold text-green-900">
                {bookings.filter(b => b.booking_date === format(new Date(), 'yyyy-MM-dd')).length}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-800">On-Call Assignments</h3>
              <p className="text-2xl font-bold text-purple-900">{oncall_assignments.length}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                console.log('New Booking button clicked')
                setBookingModalMode('create')
                setShowBookingModal(true)
                console.log('Modal state set to:', { bookingModalMode: 'create', showBookingModal: true })
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              New Booking
            </button>
            <button
              onClick={() => setShowOncallModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Manage On-Call
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow">
          <BookingCalendar
            selectedDate={selectedDate || ''}
            onDateClick={(date) => {
              setSelectedDate(date)
              setShowDayScheduleModal(true)
            }}
            bookings={bookings}
            oncall_assignments={oncall_assignments}
          />
        </div>

        {/* Modals */}
        {showBookingModal && (
          <BookingModal
            isOpen={showBookingModal}
            mode={bookingModalMode}
            onClose={() => setShowBookingModal(false)}
            {...(selectedDate && { date: selectedDate })}
          />
        )}

        {showDayScheduleModal && selectedDate && (
          <DayScheduleModal
            isOpen={showDayScheduleModal}
            onClose={() => setShowDayScheduleModal(false)}
            date={selectedDate}
          />
        )}

        {showOncallModal && (
          <OncallModal
            isOpen={showOncallModal}
            onClose={() => setShowOncallModal(false)}
            {...(selectedDate && { date: selectedDate })}
          />
        )}
      </div>
    </div>
  )
}

export default BookingSystem