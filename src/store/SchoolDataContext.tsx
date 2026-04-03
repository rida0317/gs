// src/store/SchoolDataContext.tsx - School Data Context Provider (Supabase Version)

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useSchoolStore } from './schoolStore'
import { supabase } from '../lib/supabaseClient'

interface SchoolDataContextType {
  syncWithCloud: boolean
  enableCloudSync: () => void
  disableCloudSync: () => void
}

const SchoolDataContext = createContext<SchoolDataContextType | undefined>(undefined)

export function SchoolDataProvider({ children }: { children: ReactNode }) {
  const { user, userData } = useAuth()
  const { setSchoolInfo, setLanguage } = useSchoolStore()

  useEffect(() => {
    if (!user || !userData) return

    let isMounted = true

    // Fetch school data from Supabase
    const fetchSchoolData = async () => {
      try {
        console.log('🔄 Fetching school data for user:', user.id)

        // Use organizationId from userData or fetch from profiles
        const schoolId = userData?.organizationId || (user as any).school_id || '00000000-0000-0000-0000-000000000001'

        // Get school details
        const { data: school, error: schoolError } = await supabase
          .from('schools')
          .select('name, logo_url, settings, academic_year')
          .eq('id', schoolId)
          .single()

        if (schoolError) {
          console.warn('⚠️ School not found, using defaults:', schoolError.message)
          // Set default school info
          if (isMounted) {
            setSchoolInfo('Les Generations Montantes', '')
          }
          return
        }

        // Update Zustand store
        if (school && isMounted) {
          setSchoolInfo(school.name, school.logo_url || '')

          // Parse settings if exists
          if (school.settings) {
            const settings = school.settings
            if (settings.language) {
              setLanguage(settings.language)
            }
          }
          console.log('✅ School data loaded:', school.name)
        }
      } catch (error) {
        console.error('❌ Error in SchoolDataContext:', error)
        // Set default on error
        if (isMounted) {
          setSchoolInfo('Les Generations Montantes', '')
        }
      }
    }

    fetchSchoolData()

    return () => {
      isMounted = false
    }
  }, [user, userData])

  const value = {
    syncWithCloud: !!user,
    enableCloudSync: () => console.log('Enable cloud sync'),
    disableCloudSync: () => console.log('Disable cloud sync')
  }

  return (
    <SchoolDataContext.Provider value={value}>
      {children}
    </SchoolDataContext.Provider>
  )
}

export function useSchoolData() {
  const context = useContext(SchoolDataContext)
  if (context === undefined) {
    throw new Error('useSchoolData must be used within a SchoolDataProvider')
  }
  return context
}
