import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

interface UserRole {
  role_id: string
  role_name: string
  description: string
  permissions: any
  assigned_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Tables<'users'> | null
  userRoles: UserRole[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: any }>
  signUp: (email: string, password: string, userData: Partial<Tables<'users'>>, roleId?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: Partial<Tables<'users'>>) => Promise<{ error: any }>
  assignRole: (userId: string, roleId: string) => Promise<{ error: any }>
  removeRole: (userId: string, roleId: string) => Promise<{ error: any }>
  hasPermission: (permission: string, resource?: string) => boolean
  isAdmin: () => boolean
  isWoundSpecialist: () => boolean
  isCaseManager: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Tables<'users'> | null>(null)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadProfile(session.user.id)
          await loadUserRoles(session.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await loadProfile(session.user.id)
            await loadUserRoles(session.user.id)
          } else {
            setProfile(null)
            setUserRoles([])
          }
          
          setLoading(false)
        } catch (error) {
          console.error('Error in auth state change:', error)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      // First, try to get the user profile from our custom users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If user profile doesn't exist in our table, create a default one
        if (error.code === 'PGRST116') {
          console.log('User profile not found in custom table, creating default profile...')
          
          // Create a default profile based on Supabase Auth user data
          const defaultProfile = {
            id: userId,
            username: user?.email?.split('@')[0] || 'user',
            email: user?.email || '',
            password_hash: '', // We don't store passwords in our table
            first_name: user?.user_metadata?.first_name || '',
            last_name: user?.user_metadata?.last_name || '',
            professional_registration: user?.user_metadata?.professional_registration || '',
            phone_number: user?.user_metadata?.phone_number || '',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert(defaultProfile)
            .select()
            .single()

          if (createError) {
            console.error('Error creating default profile:', createError)
            // If creation fails, create a minimal profile using the user's email
            const minimalProfile = {
              id: userId,
              username: user?.email?.split('@')[0] || 'user',
              email: user?.email || '',
              password_hash: '',
              first_name: '',
              last_name: '',
              professional_registration: '',
              phone_number: '',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            const { data: fallbackProfile, error: fallbackError } = await supabase
              .from('users')
              .upsert(minimalProfile, { onConflict: 'id' })
              .select()
              .single()

            if (fallbackError) {
              console.error('Error creating fallback profile:', fallbackError)
              // If all else fails, create a profile object from Supabase Auth data
              setProfile({
                id: userId,
                username: user?.email?.split('@')[0] || 'user',
                email: user?.email || '',
                password_hash: '',
                first_name: user?.user_metadata?.first_name || '',
                last_name: user?.user_metadata?.last_name || '',
                professional_registration: user?.user_metadata?.professional_registration || '',
                phone_number: user?.user_metadata?.phone_number || '',
                is_active: true,
                last_login: null,
                password_reset_token: null,
                password_reset_expires: null,
                two_factor_secret: null,
                two_factor_enabled: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any)
              return
            }

            setProfile(fallbackProfile)
            return
          }

          setProfile(newProfile)
          return
        }
        
        console.error('Error loading profile:', error)
        // If there's any other error, create a fallback profile from Supabase Auth data
        console.log('Creating fallback profile from Supabase Auth data...')
        setProfile({
          id: userId,
          username: user?.email?.split('@')[0] || 'user',
          email: user?.email || '',
          password_hash: '',
          first_name: user?.user_metadata?.first_name || '',
          last_name: user?.user_metadata?.last_name || '',
          professional_registration: user?.user_metadata?.professional_registration || '',
          phone_number: user?.user_metadata?.phone_number || '',
          is_active: true,
          last_login: null,
          password_reset_token: null,
          password_reset_expires: null,
          two_factor_secret: null,
          two_factor_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      // If there's any exception, create a fallback profile from Supabase Auth data
      console.log('Creating fallback profile from Supabase Auth data due to exception...')
      setProfile({
        id: userId,
        username: user?.email?.split('@')[0] || 'user',
        email: user?.email || '',
        password_hash: '',
        first_name: user?.user_metadata?.first_name || '',
        last_name: user?.user_metadata?.last_name || '',
        professional_registration: user?.user_metadata?.professional_registration || '',
        phone_number: user?.user_metadata?.phone_number || '',
        is_active: true,
        last_login: null,
        password_reset_token: null,
        password_reset_expires: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
    }
  }

  const loadUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          assigned_at,
          user_roles_ref (
            role_name,
            description,
            permissions
          )
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Error loading user roles:', error)
        setUserRoles([])
        return
      }

      const roles = data?.map((item: any) => ({
        role_id: item.role_id,
        role_name: item.user_roles_ref?.role_name,
        description: item.user_roles_ref?.description,
        permissions: item.user_roles_ref?.permissions,
        assigned_at: item.assigned_at
      })) || []

      setUserRoles(roles)
    } catch (error) {
      console.error('Error loading user roles:', error)
      setUserRoles([])
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { success: !error, error }
  }

  const signUp = async (email: string, password: string, userData: Partial<Tables<'users'>>, roleId?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          professional_registration: userData.professional_registration,
          phone_number: userData.phone_number,
        }
      }
    })

    if (!error && data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username: userData.username || email,
          email,
          password_hash: '', // Will be handled by Supabase Auth
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          professional_registration: userData.professional_registration,
          phone_number: userData.phone_number,
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return { error: profileError }
      }

      // Assign default role if provided
      if (roleId) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role_id: roleId,
            assigned_by: data.user.id // Self-assigned during registration
          })

        if (roleError) {
          console.error('Error assigning role:', roleError)
          // Don't fail registration if role assignment fails
        }
      }
    }

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updateProfile = async (updates: Partial<Tables<'users'>>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      await loadProfile(user.id)
    }

    return { error }
  }

  const assignRole = async (userId: string, roleId: string) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: user.id
      })

    if (!error) {
      await loadUserRoles(userId)
    }

    return { error }
  }

  const removeRole = async (userId: string, roleId: string) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId)

    if (!error) {
      await loadUserRoles(userId)
    }

    return { error }
  }

  const hasPermission = (permission: string, resource?: string): boolean => {
    if (!userRoles.length) return false

    return userRoles.some(role => {
      const permissions = role.permissions
      
      // Check for admin role (has all permissions)
      if (permissions.all && permissions.all.includes(permission)) {
        return true
      }

      // Check specific resource permissions
      if (resource && permissions[resource]) {
        return permissions[resource].includes(permission)
      }

      return false
    })
  }

  const isAdmin = (): boolean => {
    return userRoles.some(role => role.role_name === 'administrator')
  }

  const isWoundSpecialist = (): boolean => {
    return userRoles.some(role => role.role_name === 'wound_specialist_nurse')
  }

  const isCaseManager = (): boolean => {
    return userRoles.some(role => role.role_name === 'case_manager')
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    userRoles,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    assignRole,
    removeRole,
    hasPermission,
    isAdmin,
    isWoundSpecialist,
    isCaseManager,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 