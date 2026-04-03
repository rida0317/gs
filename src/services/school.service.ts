// src/services/school.service.ts - Multi-school management service (Supabase Version)

import { supabase } from '../lib/supabaseClient'
import type { School, SchoolUser, UserSchools, SchoolSettings } from '../types/school'

const DEFAULT_SETTINGS: SchoolSettings = {
  language: 'fr',
  currency: 'DH',
  timezone: 'Africa/Casablanca',
  workingDays: [0, 1, 2, 3, 4, 5], // Sunday to Friday
  workingHours: { start: 8, end: 19 },
  levels: ['1AC', '2AC', '3AC', '1BAC', '2BAC'],
  subjects: ['Mathématiques', 'Français', 'Arabe', 'Physique', 'SVT', 'Histoire-Géo'],
  paymentMethods: ['especes', 'cheque', 'virement'],
  emailEnabled: false
}

/**
 * Create a new school
 */
export async function createSchool(schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .insert([{
      name: schoolData.name,
      logo_url: schoolData.logo || '',
      academic_year: schoolData.academicYear,
      settings: schoolData.settings || DEFAULT_SETTINGS,
      is_active: true
    }])
    .select()
    .single()

  if (error) throw error
  
  return {
    ...data,
    id: data.id,
    logo: data.logo_url,
    academicYear: data.academic_year,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  } as School
}

/**
 * Get school by ID
 */
export async function getSchool(schoolId: string): Promise<School | null> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return {
    ...data,
    id: data.id,
    logo: data.logo_url,
    academicYear: data.academic_year,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  } as School
}

/**
 * Get all schools for a user
 */
export async function getUserSchools(userId: string): Promise<School[]> {
  const { data, error } = await supabase
    .from('school_members')
    .select('school_id, schools(*)')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw error
  
  return data.map(item => {
    const s = item.schools as any
    return {
      ...s,
      id: s.id,
      logo: s.logo_url,
      academicYear: s.academic_year,
      isActive: s.is_active,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    } as School
  })
}

/**
 * Get user's school membership
 */
export async function getUserSchoolMembership(userId: string, schoolId: string): Promise<SchoolUser | null> {
  const { data, error } = await supabase
    .from('school_members')
    .select('*')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return {
    userId: data.user_id,
    schoolId: data.school_id,
    role: data.role as any,
    permissions: data.permissions || [],
    joinedAt: data.joined_at,
    isActive: data.is_active
  }
}

/**
 * Add user to school
 */
export async function addUserToSchool(
  userId: string, 
  schoolId: string, 
  role: SchoolUser['role'],
  permissions?: string[]
): Promise<void> {
  const { error } = await supabase
    .from('school_members')
    .upsert({
      user_id: userId,
      school_id: schoolId,
      role,
      permissions: permissions || [],
      is_active: true,
      joined_at: new Date().toISOString()
    })

  if (error) throw error
}

/**
 * Remove user from school
 */
export async function removeUserFromSchool(userId: string, schoolId: string): Promise<void> {
  const { error } = await supabase
    .from('school_members')
    .delete()
    .eq('user_id', userId)
    .eq('school_id', schoolId)

  if (error) throw error
}

/**
 * Update school
 */
export async function updateSchool(schoolId: string, data: Partial<School>): Promise<void> {
  const updatePayload: any = {}
  if (data.name) updatePayload.name = data.name
  if (data.logo) updatePayload.logo_url = data.logo
  if (data.academicYear) updatePayload.academic_year = data.academicYear
  if (data.settings) updatePayload.settings = data.settings
  if (data.isActive !== undefined) updatePayload.is_active = data.isActive
  updatePayload.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('schools')
    .update(updatePayload)
    .eq('id', schoolId)

  if (error) throw error
}

/**
 * Delete school (soft delete)
 */
export async function deleteSchool(schoolId: string): Promise<void> {
  await updateSchool(schoolId, { isActive: false })
}

/**
 * Get all schools (for super admin)
 */
export async function getAllSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
  
  if (error) throw error
  
  return data.map(s => ({
    ...s,
    id: s.id,
    logo: s.logo_url,
    academicYear: s.academic_year,
    isActive: s.is_active,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  } as School))
}

/**
 * Generate unique school code
 */
export function generateSchoolCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 4)

  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${base}-${random}`
}

/**
 * Get user's default school ID
 */
export async function getDefaultSchool(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_schools')
    .select('school_id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data?.school_id || null
}

/**
 * Set user's default school
 */
export async function setDefaultSchool(userId: string, schoolId: string): Promise<void> {
  // First, unset any existing default
  await supabase
    .from('user_schools')
    .update({ is_default: false })
    .eq('user_id', userId)

  // Then set the new default
  const { error } = await supabase
    .from('user_schools')
    .upsert({
      user_id: userId,
      school_id: schoolId,
      is_default: true,
      is_active: true,
      joined_at: new Date().toISOString()
    })

  if (error) throw error
}
