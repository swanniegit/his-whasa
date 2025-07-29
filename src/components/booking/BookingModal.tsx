import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { BookingFormData, BookingModalProps } from '../../types/booking'
import { useReferenceData } from '../../hooks/useReferenceData'
import { useBookings } from '../../hooks/useBookings'
import { toast } from 'react-hot-toast'
import { BookingApiResponse } from '../../types/booking'

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  date,
  time,
  mode
}) => {
  console.log('BookingModal rendered with props:', { isOpen, mode, date, time })
  
  const [formData, setFormData] = useState<BookingFormData>({
    nurse_id: '',
    patient_name: '',
    patient_id_case_assess: '',
    booking_date: date || format(new Date(), 'yyyy-MM-dd'),
    slot_time: time || '08:00',
    intervention_type_id: '',
    place_id: '',
    outstanding_amount: 0,
    paid_amount: 0,
    payment_method: 'pending',
    notes: ''
  })

  const [loading, setLoading] = useState(false)
  const { nurses, intervention_types, places } = useReferenceData()
  const { createBooking, updateBooking } = useBookings()

  // Time slots from 08:00 to 17:00 in 30-minute intervals
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00'
  ]

  // Initialize form data when booking is provided (edit mode)
  useEffect(() => {
    if (booking && mode === 'edit') {
      setFormData({
        nurse_id: booking.nurse_id || '',
        patient_name: booking.patient_name,
        patient_id_case_assess: booking.patient_id_case_assess || '',
        booking_date: booking.booking_date,
        slot_time: booking.slot_time,
        intervention_type_id: booking.intervention_type_id || '',
        place_id: booking.place_id || '',
        outstanding_amount: booking.outstanding_amount,
        paid_amount: booking.paid_amount,
        payment_method: booking.payment_method,
        notes: booking.notes || ''
      })
    }
  }, [booking, mode])

  const handleInputChange = (field: keyof BookingFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const cleanedFormData: BookingFormData = {
      patient_name: formData.patient_name,
      booking_date: formData.booking_date,
      slot_time: formData.slot_time,
      outstanding_amount: formData.outstanding_amount,
      paid_amount: formData.paid_amount,
      payment_method: formData.payment_method,
      ...(formData.nurse_id && { nurse_id: formData.nurse_id }),
      ...(formData.intervention_type_id && { intervention_type_id: formData.intervention_type_id }),
      ...(formData.place_id && { place_id: formData.place_id }),
      ...(formData.patient_id_case_assess && { patient_id_case_assess: formData.patient_id_case_assess }),
      ...(formData.notes && { notes: formData.notes })
    }

    try {
      let result: BookingApiResponse
      
      if (mode === 'create') {
        result = await createBooking(cleanedFormData)
      } else if (mode === 'edit' && booking) {
        result = await updateBooking(booking.id, cleanedFormData)
      } else {
        toast.error('Invalid operation mode')
        setLoading(false)
        return
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Booking created successfully' : 'Booking updated successfully')
        onClose()
      } else {
        toast.error(result.error || 'Failed to save booking')
      }
    } catch (error) {
      console.error('Error saving booking:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatus = () => {
    const { outstanding_amount, paid_amount } = formData
    if (outstanding_amount === 0 && paid_amount === 0) return 'no_payment'
    if (paid_amount >= outstanding_amount) return 'paid'
    if (paid_amount > 0) return 'partial'
    return 'outstanding'
  }

  const paymentStatus = getPaymentStatus()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'New Booking' : mode === 'edit' ? 'Edit Booking' : 'View Booking'}
          </h3>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            <div className="md:col-span-2">
              <h4 className="text-md font-medium text-gray-900 mb-4">Patient Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="clinical-input"
                    value={formData.patient_name}
                    onChange={(e) => handleInputChange('patient_name', e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient ID/Case/Assess
                  </label>
                  <input
                    type="text"
                    className="clinical-input"
                    value={formData.patient_id_case_assess}
                    onChange={(e) => handleInputChange('patient_id_case_assess', e.target.value)}
                    placeholder="Optional patient identifier"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="md:col-span-2">
              <h4 className="text-md font-medium text-gray-900 mb-4">Scheduling</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="clinical-input"
                    value={formData.booking_date}
                    onChange={(e) => handleInputChange('booking_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <select
                    required
                    className="clinical-input"
                    value={formData.slot_time}
                    onChange={(e) => handleInputChange('slot_time', e.target.value)}
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nurse
                  </label>
                  <select
                    className="clinical-input"
                    value={formData.nurse_id}
                    onChange={(e) => handleInputChange('nurse_id', e.target.value)}
                  >
                    <option value="">Select Nurse</option>
                    {nurses.map(nurse => (
                      <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Service and Location */}
            <div className="md:col-span-2">
              <h4 className="text-md font-medium text-gray-900 mb-4">Service & Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervention Type
                  </label>
                  <select
                    className="clinical-input"
                    value={formData.intervention_type_id}
                    onChange={(e) => handleInputChange('intervention_type_id', e.target.value)}
                  >
                    <option value="">Select Service</option>
                    {intervention_types.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Place
                  </label>
                  <select
                    className="clinical-input"
                    value={formData.place_id}
                    onChange={(e) => handleInputChange('place_id', e.target.value)}
                  >
                    <option value="">Select Location</option>
                    {places.map(place => (
                      <option key={place.id} value={place.id}>{place.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="md:col-span-2">
              <h4 className="text-md font-medium text-gray-900 mb-4">Payment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outstanding Amount
                  </label>
                  <input
                    type="text"
                    className="clinical-input"
                    value={formData.outstanding_amount === 0 ? '' : formData.outstanding_amount.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      const numValue = value === '' ? 0 : parseFloat(value) || 0
                      handleInputChange('outstanding_amount', numValue)
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Amount
                  </label>
                  <input
                    type="text"
                    className="clinical-input"
                    value={formData.paid_amount === 0 ? '' : formData.paid_amount.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      const numValue = value === '' ? 0 : parseFloat(value) || 0
                      handleInputChange('paid_amount', numValue)
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    className="clinical-input"
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value as 'cash' | 'credit_card' | 'pending')}
                  >
                    <option value="pending">Pending</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
              </div>

              {/* Payment Status Indicator */}
              <div className="mt-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  paymentStatus === 'outstanding' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {paymentStatus === 'paid' ? 'Paid' :
                   paymentStatus === 'partial' ? 'Partial Payment' :
                   paymentStatus === 'outstanding' ? 'Outstanding' :
                   'No Payment'}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                className="clinical-input"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the booking..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={loading}
                className="clinical-button-primary px-4 py-2"
              >
                {loading ? 'Saving...' : (mode === 'create' ? 'Create Booking' : 'Update Booking')}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {mode === 'create' ? 'Create a new booking for the selected time slot.' : 
             mode === 'edit' ? 'Update the booking details.' : 
             'View booking details.'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingModal