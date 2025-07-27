import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

// Add Vite environment types
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Missing')

// Create supabase client with fallback to placeholder values if env vars are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables - using placeholder values')
    // Use placeholder values for development
    const placeholderUrl = 'https://placeholder.supabase.co'
    const placeholderKey = 'placeholder-key'
    return createClient<Database>(placeholderUrl, placeholderKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }

  console.log('Creating Supabase client with real credentials')
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
}

export const supabase = createSupabaseClient()

// Export types for use throughout the app
export type { Database } from '../types/database'
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to check if user has role
export const hasRole = async (userId: string, roleName: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('roles.name', roleName)
    .single()
  
  if (error) return false
  return !!data
} 