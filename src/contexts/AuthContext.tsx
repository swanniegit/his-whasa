import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  role_id?: string
  created_at: string
  updated_at: string
}

interface UserRole {
  id: string
  user_id: string
  role_id: string
  role: {
    id: string
    role_name: string
    description?: string
  }
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  roles: UserRole[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, firstName: string, lastName: string, roleId?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: () => boolean
  isWoundSpecialist: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userData: User) => {
    try {
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userData.id)
        .single()

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 5000)
      })

      const result = await Promise.race([profilePromise, timeoutPromise])
      const { data, error } = result as { data: any, error: any }

      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
      // Set a default profile to prevent infinite loading
      setProfile({
        id: userData.id,
        first_name: userData.user_metadata?.first_name || '',
        last_name: userData.user_metadata?.last_name || '',
        email: userData.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }, [])

  const loadUserRoles = useCallback(async (userData: User) => {
    try {
      const rolesPromise = supabase
        .from('user_roles')
        .select(`
          *,
          role:user_roles_ref(*)
        `)
        .eq('user_id', userData.id)

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('User roles query timeout')), 5000)
      })

      const result = await Promise.race([rolesPromise, timeoutPromise])
      const { data, error } = result as { data: any, error: any }

      if (error) throw error
      setRoles(data || [])
    } catch (err) {
      console.error('Error loading user roles:', err)
      // Set empty roles to prevent infinite loading
      setRoles([])
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return error ? { success: false, error: error.message } : { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sign in' }
    }
  }

  const signUp = useCallback(async (email: string, password: string, firstName: string, lastName: string, roleId?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            role_id: roleId
          })

        if (profileError) throw profileError

        // Assign role if provided
        if (roleId) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role_id: roleId
            })

          if (roleError) throw roleError
        }
      }

      return { success: true }
    } catch (err) {
      console.error('Error signing up:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to sign up' 
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await Promise.all([
        loadProfile(user),
        loadUserRoles(user)
      ])
    }
  }, [user, loadProfile, loadUserRoles])

  const isAdmin = useCallback(() => {
    return roles.some(role => role.role.role_name === 'administrator')
  }, [roles])

  const isWoundSpecialist = useCallback(() => {
    return roles.some(role => role.role.role_name === 'wound_specialist_nurse')
  }, [roles])

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await Promise.all([
            loadProfile(session.user),
            loadUserRoles(session.user)
          ])
        }
      } catch (err) {
        console.error('Error getting initial session:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session?.user) {
          setUser(session.user)
          await Promise.all([
            loadProfile(session.user),
            loadUserRoles(session.user)
          ])
        } else {
          setUser(null)
          setProfile(null)
          setRoles([])
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    profile,
    roles,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin,
    isWoundSpecialist
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 