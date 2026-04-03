// src/store/schoolStore.ts - Zustand store for school data management with Supabase Sync

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabaseClient'
import { useSchoolPlatformStore } from './schoolPlatformStore'
import type {
  Teacher,
  SchoolClass,
  Salle,
  Timetable,
  Replacement,
  Absence,
  CustomSubject,
  CustomLevel,
  Student,
  InventoryData,
  SchoolData,
  TimetableSlot
} from '../types'
import { smartSave, smartLoad } from '../utils/storage'

const STORE_KEY = 'elite_school_data_v3'
const BACKUP_KEY = 'elite_school_backup_v3'
const DEFAULT_SCHOOL_ID = '00000000-0000-0000-0000-000000000001'

interface SchoolStore extends SchoolData {
  // Actions
  setSchoolInfo: (name: string, logo: string, academicYear?: string) => void
  setLanguage: (lang: 'en' | 'fr' | 'ar') => void
  setAcademicYear: (year: string) => void
  fetchAllData: () => Promise<void>

  // Teacher actions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>
  getTeacher: (id: string) => Teacher | undefined
  fetchTeachers: () => Promise<void>

  // Class actions
  addClass: (schoolClass: Omit<SchoolClass, 'id'>) => Promise<void>
  updateClass: (id: string, schoolClass: Partial<SchoolClass>) => Promise<void>
  deleteClass: (id: string) => Promise<void>
  getClass: (id: string) => SchoolClass | undefined
  fetchClasses: () => Promise<void>

  // Student actions
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>
  addBulkStudents: (students: Omit<Student, 'id'>[]) => Promise<{ success: number; errors: number }>
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  getStudent: (id: string) => Student | undefined
  fetchStudents: () => Promise<void>

  // Salle actions
  addSalle: (salle: Omit<Salle, 'id'>) => Promise<void>
  updateSalle: (id: string, salle: Partial<Salle>) => Promise<void>
  deleteSalle: (id: string) => Promise<void>
  fetchSalles: () => Promise<void>

  // Timetable actions
  saveTimetables: (timetables: Timetable) => Promise<void>
  getTimetable: (classId: string) => { [day: string]: (TimetableSlot | null)[] } | undefined
  clearAllTimetables: () => void

  // Replacement actions
  addReplacement: (replacement: Omit<Replacement, 'id'>) => Promise<void>
  deleteReplacement: (id: string) => Promise<void>
  clearAllReplacements: () => void

  // Absence actions
  addAbsence: (absence: Omit<Absence, 'id'>) => Promise<void>
  deleteAbsence: (id: string) => Promise<void>

  // Custom subjects/levels
  addCustomSubject: (subject: string) => Promise<void>
  deleteCustomSubject: (id: string) => Promise<void>
  addCustomLevel: (level: string) => Promise<void>

  // Backup/Restore
  exportBackup: () => string
  importBackup: (backupData: string) => boolean
  _autoBackup: () => void
  forceSave: () => void
}

// Default data
const getDefaultData = (): SchoolData => ({
  teachers: [],
  classes: [],
  salles: [],
  timetables: {},
  replacements: [],
  absences: [],
  customSubjects: [],
  customLevels: [],
  students: [],
  inventory: { items: [], transactions: [], suppliers: [], categories: [], assignments: [] },
  logo: 'https://cdn-icons-png.flaticon.com/512/2859/2859706.png',
  schoolName: 'Les Generations Montantes',
  academicYear: '2025-2026',
  language: 'en'
})

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Custom storage with smart save/load
const customStorage = {
  getItem: async (name: string) => {
    const data = await smartLoad(name)
    return data
  },
  setItem: async (name: string, value: any) => {
    const data = typeof value === 'string' ? JSON.parse(value) : value
    const dataOnly: any = {}
    const stateToProcess = data.state || data
    for (const key in stateToProcess) {
      if (typeof stateToProcess[key] !== 'function') {
        dataOnly[key] = stateToProcess[key]
      }
    }
    const storageValue = { state: dataOnly, version: 0 }
    await smartSave(name, storageValue)
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
    localStorage.removeItem(name + '_source')
  }
}

export const useSchoolStore = create<SchoolStore>()(
  persist(
    (set, get) => ({
      ...getDefaultData(),

      setSchoolInfo: (name, logo, academicYear) => {
        set((state) => ({ schoolName: name, logo, academicYear: academicYear || state.academicYear }))
        get().forceSave()
      },

      setAcademicYear: (year) => {
        set({ academicYear: year })
        get().forceSave()
      },

      setLanguage: (lang) => {
        set({ language: lang })
        document.documentElement.lang = lang
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
        localStorage.setItem('school_language', lang)
        get().forceSave()
      },

      fetchAllData: async () => {
        try {
          const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
          console.log('🔄 Syncing ALL data from Supabase for school:', currentSchoolId)
          
          const [
            { data: teachers },
            { data: classes },
            { data: students },
            { data: salles },
            { data: subjects },
            { data: levels }
          ] = await Promise.all([
            supabase.from('teachers').select('*').eq('school_id', currentSchoolId).eq('is_active', true),
            supabase.from('classes').select('*').eq('school_id', currentSchoolId).eq('is_active', true),
            supabase.from('students').select('*').eq('school_id', currentSchoolId).eq('is_active', true),
            supabase.from('salles').select('*').eq('school_id', currentSchoolId).eq('is_active', true),
            supabase.from('subjects').select('*').eq('school_id', currentSchoolId).eq('is_active', true),
            supabase.from('levels').select('*').eq('school_id', currentSchoolId).eq('is_active', true)
          ])

          set({
            teachers: (teachers || []).map((t: any) => ({
              id: t.id, name: t.full_name, maxHoursPerWeek: t.max_hours_per_week,
              subjects: t.subjects || [], levels: t.levels || [], isVacataire: t.is_vacataire, availability: t.availability || {}
            })),
            classes: (classes || []).map((c: any) => ({
              id: c.id, name: c.name, level: c.level, room_id: c.room_id, teacher_id: c.teacher_id,
              max_students: c.max_students, subjects: c.subjects || [], schedule: c.schedule || {}
            })),
            students: (students || []).map((s: any) => ({
              id: s.id, name: s.full_name, classId: s.class_id, codeMassar: s.code_massar, parentPhone: s.parent_phone, is_active: s.is_active
            })),
            salles: (salles || []).map((s: any) => ({
              id: s.id, name: s.name, capacity: s.capacity, type: s.type
            })),
            customSubjects: (subjects || []).map((s: any) => ({ id: s.id, name: s.name })),
            customLevels: (levels || []).map((l: any) => ({ id: l.id, name: l.name }))
          })
          console.log('✅ All data synced for school:', currentSchoolId)
        } catch (error) {
          console.error('❌ Sync failed:', error)
        }
      },

      // Teachers
      fetchTeachers: async () => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('teachers').select('*').eq('school_id', currentSchoolId).eq('is_active', true)
        if (data) set({ teachers: data.map((t: any) => ({
          id: t.id, name: t.full_name, maxHoursPerWeek: t.max_hours_per_week,
          subjects: t.subjects || [], levels: t.levels || [], isVacataire: t.is_vacataire, availability: t.availability || {}
        }))})
      },

      addTeacher: async (teacher) => {
        try {
          const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
          const { data, error } = await supabase.from('teachers').insert([{
            school_id: currentSchoolId, full_name: teacher.name, max_hours_per_week: teacher.maxHoursPerWeek,
            subjects: teacher.subjects, levels: teacher.levels, is_vacataire: teacher.isVacataire,
            availability: teacher.availability || {}, is_active: true
          }]).select().single()
          
          if (error) {
            console.error('❌ Supabase Add Teacher Error:', error)
            alert('Error adding teacher: ' + error.message)
            return
          }

          if (data) {
            set((state) => ({ teachers: [...state.teachers, { ...teacher, id: data.id }] }))
            console.log('✅ Teacher added to Supabase:', data.id)
          }
        } catch (err) {
          console.error('❌ Unexpected Error:', err)
        }
      },

      updateTeacher: async (id, teacher) => {
        try {
          const updates: any = {}
          if (teacher.name) updates.full_name = teacher.name
          if (teacher.maxHoursPerWeek !== undefined) updates.max_hours_per_week = teacher.maxHoursPerWeek
          if (teacher.subjects) updates.subjects = teacher.subjects
          if (teacher.levels) updates.levels = teacher.levels
          if (teacher.isVacataire !== undefined) updates.is_vacataire = teacher.isVacataire
          if (teacher.availability) updates.availability = teacher.availability
          
          const { error } = await supabase.from('teachers').update(updates).eq('id', id)
          
          if (error) {
            console.error('❌ Supabase Update Teacher Error:', error)
            return
          }

          set((state) => ({ teachers: state.teachers.map(t => t.id === id ? { ...t, ...teacher } : t) }))
          console.log('✅ Teacher updated in Supabase:', id)
        } catch (err) {
          console.error('❌ Unexpected Error:', err)
        }
      },

      deleteTeacher: async (id) => {
        await supabase.from('teachers').update({ is_active: false }).eq('id', id)
        set((state) => ({ teachers: state.teachers.filter(t => t.id !== id) }))
      },

      getTeacher: (id) => get().teachers.find(t => t.id === id),

      // Classes
      fetchClasses: async () => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('classes').select('*').eq('school_id', currentSchoolId).eq('is_active', true)
        if (data) set({ classes: data.map((c: any) => ({
          id: c.id, name: c.name, level: c.level, room_id: c.room_id, teacher_id: c.teacher_id,
          max_students: c.max_students, subjects: c.subjects || [], schedule: c.schedule || {}
        }))})
      },

      addClass: async (schoolClass) => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('classes').insert([{
          school_id: currentSchoolId, name: schoolClass.name, level: schoolClass.level,
          room_id: schoolClass.room_id, teacher_id: schoolClass.teacher_id,
          max_students: schoolClass.max_students, subjects: schoolClass.subjects,
          schedule: schoolClass.schedule || {}, is_active: true
        }]).select().single()
        if (data) set((state) => ({ classes: [...state.classes, { ...schoolClass, id: data.id }] }))
      },

      updateClass: async (id, schoolClass) => {
        const updates: any = {}
        if (schoolClass.name) updates.name = schoolClass.name
        if (schoolClass.level) updates.level = schoolClass.level
        if (schoolClass.room_id) updates.room_id = schoolClass.room_id
        if (schoolClass.teacher_id) updates.teacher_id = schoolClass.teacher_id
        if (schoolClass.max_students) updates.max_students = schoolClass.max_students
        if (schoolClass.subjects) updates.subjects = schoolClass.subjects
        if (schoolClass.schedule) updates.schedule = schoolClass.schedule
        await supabase.from('classes').update(updates).eq('id', id)
        set((state) => ({ classes: state.classes.map(c => c.id === id ? { ...c, ...schoolClass } : c) }))
      },

      deleteClass: async (id) => {
        await supabase.from('classes').update({ is_active: false }).eq('id', id)
        set((state) => ({ classes: state.classes.filter(c => c.id !== id) }))
      },

      getClass: (id) => get().classes.find(c => c.id === id),

      // Students
      fetchStudents: async () => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('students').select('*').eq('school_id', currentSchoolId).eq('is_active', true)
        if (data) set({ students: data.map((s: any) => ({
          id: s.id, name: s.full_name, classId: s.class_id, codeMassar: s.code_massar, parentPhone: s.parent_phone, is_active: s.is_active
        }))})
      },

      addStudent: async (student) => {
        try {
          const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
          const currentAcademicYear = get().academicYear
          
          const { data, error } = await supabase.from('students').insert([{
            school_id: currentSchoolId, 
            full_name: student.name, 
            class_id: student.classId || null,
            code_massar: (student as any).code_massar || student.codeMassar || null, 
            parent_phone: student.parentPhone || null, 
            academic_year: currentAcademicYear,
            is_active: true
          }]).select().single()
          
          if (error) {
            console.error('❌ Supabase Add Student Error:', error)
            alert('Error adding student: ' + error.message)
            throw error
          }
          
          if (data) {
            set((state) => ({ students: [...state.students, { ...student, id: data.id }] }))
            console.log('✅ Student added to Supabase:', data.id)
          }
        } catch (err) {
          console.error('❌ Unexpected Error adding student:', err)
          throw err
        }
      },

      addBulkStudents: async (studentsToImport) => {
        try {
          const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
          const currentAcademicYear = get().academicYear

          // 🔍 Debug: Log Supabase configuration
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
          console.log('🔍 Supabase Config:', {
            url: supabaseUrl ? '✅ Configured' : '❌ Missing',
            key: supabaseKey ? '✅ Configured' : '❌ Missing',
            schoolId: currentSchoolId,
            academicYear: currentAcademicYear
          })

          // Validate input
          if (!studentsToImport || studentsToImport.length === 0) {
            return { success: 0, errors: 0, message: 'No students to import' }
          }

          const studentsToInsert = studentsToImport.map(student => ({
            school_id: currentSchoolId,
            full_name: student.name,
            class_id: student.classId || null,
            code_massar: student.codeMassar || (student as any).code_massar || null,  // ✅ camelCase first, then snake_case fallback
            parent_phone: student.parentPhone || null,
            academic_year: currentAcademicYear,
            is_active: true
          }))

          console.log('📦 Inserting students:', studentsToInsert.length)

          const { data, error } = await supabase
            .from('students')
            .insert(studentsToInsert)
            .select()

          if (error) {
            console.error('❌ Bulk Import Error:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            })
            throw new Error(`Supabase insert failed: ${error.message}`)
          }

          if (data && data.length > 0) {
            const newStudents = data.map((s: any) => ({
              id: s.id,
              name: s.full_name,
              classId: s.class_id,
              codeMassar: s.code_massar,  // ✅ DB snake_case → TS camelCase
              parentPhone: s.parent_phone,
              is_active: s.is_active
            }))

            set((state) => ({
              students: [...state.students, ...newStudents]
            }))

            console.log('✅ Successfully imported', data.length, 'students to Supabase')
            return { success: data.length, errors: 0, message: `Imported ${data.length} students` }
          }

          console.warn('⚠️ No data returned from insert')
          return { success: 0, errors: 0, message: 'No data returned from insert' }
        } catch (error: any) {
          console.error('❌ Bulk Import Exception:', {
            message: error.message,
            stack: error.stack
          })
          return { 
            success: 0, 
            errors: studentsToImport.length,
            message: error.message || 'Failed to import students'
          }
        }
      },

      updateStudent: async (id, student) => {
        const updates: any = {}
        if (student.name) updates.full_name = student.name
        if (student.classId) updates.class_id = student.classId
        if (student.codeMassar) updates.code_massar = student.codeMassar  // ✅ camelCase → snake_case
        if (student.parentPhone) updates.parent_phone = student.parentPhone
        await supabase.from('students').update(updates).eq('id', id)
        set((state) => ({ students: state.students.map(s => s.id === id ? { ...s, ...student } : s) }))
      },

      deleteStudent: async (id) => {
        await supabase.from('students').update({ is_active: false }).eq('id', id)
        set((state) => ({ students: state.students.filter(s => s.id !== id) }))
      },

      getStudent: (id) => get().students.find(s => s.id === id),

      // Salles
      fetchSalles: async () => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('salles').select('*').eq('school_id', currentSchoolId).eq('is_active', true)
        if (data) set({ salles: data.map((s: any) => ({ id: s.id, name: s.name, capacity: s.capacity, type: s.type }))})
      },

      addSalle: async (salle) => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('salles').insert([{
          school_id: currentSchoolId, name: salle.name, capacity: salle.capacity, type: salle.type, is_active: true
        }]).select().single()
        if (data) set((state) => ({ salles: [...state.salles, { ...salle, id: data.id }] }))
      },

      updateSalle: async (id, salle) => {
        const updates: any = {}
        if (salle.name) updates.name = salle.name
        if (salle.capacity !== undefined) updates.capacity = salle.capacity
        if (salle.type) updates.type = salle.type
        await supabase.from('salles').update(updates).eq('id', id)
        set((state) => ({ salles: state.salles.map(s => s.id === id ? { ...s, ...salle } : s) }))
      },

      deleteSalle: async (id) => {
        await supabase.from('salles').update({ is_active: false }).eq('id', id)
        set((state) => ({ salles: state.salles.filter(s => s.id !== id) }))
      },

      // Timetables
      saveTimetables: async (timetables) => {
        // Timetable persistence in Supabase can be complex, for now keeping local sync
        set({ timetables })
        get().forceSave()
      },
      getTimetable: (classId) => get().timetables[classId],
      clearAllTimetables: () => { set({ timetables: {} }); get().forceSave() },

      // Replacements, Absences, etc. (Can be implemented similarly)
      addReplacement: async (replacement) => { set((state) => ({ replacements: [...state.replacements, { ...replacement, id: generateId() }] })); get().forceSave() },
      deleteReplacement: async (id) => { set((state) => ({ replacements: state.replacements.filter(r => r.id !== id) })); get().forceSave() },
      clearAllReplacements: () => { set({ replacements: [] }); get().forceSave() },
      addAbsence: async (absence) => { set((state) => ({ absences: [...state.absences, { ...absence, id: generateId() }] })); get().forceSave() },
      deleteAbsence: async (id) => { set((state) => ({ absences: state.absences.filter(a => a.id !== id) })); get().forceSave() },

      // Custom subjects/levels
      addCustomSubject: async (name) => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('subjects').insert([{ school_id: currentSchoolId, name, is_active: true }]).select().single()
        if (data) set((state) => ({ customSubjects: [...state.customSubjects, { id: data.id, name }] }))
      },
      deleteCustomSubject: async (id) => {
        await supabase.from('subjects').update({ is_active: false }).eq('id', id)
        set((state) => ({ customSubjects: state.customSubjects.filter(s => s.id !== id) }))
      },
      addCustomLevel: async (name) => {
        const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId || DEFAULT_SCHOOL_ID
        const { data } = await supabase.from('levels').insert([{ school_id: currentSchoolId, name, is_active: true }]).select().single()
        if (data) set((state) => ({ customLevels: [...state.customLevels, { id: data.id, name }] }))
      },

      forceSave: () => {
        const state = get()
        const dataOnly: any = {}
        Object.keys(state).forEach(key => { if (typeof (state as any)[key] !== 'function') dataOnly[key] = (state as any)[key] })
        customStorage.setItem(STORE_KEY, { state: dataOnly, version: 0 })
      },

      exportBackup: () => JSON.stringify(get()),
      importBackup: (backupData) => { try { set(JSON.parse(backupData)); return true } catch { return false } },
      _autoBackup: () => { try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ data: get(), timestamp: new Date().toISOString() })) } catch {} }
    }),
    {
      name: STORE_KEY,
      storage: customStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.fetchAllData()
          setInterval(() => state._autoBackup(), 5 * 60 * 1000)
        }
      }
    }
  )
)
