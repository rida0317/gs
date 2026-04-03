// src/components/ProtectedRoute.tsx - Protected route wrapper with role-based access control

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import type { UserRole } from '../types'
import type { Permissions } from '../config/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiredPermission?: keyof Permissions
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission
}) => {
  const { user, loading, userData, hasPermission, isRole, logout } = useAuth()
  const location = useLocation()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '2rem',
        color: 'var(--primary-color)'
      }}>
        <div>⏳ Chargement...</div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 🛡️ SECURITY CHECK: Account Status
  // If user is logged in but status is not 'active', they should not access the app
  if (userData && userData.status !== 'active') {
    const statusMessage = userData.status === 'pending' 
      ? '⏳ Votre compte est en attente de validation par l\'administration.'
      : '❌ Votre compte est suspendu. Veuillez contacter l\'administrateur.';
    
    return (
      <Navigate 
        to="/login" 
        state={{ error: statusMessage }} 
        replace 
      />
    )
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userData?.role || !isRole(allowedRoles)) {
      return (
        <Navigate
          to="/unauthorized"
          state={{
            message: '❌ Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
            requiredRoles: allowedRoles,
            userRole: userData?.role
          }}
          replace
        />
      )
    }
  }

  // Check if user has required permission
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return (
        <Navigate
          to="/unauthorized"
          state={{
            message: '❌ Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
            requiredPermission,
            userRole: userData?.role
          }}
          replace
        />
      )
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

export default ProtectedRoute
