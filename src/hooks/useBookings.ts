import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import {
  NurseBooking,
  BookingFormData,
  BookingFilters,
  BookingApiResponse,
  UseBookingsReturn
} from '../types/booking'

export const useBookings = (): UseBookingsReturn => {
  const [bookings, setBookings] = useState<NurseBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const getBookings = useCallback(async (filters?: BookingFilters) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('nurse_bookings')
        .select(`
          *,
          nurse:nurse_staff(*),
          intervention_type:intervention_types(*),
          place:places(*)
        `)
        .order('booking_date', { ascending: true })
        .order('slot_time', { ascending: true })

      if (filters?.date) {
        query = query.eq('booking_date', filters.date)
      }
      if (filters?.nurse_id) {
        query = query.eq('nurse_id', filters.nurse_id)
      }
      if (filters?.intervention_type_id) {
        query = query.eq('intervention_type_id', filters.intervention_type_id)
      }
      if (filters?.place_id) {
        query = query.eq('place_id', filters.place_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.payment_method) {
        query = query.eq('payment_method', filters.payment_method)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setBookings(data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }, [user])

  const createBooking = useCallback(async (data: BookingFormData): Promise<BookingApiResponse> => {
    if (!user) {
      console.error('User not authenticated for booking creation')
      return { success: false, error: 'User not authenticated' }
    }
    try {
      const { data: booking, error } = await supabase
        .from('nurse_bookings')
        .insert({
          ...data,
          created_by: user.id,
          updated_by: user.id
        })
        .select(`
          *,
          nurse:nurse_staff(*),
          intervention_type:intervention_types(*),
          place:places(*)
        `)
        .single()

      if (error) throw error
      
      setBookings(prev => [...prev, booking])
      return { success: true, data: booking }
    } catch (err) {
      console.error('Error creating booking:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create booking'
      }
    }
  }, [user])

  const updateBooking = useCallback(async (id: string, data: Partial<BookingFormData>): Promise<BookingApiResponse> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { data: booking, error } = await supabase
        .from('nurse_bookings')
        .update({
          ...data,
          updated_by: user.id
        })
        .eq('id', id)
        .select(`
          *,
          nurse:nurse_staff(*),
          intervention_type:intervention_types(*),
          place:places(*)
        `)
        .single()

      if (error) throw error

      setBookings(prev => prev.map(b => b.id === id ? booking : b))
      return { success: true, data: booking }
    } catch (err) {
      console.error('Error updating booking:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update booking' 
      }
    }
  }, [user])

  const deleteBooking = useCallback(async (id: string): Promise<BookingApiResponse> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('nurse_bookings')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBookings(prev => prev.filter(b => b.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Error deleting booking:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete booking' 
      }
    }
  }, [user])

  const getBooking = useCallback(async (id: string): Promise<NurseBooking | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('nurse_bookings')
        .select(`
          *,
          nurse:nurse_staff(*),
          intervention_type:intervention_types(*),
          place:places(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching booking:', err)
      return null
    }
  }, [user])

  useEffect(() => {
    getBookings()
  }, [getBookings])

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookings,
    getBooking
  }
}