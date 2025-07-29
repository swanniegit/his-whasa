import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useBookings } from '../hooks/useBookings'
import { useOncall } from '../hooks/useOncall'
import { useReferenceData } from '../hooks/useReferenceData'
import BookingCalendar from '../components/booking/BookingCalendar'
import BookingModal from '../components/booking/BookingModal'
import DayScheduleModal from '../components/booking/DayScheduleModal'
import OncallModal from '../components/booking/OncallModal'
import { toast } from 'react-hot-toast'

const BookingSystem: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDaySchedule, setShowDaySchedule] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showOncallModal, setShowOncallModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [bookingModalMode, setBookingModalMode] = useState<'create' | 'edit' | 'view'>('create')

  const { bookings, loading: bookingsLoading } = useBookings()
  const { oncall_assignments, loading: oncallLoading } = useOncall()
  const { nurses, intervention_types, places, loading: referenceLoading } = useReferenceData()

  // Load data on component mount
  useEffect(() => {
    // Data is loaded automatically by the hooks
  }, [])

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setShowDaySchedule(true)
  }

  const handleNewBooking = () => {
    setSelectedBooking(null)
    setBookingModalMode('create')
    setShowBookingModal(true)
  }

  const handleManageOncall = () => {
    setShowOncallModal(true)
  }

  const handleBookingModalClose = () => {
    setShowBookingModal(false)
    setSelectedBooking(null)
  }

  const handleOncallModalClose = () => {
    setShowOncallModal(false)
  }

  const handleDayScheduleClose = () => {
    setShowDaySchedule(false)
    setSelectedDate(null)
  }

  if (referenceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading booking system...</div>
      </div>
    )
  }

  // Calculate statistics
  const totalBookings = bookings.length
  const todayBookings = bookings.filter(b => b.booking_date === format(new Date(), 'yyyy-MM-dd')).length
  const totalOncall = oncall_assignments.length
  const todayOncall = oncall_assignments.filter(o => o.oncall_date === format(new Date(), 'yyyy-MM-dd')).length

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Booking System</h1>
        <p className="mt-2 text-gray-600">Manage nurse schedules and patient appointments</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{todayBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total On-Call</p>
              <p className="text-2xl font-semibold text-gray-900">{totalOncall}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's On-Call</p>
              <p className="text-2xl font-semibold text-gray-900">{todayOncall}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        <button
          onClick={handleNewBooking}
          className="clinical-button-primary px-6 py-3 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Booking
        </button>
        
        <button
          onClick={() => setShowDaySchedule(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          View Today's Schedule
        </button>
        
        <button
          onClick={handleManageOncall}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Manage On-Call
        </button>
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <BookingCalendar
          onDateClick={handleDateClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
        </div>
        <div className="p-6">
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.slice(0, 5).map(booking => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: booking.nurse?.color_code || '#6b7280' }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{booking.patient_name}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(booking.booking_date), 'MMM d, yyyy')} at {booking.slot_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{booking.nurse?.name || 'Unassigned'}</span>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking)
                        setBookingModalMode('view')
                        setShowBookingModal(true)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No bookings yet</p>
              <button
                onClick={handleNewBooking}
                className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
              >
                Create your first booking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={handleBookingModalClose}
          booking={selectedBooking}
          mode={bookingModalMode}
        />
      )}

      {showDaySchedule && (
        <DayScheduleModal
          isOpen={showDaySchedule}
          onClose={handleDayScheduleClose}
          date={selectedDate || format(new Date(), 'yyyy-MM-dd')}
        />
      )}

      {showOncallModal && (
        <OncallModal
          isOpen={showOncallModal}
          onClose={handleOncallModalClose}
          date={format(new Date(), 'yyyy-MM-dd')}
          existing_assignments={oncall_assignments.filter(o => o.oncall_date === format(new Date(), 'yyyy-MM-dd'))}
        />
      )}
    </div>
  )
}

export default BookingSystem