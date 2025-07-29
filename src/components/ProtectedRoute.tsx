import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredPermission?: string
  resource?: string
  fallbackPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/dashboard'
}) => {
  const { user, loading, roles, isAdmin } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check for specific role requirement
  if (requiredRole) {
    const hasRole = roles.some(role => role.role.role_name === requiredRole)
    if (!hasRole && !isAdmin()) {
      return <Navigate to={fallbackPath} replace />
    }
  }

  // Check for specific permission requirement (simplified for now)
  if (requiredPermission) {
    // For now, just check if user is admin for any permission
    if (!isAdmin()) {
      return <Navigate to={fallbackPath} replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute