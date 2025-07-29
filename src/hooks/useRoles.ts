import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Role {
  id: string
  role_name: string
  description: string
  permissions: any
  is_active: boolean
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_roles_ref')
        .select('*')
        .eq('is_active', true)
        .order('role_name')

      if (error) {
        throw error
      }

      setRoles(data || [])
    } catch (err) {
      console.error('Error fetching roles:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch roles')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIdByName = (roleName: string): string | null => {
    const role = roles.find(r => r.role_name === roleName)
    return role?.id || null
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  return {
    roles,
    loading,
    error,
    fetchRoles,
    getRoleIdByName
  }
}