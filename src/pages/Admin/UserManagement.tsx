import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  professional_registration: string | null
  is_active: boolean
  created_at: string
  roles: UserRole[]
}

interface UserRole {
  role_id: string
  role_name: string
  description: string
  assigned_at: string
}

interface Role {
  id: string
  role_name: string
  description: string
  permissions: any
}

const UserManagement: React.FC = () => {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Access denied. Admin privileges required.')
      return
    }
    loadUsers()
    loadRoles()
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          professional_registration,
          is_active,
          created_at,
          user_roles (
            role_id,
            assigned_at,
            user_roles_ref (
              role_name,
              description
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading users:', error)
        toast.error('Failed to load users')
        return
      }

      const usersWithRoles = data?.map((user: any) => ({
        ...user,
        roles: user.user_roles?.map((role: any) => ({
          role_id: role.role_id,
          role_name: role.user_roles_ref.role_name,
          description: role.user_roles_ref.description,
          assigned_at: role.assigned_at
        })) || []
      })) || []

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles_ref')
        .select('*')
        .eq('is_active', true)
        .order('role_name')

      if (error) {
        console.error('Error loading roles:', error)
        return
      }

      setRoles(data || [])
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) {
        console.error('Error assigning role:', error)
        toast.error('Failed to assign role')
        return
      }

      toast.success('Role assigned successfully')
      loadUsers()
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error('Failed to assign role')
    }
  }

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)

      if (error) {
        console.error('Error removing role:', error)
        toast.error('Failed to remove role')
        return
      }

      toast.success('Role removed successfully')
      loadUsers()
    } catch (error) {
      console.error('Error removing role:', error)
      toast.error('Failed to remove role')
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !isActive })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user status:', error)
        toast.error('Failed to update user status')
        return
      }

      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`)
      loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  if (!isAdmin()) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Access Denied
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>You do not have permission to access this page. Administrator privileges are required.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage user accounts and role assignments
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.first_name?.[0] || user.username?.[0] || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.professional_registration && (
                        <p className="text-xs text-gray-400">
                          Reg: {user.professional_registration}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* User Roles */}
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {role.role_name}
                          <button
                            onClick={() => handleRemoveRole(user.id, role.role_id)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowRoleModal(true)
                        }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Assign Role
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          user.is_active
                            ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                            : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Role Assignment Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Role to {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        handleAssignRole(selectedUser.id, role.id)
                        setShowRoleModal(false)
                      }}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="font-medium text-gray-900">{role.role_name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement