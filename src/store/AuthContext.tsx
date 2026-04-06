// src/store/AuthContext.tsx - Authentication Context Provider (Supabase Version)

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { UserRole, UserStatus } from '../types'
import { hasPermission, type Permissions } from '../config/permissions'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>
  logout: () => Promise<void>
  userData: UserData | null
  hasPermission: (permission: keyof Permissions) => boolean
  isRole: (allowedRoles: UserRole[]) => boolean
  isSuperUser: () => boolean
  verifyUser: (userId: string, status: UserStatus, verifiedBy?: string) => Promise<void>
  getUserStatus: () => UserStatus | undefined
  getAllProfiles: () => Promise<any[]>
  updateProfile: (userId: string, updates: Partial<{ full_name: string, role: UserRole, status: UserStatus }>) => Promise<void>
  deleteProfile: (userId: string) => Promise<void>
}

interface UserData {
  uid: string
  email: string
  displayName: string
  organizationId?: string
  role: UserRole
  status?: UserStatus
  createdAt?: string
  verifiedAt?: string
  verifiedBy?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserData = async (userId: string, email: string) => {
    try {
      console.log('📥 Loading user profile for:', userId)
      
      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .throwOnError()
        .single()
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout - check RLS policies')), 5000)
      )
      
      const { data, error, status } = await Promise.race([queryPromise, timeoutPromise])

      if (error || status === 406) {
        console.error('Profile query error (possibly missing row):', error || status)
        // Set fallback data so app doesn't hang
        setUserData({
          uid: userId,
          email: email,
          displayName: email.split('@')[0],
          role: 'admin',
          status: 'active'
        })
      } else {
        console.log('✅ User profile loaded:', data)
        setUserData({
          uid: userId,
          email: email,
          displayName: data.full_name,
          role: data.role,
          status: data.status,
          createdAt: data.created_at
        })
      }
    } catch (error: any) {
      console.error('❌ Error loading user data:', error.message || error)

      // Handle "not found" error
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        console.warn('⚠️ User profile not found, using default')
        setUserData({
          uid: userId,
          email: email,
          displayName: email.split('@')[0],
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        })
      } else {
        // Fallback - always set some data so app doesn't hang
        console.warn('⚠️ Using fallback user data')
        setUserData({
          uid: userId,
          email: email,
          displayName: email.split('@')[0],
          role: 'admin',
          status: 'active'
        })
      }
    }
  }

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          await loadUserData(session.user.id, session.user.email || '')
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out')
        setUser(null)
        setUserData(null)
      } else if (session?.user) {
        setUser(session.user)
        await loadUserData(session.user.id, session.user.email || '')
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔐 Attempting login for:', email)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ Supabase login error:', error)
        throw error
      }
      
      console.log('✅ Login successful:', email)
      console.log('📋 User data:', data.user?.email, data.user?.id)
    } catch (err: any) {
      console.error('❌ Login error details:', {
        message: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack
      })
      
      // Handle network errors
      if (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
        err.message = '❌ Network error. Check your internet connection and Supabase configuration.'
        err.code = 'network-error'
      }
      
      throw err
    }
  }

  const signup = async (email: string, password: string, displayName: string, role: UserRole = 'admin') => {
    console.log('📝 Signup called for:', email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
          role: role
        }
      }
    })

    if (error) {
      console.error('❌ Signup failed:', error.message)
      throw error
    }

    if (data.user) {
      // Profile is auto-created by database trigger (handle_new_user)
      // Status is 'active' by default - instant access!
      console.log('✅ User signed up, profile will be created with active status')
      
      // Auto-login after signup (no email confirmation needed)
      if (data.session) {
        setUser(data.user)
        await loadUserData(data.user.id, email)
        console.log('✅ Auto-login successful - user redirected to app')
      }
    }
  }

  const logout = async () => {
    console.log('🚪 Logging out...')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log('✅ Supabase session cleared')
    } catch (error) {
      console.error('❌ Logout error:', error)
    } finally {
      // Always clear local state
      setUser(null)
      setUserData(null)
      // Clear ALL localStorage
      console.log('🧹 Clearing all localStorage...')
      localStorage.clear()
    }
  }

  const checkPermission = (permission: keyof Permissions): boolean => {
    if (!userData?.role) return false
    return hasPermission(userData.role, permission)
  }

  const checkRole = (allowedRoles: UserRole[]): boolean => {
    if (!userData?.role) return false
    return allowedRoles.includes(userData.role)
  }

  const checkSuperUser = (): boolean => {
    if (!userData?.role) return false
    return userData.role === 'admin' || userData.role === 'director'
  }

  const verifyUser = async (userId: string, status: UserStatus, verifiedBy?: string) => {
    try {
      const updateData: any = { status }
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
      
      if (error) throw error
      console.log(`✅ User ${userId} status updated to: ${status}`)
    } catch (error) {
      console.error('❌ Error updating user status:', error)
      throw error
    }
  }

  const getUserStatus = (): UserStatus | undefined => {
    return userData?.status
  }

  const getAllProfiles = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Error fetching all profiles:', error)
      return []
    }
  }

  const updateProfile = async (userId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
      
      if (error) throw error
      console.log(`✅ Profile ${userId} updated successfully`)
      
      // If updating own profile, reload data
      if (userId === user?.id) {
        await loadUserData(userId, user.email || '')
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      throw error
    }
  }

  const deleteProfile = async (userId: string) => {
    try {
      // Note: This only deletes the profile record. 
      // Deleting the Auth user usually requires admin privileges via Supabase Edge Functions or Service Role.
      // For now, we delete the profile and the user will effectively lose access/data visibility.
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      console.log(`✅ Profile ${userId} deleted`)
    } catch (error) {
      console.error('❌ Error deleting profile:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    userData,
    hasPermission: checkPermission,
    isRole: checkRole,
    isSuperUser: checkSuperUser,
    verifyUser,
    getUserStatus,
    getAllProfiles,
    updateProfile,
    deleteProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
