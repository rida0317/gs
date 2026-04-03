// src/store/notificationsStore.ts - Notifications store (Supabase Version)
// Enhanced version with auto-notifications for timetable changes, replacements, and messages

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabaseClient'
import type { Notification } from '../types'

export interface NotificationWithId extends Notification {
  id: string
}

interface NotificationsState {
  notifications: NotificationWithId[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  isDesktopEnabled: boolean
}

interface NotificationsActions {
  // Manual actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  
  // Auto-notification helpers
  addTimetableChangeNotification: (className: string, day: string, slotIndex: number, changeType: 'added' | 'removed' | 'modified', subject?: string) => void
  addReplacementNotification: (className: string, originalTeacher: string, substituteTeacher: string, date: string, subject?: string) => void
  addMessageNotification: (senderName: string, subject: string, preview: string) => void
  addAnnouncementNotification: (title: string, content: string, audience?: string) => void
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  subscribeToNotifications: (userId: string) => () => void
  refreshNotifications: () => void
  requestDesktopPermission: () => Promise<boolean>
  setDesktopEnabled: (enabled: boolean) => void
}

export type NotificationsStore = NotificationsState & NotificationsActions

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
  isDesktopEnabled: false
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== MANUAL ACTIONS ==========
      
      addNotification: async (notification) => {
        const newNotification: NotificationWithId = {
          ...notification,
          id: generateId(),
          timestamp: new Date().toISOString(),
          read: false
        }

        // Save to Firebase first
        try {
          await addDoc(collection(db, 'notifications'), {
            ...notification,
            timestamp: serverTimestamp(),
            read: false,
            deleted: false,
            userId: notification.userId
          })
        } catch (error) {
          console.error('Error saving notification to Firebase:', error)
        }

        // Update local state
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
          lastUpdated: new Date()
        }))

        // Show browser notification if enabled
        const { isDesktopEnabled } = get()
        if (isDesktopEnabled && 'Notification' in window && Notification.permission === 'granted') {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: newNotification.id,
            requireInteraction: notification.priority === 'urgent',
            silent: notification.priority !== 'urgent'
          })
        }

        // Dispatch custom event for toast
        const toastType = notification.type === 'timetable_change' || notification.type === 'replacement' ? 'info' :
                         notification.priority === 'urgent' ? 'warning' : 'success'

        window.dispatchEvent(new CustomEvent('toast-added', {
          detail: {
            id: newNotification.id,
            message: `${notification.title}: ${notification.message}`,
            type: toastType,
            duration: 5000
          }
        }))
      },

      markAsRead: async (notificationId) => {
        try {
          const notificationRef = doc(db, 'notifications', notificationId)
          await updateDoc(notificationRef, { read: true })

          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          console.error('Error marking notification as read:', error)
          // Fallback: update local state only
          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        }
      },

      markAllAsRead: async () => {
        try {
          const { notifications } = get()
          const unreadNotifications = notifications.filter(n => !n.read)

          const updatePromises = unreadNotifications.map(n =>
            updateDoc(doc(db, 'notifications', n.id), { read: true })
          )

          await Promise.all(updatePromises)

          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0
          }))
        } catch (error) {
          console.error('Error marking all notifications as read:', error)
          // Fallback: update local state only
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0
          }))
        }
      },

      deleteNotification: async (notificationId) => {
        try {
          await updateDoc(doc(db, 'notifications', notificationId), { deleted: true })

          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: state.notifications.find(n => n.id === notificationId)?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          console.error('Error deleting notification:', error)
          // Fallback: update local state only
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: state.notifications.find(n => n.id === notificationId)?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1)
          }))
        }
      },

      clearAllNotifications: async () => {
        try {
          const { notifications } = get()
          const updatePromises = notifications.map(n =>
            updateDoc(doc(db, 'notifications', n.id), { deleted: true })
          )

          await Promise.all(updatePromises)

          set({
            notifications: [],
            unreadCount: 0,
            lastUpdated: new Date()
          })
        } catch (error) {
          console.error('Error clearing notifications:', error)
          // Fallback: update local state only
          set({
            notifications: [],
            unreadCount: 0,
            lastUpdated: new Date()
          })
        }
      },

      // ========== AUTO-NOTIFICATION HELPERS ==========

      addTimetableChangeNotification: (className, day, slotIndex, changeType, subject) => {
        const changeTypeText = {
          added: 'added',
          removed: 'cancelled',
          modified: 'modified'
        }[changeType]

        const subjectText = subject ? ` - ${subject}` : ''
        
        get().addNotification({
          userId: 'all',
          type: 'timetable_change',
          title: `📅 Timetable Update - ${className}`,
          message: `${changeTypeText === 'cancelled' ? 'Class cancelled' : `Class ${changeTypeText}`} on ${day}, period ${slotIndex + 1}${subjectText}`,
          priority: changeType === 'removed' ? 'high' : 'normal',
          actionUrl: '/timetable'
        })
      },

      addReplacementNotification: (className, originalTeacher, substituteTeacher, date, subject) => {
        get().addNotification({
          userId: 'all',
          type: 'replacement',
          title: `👨‍🏫 Replacement - ${className}`,
          message: `${originalTeacher} will be replaced by ${substituteTeacher}${subject ? ` for ${subject}` : ''} on ${new Date(date).toLocaleDateString()}`,
          priority: 'high',
          actionUrl: '/replacements'
        })
      },

      addMessageNotification: (senderName, subject, preview) => {
        get().addNotification({
          userId: 'all',
          type: 'message',
          title: `💬 New Message from ${senderName}`,
          message: `${subject}: ${preview}`,
          priority: 'normal',
          actionUrl: '/messages'
        })
      },

      addAnnouncementNotification: (title, content, audience) => {
        get().addNotification({
          userId: 'all',
          type: 'announcement',
          title: `📢 ${title}`,
          message: content,
          priority: audience === 'all' ? 'high' : 'normal',
          actionUrl: '/announcements'
        })
      },

      // ========== STATE MANAGEMENT ==========

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      subscribeToNotifications: (userId) => {
        if (!userId) return () => {}

        const q = query(
          collection(db, 'notifications'),
          where('userId', 'in', [userId, 'all']),
          where('deleted', '!=', true),
          orderBy('timestamp', 'desc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const notifications: NotificationWithId[] = []
          let unreadCount = 0

          snapshot.forEach((docSnap) => {
            const data = docSnap.data()
            notifications.push({
              id: docSnap.id,
              userId: data.userId,
              type: data.type,
              title: data.title,
              message: data.message,
              timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
              read: data.read || false,
              priority: data.priority || 'normal',
              actionUrl: data.actionUrl
            } as NotificationWithId)

            if (!data.read) {
              unreadCount++
            }
          })

          set({
            notifications,
            unreadCount,
            isLoading: false,
            lastUpdated: new Date()
          })
        }, (error) => {
          console.error('Error subscribing to notifications:', error)
          set({ error: 'Failed to load notifications', isLoading: false })
        })

        return unsubscribe
      },

      refreshNotifications: () => {
        set({ lastUpdated: new Date() })
      },

      requestDesktopPermission: async () => {
        if (!('Notification' in window)) {
          set({ isDesktopEnabled: false })
          return false
        }

        const permission = await Notification.requestPermission()
        const isGranted = permission === 'granted'
        
        set({ isDesktopEnabled: isGranted })
        
        if (isGranted) {
          new window.Notification('Notifications enabled', {
            body: 'You will now receive real-time notifications',
            icon: '/favicon.ico'
          })
        }
        
        return isGranted
      },

      setDesktopEnabled: (enabled) => {
        set({ isDesktopEnabled: enabled })
      }
    }),
    {
      name: 'notifications-store',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Keep last 50 notifications
        unreadCount: state.unreadCount,
        isDesktopEnabled: state.isDesktopEnabled
      })
    }
  )
)

// ========== HELPER FUNCTIONS ==========

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper function to save notification to Firebase
export const saveNotificationToFirebase = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      timestamp: serverTimestamp(),
      read: false,
      deleted: false
    })
  } catch (error) {
    console.error('Error saving notification to Firebase:', error)
  }
}

// ========== NOTIFICATION HOOKS ==========

export const useNotifications = () => useNotificationsStore((state) => state.notifications)
export const useUnreadCount = () => useNotificationsStore((state) => state.unreadCount)
export const useNotificationsLoading = () => useNotificationsStore((state) => state.isLoading)
export const useIsDesktopEnabled = () => useNotificationsStore((state) => state.isDesktopEnabled)

// ========== UTILITY FUNCTIONS FOR AUTO-NOTIFICATIONS ==========

/**
 * Send notification for timetable change
 * @param className - Name of the class
 * @param day - Day of the week
 * @param slotIndex - Time slot index (0-6)
 * @param changeType - Type of change (added, removed, modified)
 * @param subject - Optional subject name
 */
export const notifyTimetableChange = (
  className: string,
  day: string,
  slotIndex: number,
  changeType: 'added' | 'removed' | 'modified',
  subject?: string
) => {
  const { addTimetableChangeNotification } = useNotificationsStore.getState()
  addTimetableChangeNotification(className, day, slotIndex, changeType, subject)
}

/**
 * Send notification for teacher replacement
 * @param className - Name of the class
 * @param originalTeacher - Name of original teacher
 * @param substituteTeacher - Name of substitute teacher
 * @param date - Date of replacement
 * @param subject - Optional subject name
 */
export const notifyReplacement = (
  className: string,
  originalTeacher: string,
  substituteTeacher: string,
  date: string,
  subject?: string
) => {
  const { addReplacementNotification } = useNotificationsStore.getState()
  addReplacementNotification(className, originalTeacher, substituteTeacher, date, subject)
}

/**
 * Send notification for new message
 * @param senderName - Name of sender
 * @param subject - Message subject
 * @param preview - Message preview
 */
export const notifyNewMessage = (
  senderName: string,
  subject: string,
  preview: string
) => {
  const { addMessageNotification } = useNotificationsStore.getState()
  addMessageNotification(senderName, subject, preview)
}

/**
 * Send announcement notification
 * @param title - Announcement title
 * @param content - Announcement content
 * @param audience - Target audience
 */
export const notifyAnnouncement = (
  title: string,
  content: string,
  audience?: string
) => {
  const { addAnnouncementNotification } = useNotificationsStore.getState()
  addAnnouncementNotification(title, content, audience)
}
