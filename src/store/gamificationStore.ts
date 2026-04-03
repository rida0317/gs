// src/store/gamificationStore.ts - Zustand store for gamification (Supabase Version)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabaseClient'
import { useSchoolPlatformStore } from './schoolPlatformStore'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  pointsRequired: number
  category: string
  rarity: string
  createdAt: string
}

export interface StudentPoints {
  studentId: string
  studentName: string
  classId: string
  totalPoints: number
  availablePoints: number
  spentPoints: number
  level: number
  rank: number
  lastUpdated: string
}

export interface PointTransaction {
  id: string
  studentId: string
  points: number
  reason: string
  category: 'academic' | 'behavior' | 'attendance' | 'penalty' | 'reward'
  awardedBy: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface StudentBadge {
  id: string
  studentId: string
  badgeId: string
  badgeName: string
  badgeIcon: string
  badgeColor: string
  earnedAt: string
}

export interface LeaderboardEntry {
  rank: number
  studentId: string
  studentName: string
  classId: string
  totalPoints: number
  level: number
  badgesCount: number
}

interface GamificationState {
  badges: Badge[]
  studentPoints: Map<string, StudentPoints>
  transactions: PointTransaction[]
  studentBadges: Map<string, StudentBadge[]>
  isEnabled: boolean
  isLoading: boolean
  error: string | null
}

interface GamificationActions {
  fetchData: () => Promise<void>
  awardPoints: (studentId: string, points: number, reason: string, category: PointTransaction['category'], awardedBy: string) => Promise<void>
  unlockBadge: (studentId: string, badgeId: string) => Promise<void>
  getLeaderboard: (classId?: string, limit?: number) => LeaderboardEntry[]
  refreshStats: () => void
}

export const useGamificationStore = create<GamificationState & GamificationActions>()(
  persist(
    (set, get) => ({
      badges: [],
      studentPoints: new Map(),
      transactions: [],
      studentBadges: new Map(),
      isEnabled: true,
      isLoading: false,
      error: null,

      fetchData: async () => {
        const schoolId = useSchoolPlatformStore.getState().currentSchoolId
        if (!schoolId) return

        set({ isLoading: true, error: null })
        try {
          // Fetch badge configs
          const { data: badgeConfigs, error: bError } = await supabase
            .from('gamification_badges_config')
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)

          if (bError) throw bError

          // Fetch transactions to calculate points
          const { data: transactions, error: tError } = await supabase
            .from('gamification_transactions')
            .select('*')
            .eq('school_id', schoolId)
            .eq('status', 'approved')

          if (tError) throw tError

          // Fetch student badges
          const { data: studentBadges, error: sbError } = await supabase
            .from('gamification_badges')
            .select('*, gamification_badges_config(*)')
            .eq('school_id', schoolId)

          if (sbError) throw sbError

          // Map and aggregate data
          const studentPointsMap = new Map<string, StudentPoints>()
          transactions?.forEach(t => {
            const current = studentPointsMap.get(t.student_id) || {
              studentId: t.student_id,
              studentName: '', // Would need join for names
              classId: '',
              totalPoints: 0,
              availablePoints: 0,
              spentPoints: 0,
              level: 1,
              rank: 0,
              lastUpdated: t.timestamp
            }
            current.totalPoints += t.points
            current.availablePoints += t.points
            current.level = Math.floor(current.totalPoints / 100) + 1
            studentPointsMap.set(t.student_id, current)
          })

          const mappedBadgesMap = new Map<string, StudentBadge[]>()
          studentBadges?.forEach(sb => {
            const config = sb.gamification_badges_config
            const list = mappedBadgesMap.get(sb.student_id) || []
            list.push({
              id: sb.id,
              studentId: sb.student_id,
              badgeId: sb.badge_config_id,
              badgeName: config.name,
              badgeIcon: config.icon,
              badgeColor: config.color,
              earnedAt: sb.earned_at
            })
            mappedBadgesMap.set(sb.student_id, list)
          })

          set({
            badges: badgeConfigs.map(b => ({
              id: b.id,
              name: b.name,
              description: b.description,
              icon: b.icon,
              color: b.color,
              pointsRequired: b.points_required,
              category: b.category,
              rarity: b.rarity,
              createdAt: b.created_at
            })),
            transactions: transactions.map(t => ({
              id: t.id,
              studentId: t.student_id,
              points: t.points,
              reason: t.reason,
              category: t.category as any,
              awardedBy: t.awarded_by,
              timestamp: t.timestamp,
              status: t.status as any
            })),
            studentPoints: studentPointsMap,
            studentBadges: mappedBadgesMap,
            isLoading: false
          })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
        }
      },

      awardPoints: async (studentId, points, reason, category, awardedBy) => {
        const schoolId = useSchoolPlatformStore.getState().currentSchoolId
        if (!schoolId) return

        try {
          const { data, error } = await supabase
            .from('gamification_transactions')
            .insert([{
              student_id: studentId,
              school_id: schoolId,
              points,
              reason,
              category,
              awarded_by: awardedBy,
              status: 'approved'
            }])
            .select()
            .single()

          if (error) throw error

          // Optimistic local update or just refetch
          await get().fetchData()
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      unlockBadge: async (studentId, badgeId) => {
        const schoolId = useSchoolPlatformStore.getState().currentSchoolId
        if (!schoolId) return

        try {
          const { error } = await supabase
            .from('gamification_badges')
            .insert([{
              student_id: studentId,
              school_id: schoolId,
              badge_config_id: badgeId
            }])

          if (error) throw error
          await get().fetchData()
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      getLeaderboard: (classId, limit = 10) => {
        const studentPoints = Array.from(get().studentPoints.values())
        let filtered = classId ? studentPoints.filter(s => s.classId === classId) : studentPoints
        const sorted = filtered.sort((a, b) => b.totalPoints - a.totalPoints)

        return sorted.slice(0, limit).map((student, index) => ({
          rank: index + 1,
          studentId: student.studentId,
          studentName: student.studentName,
          classId: student.classId,
          totalPoints: student.totalPoints,
          level: student.level,
          badgesCount: (get().studentBadges.get(student.studentId) || []).length
        }))
      },

      refreshStats: () => {
        // Implementation for stats summarization if needed
      }
    }),
    {
      name: 'gamification-store',
      partialize: (state) => ({
        isEnabled: state.isEnabled
      })
    }
  )
)

// =====================================================
// HELPER HOOKS & FUNCTIONS (for easier consumption)
// =====================================================

/**
 * Hook: Get leaderboard data
 */
export function useLeaderboard(classId?: string, limit: number = 10) {
  return useGamificationStore.getState().getLeaderboard(classId, limit)
}

/**
 * Hook: Get gamification statistics
 */
export function useGamificationStats() {
  const state = useGamificationStore.getState()
  const studentPoints = Array.from(state.studentPoints.values())
  
  return {
    totalStudents: state.studentPoints.size,
    totalPointsAwarded: studentPoints.reduce((sum, s) => sum + s.totalPoints, 0),
    totalBadgesEarned: Array.from(state.studentBadges.values()).reduce((sum, badges) => sum + badges.length, 0),
    totalTransactions: state.transactions.length,
    averagePointsPerStudent: studentPoints.length > 0 
      ? Math.round(studentPoints.reduce((sum, s) => sum + s.totalPoints, 0) / studentPoints.length)
      : 0,
    topStudent: studentPoints.length > 0 
      ? studentPoints.sort((a, b) => b.totalPoints - a.totalPoints)[0]
      : null
  }
}

/**
 * Hook: Get all badge configurations
 */
export function useGamificationBadges() {
  return useGamificationStore.getState().badges
}

/**
 * Hook: Get badges for a specific student
 */
export function useStudentBadges(studentId: string) {
  return useGamificationStore.getState().studentBadges.get(studentId) || []
}

/**
 * Function: Award points to a student
 */
export async function awardPoints(
  studentId: string,
  points: number,
  reason: string,
  category: PointTransaction['category'] = 'reward'
) {
  const awardedBy = localStorage.getItem('userId') || 'system'
  await useGamificationStore.getState().awardPoints(studentId, points, reason, category, awardedBy)
}

/**
 * Function: Deduct points from a student
 */
export async function deductPoints(
  studentId: string,
  points: number,
  reason: string,
  category: PointTransaction['category'] = 'penalty'
) {
  const awardedBy = localStorage.getItem('userId') || 'system'
  await useGamificationStore.getState().awardPoints(studentId, -points, reason, category, awardedBy)
}
