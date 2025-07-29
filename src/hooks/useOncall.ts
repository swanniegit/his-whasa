import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import {
  NurseOncall,
  OncallFormData,
  OncallApiResponse,
  UseOncallReturn
} from '../types/booking'

export const useOncall = (): UseOncallReturn => {
  const [oncall_assignments, setOncallAssignments] = useState<NurseOncall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const getOncallForDate = useCallback(async (date: string): Promise<NurseOncall[]> => {
    if (!user) return []

    try {
      const { data, error: fetchError } = await supabase
        .from('nurse_oncall')
        .select(`
          *,
          nurse:nurse_staff(*)
        `)
        .eq('oncall_date', date)
        .order('call_type', { ascending: true })

      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      console.error('Error fetching oncall for date:', err)
      return []
    }
  }, [user])

  const getOncallForMonth = useCallback(async (start_date: string, end_date: string): Promise<NurseOncall[]> => {
    if (!user) return []

    try {
      const { data, error: fetchError } = await supabase
        .from('nurse_oncall')
        .select(`
          *,
          nurse:nurse_staff(*)
        `)
        .gte('oncall_date', start_date)
        .lte('oncall_date', end_date)
        .order('oncall_date', { ascending: true })
        .order('call_type', { ascending: true })

      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      console.error('Error fetching oncall for month:', err)
      return []
    }
  }, [user])

  const createOncall = useCallback(async (data: OncallFormData): Promise<OncallApiResponse> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { data: oncall, error } = await supabase
        .from('nurse_oncall')
        .insert({
          ...data,
          created_by: user.id
        })
        .select(`
          *,
          nurse:nurse_staff(*)
        `)
        .single()

      if (error) throw error

      setOncallAssignments(prev => [...prev, oncall])
      return { success: true, data: oncall }
    } catch (err) {
      console.error('Error creating oncall assignment:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create oncall assignment' 
      }
    }
  }, [user])

  const deleteOncall = useCallback(async (id: string): Promise<OncallApiResponse> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { error } = await supabase
        .from('nurse_oncall')
        .delete()
        .eq('id', id)

      if (error) throw error

      setOncallAssignments(prev => prev.filter(o => o.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Error deleting oncall assignment:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete oncall assignment' 
      }
    }
  }, [user])

  // Load initial data
  useEffect(() => {
    const loadOncallData = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        const start_date = new Date()
        start_date.setMonth(start_date.getMonth() - 1)
        const end_date = new Date()
        end_date.setMonth(end_date.getMonth() + 1)

        const data = await getOncallForMonth(
          start_date.toISOString().split('T')[0],
          end_date.toISOString().split('T')[0]
        )

        setOncallAssignments(data)
      } catch (err) {
        console.error('Error loading oncall data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load oncall data')
      } finally {
        setLoading(false)
      }
    }

    loadOncallData()
  }, [user, getOncallForMonth])

  return {
    oncall_assignments,
    loading,
    error,
    createOncall,
    deleteOncall,
    getOncallForDate,
    getOncallForMonth
  }
}