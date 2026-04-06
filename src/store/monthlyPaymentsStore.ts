// src/store/monthlyPaymentsStore.ts - Store for monthly student payments (Supabase Version)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabaseClient'
import { useSchoolPlatformStore } from './schoolPlatformStore'

export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'exempt'
export type PaymentMethod = 'especes' | 'cheque' | 'virement'

export interface MonthlyPayment {
  id: string
  studentId: string
  academicYear: string
  month: number // 1-11 (Septembre=1, Juillet=11)
  baseAmount: number // Base mensuality by level
  transportAmount: number // 0 or 200
  discount: number // Personalized discount
  paidAmount: number
  status: PaymentStatus
  paymentDate?: string
  paymentMethod?: PaymentMethod
  receiptNumber?: string
  notes?: string
  paidBy?: string
  paidByName?: string
  createdAt: string
  updatedAt: string
}

export interface StudentPaymentConfig {
  studentId: string
  studentName: string
  classId: string
  level: 'maternelle' | 'primaire' | 'college'
  transportEnabled: boolean
  personalizedDiscount: number // Fixed amount discount
  discountReason?: string
  academicYear: string
}

export interface StudentPendingPayment {
  studentId: string
  studentName: string
  classId: string
  className: string
  pendingMonths: number[] // Month numbers (1-11)
  pendingMonthNames: string[] // Month names
  totalPending: number
}

// Helper to get class name from student
export const getStudentClassName = (student: any, classes: any[]) => {
  // First try student.class (if exists)
  if (student.class) {
    return student.class
  }
  // Then try student.className (if exists)
  if (student.className) {
    return student.className
  }
  // Then try to find class by classId
  const classObj = classes.find(c => c.id === student.classId)
  if (classObj) {
    return classObj.name || classObj.level
  }
  // Fallback to classId
  return student.classId
}

export interface PaymentReceipt {
  receiptNumber: string
  studentName: string
  className: string
  month: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  academicYear: string
}

const MONTHS = [
  'Septembre', 'Octobre', 'Novembre', 'Décembre',
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet'
]

const LEVEL_PRICES: Record<string, number> = {
  maternelle: 800,
  primaire: 1000,
  college: 1200
}

const TRANSPORT_PRICE = 200
const ANNUAL_DISCOUNT = 0.10 // 10%

interface MonthlyPaymentsState {
  // Data
  payments: MonthlyPayment[]
  studentConfigs: StudentPaymentConfig[]
  lastReceiptNumber: string

  // UI State
  selectedClassId: string
  selectedStudentId: string | null
  academicYear: string
  isLoading: boolean
  error: string | null
  
  // Firebase Sync
  isSynced: boolean
  lastSyncTime: string | null
}

interface MonthlyPaymentsActions {
  // Payment operations
  markAsPaid: (
    studentId: string,
    month: number,
    amount: number,
    paymentMethod: PaymentMethod,
    paidBy: string,
    paidByName: string,
    notes?: string
  ) => Promise<MonthlyPayment>
  
  markAsAnnual: (
    studentId: string,
    paymentMethod: PaymentMethod,
    paidBy: string,
    paidByName: string,
    notes?: string
  ) => Promise<MonthlyPayment[]>
  
  undoPayment: (paymentId: string) => Promise<boolean>
  
  // Student config
  setStudentTransport: (studentId: string, enabled: boolean) => void
  setStudentDiscount: (studentId: string, discount: number, reason?: string) => void
  getStudentConfig: (studentId: string, classId: string, level: string) => StudentPaymentConfig
  
  // Get payments
  getStudentPayments: (studentId: string, academicYear: string) => MonthlyPayment[]
  getClassPayments: (classId: string, academicYear: string) => MonthlyPayment[]
  getPendingPayments: (academicYear: string) => MonthlyPayment[]
  getStudentsWithPendingPayments: (students: any[], academicYear: string, classes: any[]) => StudentPendingPayment[]
  
  // Stats
  getStudentStats: (studentId: string, academicYear: string) => {
    total: number
    paid: number
    remaining: number
    monthsPaid: number
    annualDiscount: number
  }
  
  // Generate receipt number
  generateReceiptNumber: () => string

  // Firebase Sync
  syncWithFirebase: () => Promise<void>
  loadFromFirebase: () => Promise<void>
  setSynced: (synced: boolean) => void
  setLastSyncTime: (time: string | null) => void

  // Import
  importData: (data: Partial<MonthlyPaymentsState>) => void

  // State
  setSelectedClassId: (classId: string) => void
  setSelectedStudentId: (studentId: string | null) => void
  setAcademicYear: (year: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export type MonthlyPaymentsStore = MonthlyPaymentsState & MonthlyPaymentsActions

const initialState: MonthlyPaymentsState = {
  payments: [],
  studentConfigs: [],
  lastReceiptNumber: 'REC-2025-00000',
  selectedClassId: '',
  selectedStudentId: null,
  academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  isLoading: false,
  error: null,
  isSynced: false,
  lastSyncTime: null
}

export const useMonthlyPaymentsStore = create<MonthlyPaymentsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== PAYMENT OPERATIONS ==========

      markAsPaid: async (studentId, month, amount, paymentMethod, paidBy, paidByName, notes) => {
        set({ isLoading: true, error: null })

        const receiptNumber = get().generateReceiptNumber()
        const academicYear = get().academicYear

        // Check if payment already exists
        const existingIndex = get().payments.findIndex(
          p => p.studentId === studentId && p.month === month && p.academicYear === academicYear
        )

        const paymentId = existingIndex >= 0
          ? get().payments[existingIndex].id
          : `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const payment: MonthlyPayment = {
          id: paymentId,
          studentId,
          academicYear,
          month,
          baseAmount: amount,
          transportAmount: 0,
          discount: 0,
          paidAmount: amount,
          status: 'paid',
          paymentDate: new Date().toISOString(),
          paymentMethod,
          receiptNumber,
          notes,
          paidBy,
          paidByName,
          createdAt: existingIndex >= 0 ? get().payments[existingIndex].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // Save to Supabase
        try {
          const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId
          if (!currentSchoolId) throw new Error('No school selected')

          const { error } = await supabase
            .from('monthly_payments')
            .upsert([{
              id: payment.id,
              student_id: studentId,
              school_id: currentSchoolId,
              academic_year: academicYear,
              month: month,
              base_amount: amount,
              transport_amount: 0,
              discount: 0,
              paid_amount: amount,
              status: 'paid',
              payment_date: new Date().toISOString(),
              payment_method: paymentMethod,
              receipt_number: receiptNumber,
              notes,
              paid_by: paidBy,
              paid_by_name: paidByName,
              created_at: existingIndex >= 0 ? payment.createdAt : new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])

          if (error) {
            console.error('Supabase error:', error)
            throw error
          }
        } catch (error) {
          console.error('Error saving monthly payment to Supabase:', error)
          throw error
        }

        set((state) => {
          const payments = existingIndex >= 0
            ? state.payments.map((p, i) => i === existingIndex ? payment : p)
            : [payment, ...state.payments]

          return {
            payments,
            lastReceiptNumber: receiptNumber,
            isLoading: false,
            isSynced: false
          }
        })

        return payment
      },

      markAsAnnual: async (studentId, paymentMethod, paidBy, paidByName, notes) => {
        set({ isLoading: true, error: null })
        const academicYear = get().academicYear
        const studentConfig = get().getStudentConfig(studentId, '', '')

        const baseAmount = LEVEL_PRICES[studentConfig.level] || 1000
        const transportAmount = studentConfig.transportEnabled ? TRANSPORT_PRICE : 0
        const monthlyTotal = baseAmount + transportAmount - studentConfig.personalizedDiscount
        const annualTotal = monthlyTotal * MONTHS.length * (1 - ANNUAL_DISCOUNT)

        const payments: MonthlyPayment[] = []
        const currentYear = new Date().getFullYear()
        let tempReceiptNum = parseInt(get().lastReceiptNumber.split('-')[2]) || 0

        for (let month = 1; month <= MONTHS.length; month++) {
          tempReceiptNum++
          const receiptNumber = `REC-${currentYear}-${String(tempReceiptNum).padStart(5, '0')}`
          const paymentId = `payment-annual-${studentId}-${month}-${academicYear}`

          payments.push({
            id: paymentId,
            studentId,
            academicYear,
            month,
            baseAmount,
            transportAmount,
            discount: studentConfig.personalizedDiscount,
            paidAmount: annualTotal / MONTHS.length,
            status: 'paid',
            paymentDate: new Date().toISOString(),
            paymentMethod,
            receiptNumber,
            notes: notes || 'Paiement annuel -10%',
            paidBy,
            paidByName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }

        // Save all payments to Firebase
        try {
          const batch = payments.map(payment => {
            const paymentRef = doc(db, 'monthly_payments', payment.id)
            return setDoc(paymentRef, {
              ...payment,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true })
          })
          await Promise.all(batch)
        } catch (error) {
          console.error('Error saving annual payments to Firebase:', error)
        }

        set((state) => ({
          payments: [...payments, ...state.payments].filter((v, i, a) => a.findIndex(p => p.id === v.id) === i),
          lastReceiptNumber: payments[payments.length - 1].receiptNumber,
          isLoading: false,
          isSynced: false
        }))

        return payments
      },

      undoPayment: async (paymentId) => {
        set({ isLoading: true, error: null })
        
        set((state) => ({
          payments: state.payments.filter(p => p.id !== paymentId),
          isLoading: false
        }))
        
        return true
      },

      // ========== STUDENT CONFIG ==========

      setStudentTransport: (studentId, enabled) => {
        set((state) => {
          const existing = state.studentConfigs.find(c => c.studentId === studentId)
          
          if (existing) {
            return {
              studentConfigs: state.studentConfigs.map(c =>
                c.studentId === studentId ? { ...c, transportEnabled: enabled } : c
              )
            }
          } else {
            return {
              studentConfigs: [...state.studentConfigs, {
                studentId,
                studentName: '',
                classId: '',
                level: 'primaire',
                transportEnabled: enabled,
                personalizedDiscount: 0,
                academicYear: state.academicYear
              }]
            }
          }
        })
      },

      setStudentDiscount: (studentId, discount, reason) => {
        set((state) => {
          const existing = state.studentConfigs.find(c => c.studentId === studentId)
          
          if (existing) {
            return {
              studentConfigs: state.studentConfigs.map(c =>
                c.studentId === studentId ? { ...c, personalizedDiscount: discount, discountReason: reason } : c
              )
            }
          } else {
            return {
              studentConfigs: [...state.studentConfigs, {
                studentId,
                studentName: '',
                classId: '',
                level: 'primaire',
                transportEnabled: false,
                personalizedDiscount: discount,
                discountReason: reason,
                academicYear: state.academicYear
              }]
            }
          }
        })
      },

      getStudentConfig: (studentId, classId, level) => {
        const existing = get().studentConfigs.find(c => c.studentId === studentId)
        
        if (existing) {
          return existing
        }
        
        return {
          studentId,
          studentName: '',
          classId,
          level: level as any || 'primaire',
          transportEnabled: false,
          personalizedDiscount: 0,
          academicYear: get().academicYear
        }
      },

      // ========== GET PAYMENTS ==========

      getStudentPayments: (studentId, academicYear) => {
        return get().payments.filter(
          p => p.studentId === studentId && p.academicYear === academicYear
        ).sort((a, b) => a.month - b.month)
      },

      getClassPayments: (classId, academicYear) => {
        // Need to get student IDs from class first
        return get().payments.filter(p => p.academicYear === academicYear)
      },

      getPendingPayments: (academicYear) => {
        return get().payments.filter(
          p => p.status === 'pending' && p.academicYear === academicYear
        )
      },

      getStudentsWithPendingPayments: (students, academicYear, classes) => {
        const result: StudentPendingPayment[] = []
        
        students.forEach(student => {
          // Get all payments for this student
          const studentPayments = get().payments.filter(
            p => p.studentId === student.id && p.academicYear === academicYear
          )
          
          // Find pending months
          const pendingMonths: number[] = []
          const pendingMonthNames: string[] = []
          let totalPending = 0
          
          MONTHS.forEach((month, index) => {
            const monthNum = index + 1
            const payment = studentPayments.find(p => p.month === monthNum)
            
            if (!payment || payment.status !== 'paid') {
              pendingMonths.push(monthNum)
              pendingMonthNames.push(month)
              
              // Calculate pending amount
              const config = get().studentConfigs.find(c => c.studentId === student.id)
              const baseAmount = LEVEL_PRICES[config?.level || 'primaire'] || 1000
              const transportAmount = config?.transportEnabled ? TRANSPORT_PRICE : 0
              const discount = config?.personalizedDiscount || 0
              totalPending += (baseAmount + transportAmount - discount)
            }
          })
          
          // Only add if has pending payments
          if (pendingMonths.length > 0) {
            // Get class name using helper function
            const className = getStudentClassName(student, classes)

            result.push({
              studentId: student.id,
              studentName: student.name,
              classId: student.classId,
              className,
              pendingMonths,
              pendingMonthNames,
              totalPending
            })
          }
        })
        
        return result
      },

      // ========== STATS ==========

      getStudentStats: (studentId, academicYear) => {
        const payments = get().getStudentPayments(studentId, academicYear)
        const config = get().studentConfigs.find(c => c.studentId === studentId)
        
        const baseAmount = LEVEL_PRICES[config?.level || 'primaire'] || 1000
        const transportAmount = config?.transportEnabled ? TRANSPORT_PRICE : 0
        const discount = config?.personalizedDiscount || 0
        const monthlyTotal = baseAmount + transportAmount - discount
        
        const total = monthlyTotal * MONTHS.length
        const paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.paidAmount, 0)
        const monthsPaid = payments.filter(p => p.status === 'paid').length
        const annualDiscount = monthsPaid === MONTHS.length ? total * ANNUAL_DISCOUNT : 0
        
        return {
          total: total - annualDiscount,
          paid,
          remaining: total - annualDiscount - paid,
          monthsPaid,
          annualDiscount
        }
      },

      // ========== RECEIPT NUMBER ==========

      generateReceiptNumber: () => {
        const year = new Date().getFullYear()
        const lastNum = parseInt(get().lastReceiptNumber.split('-')[2]) || 0
        const newNum = lastNum + 1
        return `REC-${year}-${String(newNum).padStart(5, '0')}`
      },

      // ========== STATE ==========

      setSelectedClassId: (classId) => {
        set({ selectedClassId: classId })
      },

      setSelectedStudentId: (studentId) => {
        set({ selectedStudentId: studentId })
      },

      setAcademicYear: (year) => {
        set({ academicYear: year })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      // ========== SUPABASE SYNC ==========

      loadFromFirebase: async () => {
        try {
          const academicYear = get().academicYear
          const currentSchoolId = useSchoolPlatformStore.getState().currentSchoolId
          if (!currentSchoolId) return

          const { data, error } = await supabase
            .from('monthly_payments')
            .select('*')
            .eq('school_id', currentSchoolId)
            .eq('academic_year', academicYear)
            .order('created_at', { ascending: false })

          if (error) throw error

          const payments: MonthlyPayment[] = (data || []).map(p => ({
            id: p.id,
            studentId: p.student_id,
            academicYear: p.academic_year,
            month: p.month,
            baseAmount: p.base_amount,
            transportAmount: p.transport_amount,
            discount: p.discount,
            paidAmount: p.paid_amount,
            status: p.status,
            paymentDate: p.payment_date,
            paymentMethod: p.payment_method,
            receiptNumber: p.receipt_number,
            notes: p.notes,
            paidBy: p.paid_by,
            paidByName: p.paid_by_name,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }))

          set({
            payments: [...payments, ...get().payments].filter(
              (v, i, a) => a.findIndex(p => p.id === v.id) === i
            ),
            isSynced: true,
            lastSyncTime: new Date().toISOString()
          })
        } catch (error) {
          console.error('Error loading monthly payments from Supabase:', error)
          set({ error: 'Erreur de chargement depuis Supabase' })
        }
      },

      syncWithFirebase: async () => {
        await get().loadFromFirebase()
      },

      setSynced: (synced) => {
        set({ isSynced: synced })
      },

      setLastSyncTime: (time) => {
        set({ lastSyncTime: time })
      },

      importData: (data) => {
        set((state) => ({
          ...state,
          ...data,
          isLoading: false
        }))
      }
    }),
    {
      name: 'monthly-payments-store',
      partialize: (state) => ({
        payments: state.payments.slice(0, 500),
        studentConfigs: state.studentConfigs,
        lastReceiptNumber: state.lastReceiptNumber,
        academicYear: state.academicYear
      })
    }
  )
)

// ========== SELECTOR HOOKS ==========

export const useMonthlyPayments = () => useMonthlyPaymentsStore((state) => state.payments)
export const useStudentConfigs = () => useMonthlyPaymentsStore((state) => state.studentConfigs)
export const useMonthlyPaymentStats = (studentId: string) => useMonthlyPaymentsStore((state) => 
  state.getStudentStats(studentId, state.academicYear)
)
export const useMonthlyPaymentsLoading = () => useMonthlyPaymentsStore((state) => state.isLoading)
export const useMonthlyPaymentsError = () => useMonthlyPaymentsStore((state) => state.error)

// ========== CONSTANTS ==========

export { MONTHS, LEVEL_PRICES, TRANSPORT_PRICE, ANNUAL_DISCOUNT }
