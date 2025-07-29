import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { NurseStaff, InterventionType, Place } from '../types/booking'

interface UseReferenceDataReturn {
  nurses: NurseStaff[]
  intervention_types: InterventionType[]
  places: Place[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

export const useReferenceData = (): UseReferenceDataReturn => {
  const [nurses, setNurses] = useState<NurseStaff[]>([])
  const [intervention_types, setInterventionTypes] = useState<InterventionType[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadNurses = useCallback(async () => {
    if (!user) return
    try {
      console.log('Loading nurses...')
      const { data, error: fetchError } = await supabase
        .from('nurse_staff')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      console.log('Nurses loaded:', data?.length || 0)
      setNurses(data || [])
    } catch (err) {
      console.error('Error loading nurses:', err)
      setError(err instanceof Error ? err.message : 'Failed to load nurses')
    }
  }, [user])

  const loadInterventionTypes = useCallback(async () => {
    if (!user) return
    try {
      console.log('Loading intervention types...')
      const { data, error: fetchError } = await supabase
        .from('intervention_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      console.log('Intervention types loaded:', data?.length || 0)
      setInterventionTypes(data || [])
    } catch (err) {
      console.error('Error loading intervention types:', err)
      setError(err instanceof Error ? err.message : 'Failed to load intervention types')
    }
  }, [user])

  const loadPlaces = useCallback(async () => {
    if (!user) return
    try {
      console.log('Loading places...')
      const { data, error: fetchError } = await supabase
        .from('places')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      console.log('Places loaded:', data?.length || 0)
      setPlaces(data || [])
    } catch (err) {
      console.error('Error loading places:', err)
      setError(err instanceof Error ? err.message : 'Failed to load places')
    }
  }, [user])

  const refreshData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadNurses(),
        loadInterventionTypes(),
        loadPlaces()
      ])
    } catch (err) {
      console.error('Error refreshing reference data:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }, [loadNurses, loadInterventionTypes, loadPlaces])

  // Load initial data
  useEffect(() => {
    if (user) {
      refreshData()
    } else {
      setNurses([])
      setInterventionTypes([])
      setPlaces([])
      setLoading(false)
    }
  }, [user, refreshData])

  return {
    nurses,
    intervention_types,
    places,
    loading,
    error,
    refreshData
  }
}