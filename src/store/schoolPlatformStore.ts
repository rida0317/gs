// src/store/schoolPlatformStore.ts - Multi-school platform state management

import { create } from 'zustand'
import { 
  getUserSchools, 
  getDefaultSchool, 
  setDefaultSchool,
  getSchool,
  addUserToSchool,
  removeUserFromSchool
} from '../services/school.service'
import type { School, SchoolUser } from '../types/school'

interface SchoolPlatformState {
  // Current school
  currentSchool: School | null
  currentSchoolId: string | null
  currentMembership: SchoolUser | null
  
  // User's schools
  userSchools: School[]
  defaultSchoolId: string | null
  
  // Loading states
  isLoading: boolean
  isSwitching: boolean
  error: string | null
  
  // Actions
  initializeSchools: (userId: string) => Promise<void>
  switchSchool: (schoolId: string) => Promise<void>
  refreshSchools: (userId: string) => Promise<void>
  clearSchools: () => void
  setCurrentSchool: (school: School | null) => void
}

export const useSchoolPlatformStore = create<SchoolPlatformState>((set, get) => ({
  // Initial state
  currentSchool: null,
  currentSchoolId: null,
  currentMembership: null,
  userSchools: [],
  defaultSchoolId: null,
  isLoading: false,
  isSwitching: false,
  error: null,
  
  // Initialize schools for user
  initializeSchools: async (userId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // Get user's schools
      const schools = await getUserSchools(userId)
      const defaultSchoolId = await getDefaultSchool(userId)
      
      // Get current school (default or first)
      const currentSchoolId = defaultSchoolId || (schools.length > 0 ? schools[0].id : null)
      let currentSchool: School | null = null
      let currentMembership: SchoolUser | null = null
      
      if (currentSchoolId) {
        currentSchool = await getSchool(currentSchoolId)
        currentMembership = {
          userId,
          schoolId: currentSchoolId,
          role: 'admin', // This should be fetched properly
          joinedAt: new Date().toISOString(),
          isActive: true
        }
      }
      
      set({
        userSchools: schools,
        currentSchool,
        currentSchoolId,
        currentMembership,
        defaultSchoolId,
        isLoading: false
      })
    } catch (error) {
      console.error('Error initializing schools:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load schools' 
      })
    }
  },
  
  // Switch to a different school
  switchSchool: async (schoolId: string) => {
    const { userSchools, currentSchoolId } = get()
    
    if (schoolId === currentSchoolId) return
    
    set({ isSwitching: true, error: null })
    
    try {
      // Get user ID from somewhere (should be passed or from auth)
      const userId = localStorage.getItem('userId') // This should come from auth context
      
      if (!userId) {
        throw new Error('User ID not found')
      }
      
      // Verify user has access to this school
      const school = userSchools.find(s => s.id === schoolId)
      
      if (!school) {
        throw new Error('Access denied to this school')
      }
      
      // Set as default
      await setDefaultSchool(userId, schoolId)
      
      // Get full school data
      const fullSchool = await getSchool(schoolId)
      
      if (!fullSchool) {
        throw new Error('School not found')
      }
      
      set({
        currentSchool: fullSchool,
        currentSchoolId: schoolId,
        isSwitching: false
      })
      
      // Store in localStorage for persistence
      localStorage.setItem('currentSchoolId', schoolId)
    } catch (error) {
      console.error('Error switching school:', error)
      set({ 
        isSwitching: false, 
        error: error instanceof Error ? error.message : 'Failed to switch school' 
      })
    }
  },
  
  // Refresh schools list
  refreshSchools: async (userId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const schools = await getUserSchools(userId)
      const defaultSchoolId = await getDefaultSchool(userId)
      
      let currentSchool = get().currentSchool
      if (defaultSchoolId && defaultSchoolId !== get().currentSchoolId) {
        currentSchool = await getSchool(defaultSchoolId)
      }
      
      set({
        userSchools: schools,
        defaultSchoolId,
        currentSchool: currentSchool || (schools.length > 0 ? schools[0] : null),
        currentSchoolId: defaultSchoolId || (schools.length > 0 ? schools[0].id : null),
        isLoading: false
      })
    } catch (error) {
      console.error('Error refreshing schools:', error)
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh schools' 
      })
    }
  },
  
  // Clear all school data
  clearSchools: () => {
    set({
      currentSchool: null,
      currentSchoolId: null,
      currentMembership: null,
      userSchools: [],
      defaultSchoolId: null,
      error: null
    })
    localStorage.removeItem('currentSchoolId')
  },
  
  // Set current school directly
  setCurrentSchool: (school: School | null) => {
    set({
      currentSchool: school,
      currentSchoolId: school?.id || null
    })
  }
}))

// Helper hook for getting current school data
export const useCurrentSchool = () => {
  const { currentSchool, currentSchoolId } = useSchoolPlatformStore()
  return { school: currentSchool, schoolId: currentSchoolId }
}

// Helper hook for getting user's schools
export const useUserSchools = () => {
  const { userSchools, isLoading } = useSchoolPlatformStore()
  return { schools: userSchools, isLoading }
}
