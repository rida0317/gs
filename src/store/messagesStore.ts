// src/store/messagesStore.ts - Zustand store for internal messaging system
// Supabase Version

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabaseClient'
import type { Message, MessageAttachment, User } from '../types'
import { useAuth } from './AuthContext'

export interface MessageWithId extends Message {
  id: string
}

export interface MessageFilter {
  type?: 'all' | 'received' | 'sent' | 'unread'
  priority?: 'all' | 'normal' | 'urgent' | 'high'
  search?: string
}

interface MessagesState {
  messages: MessageWithId[]
  conversations: Map<string, MessageWithId[]> // Messages grouped by conversation
  selectedConversation: string | null
  unreadCount: number
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface MessagesActions {
  // Message actions
  sendMessage: (recipientId: string, subject: string, content: string, priority?: 'normal' | 'urgent' | 'high') => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  replyToMessage: (messageId: string, content: string) => Promise<void>
  
  // Filter actions
  setFilter: (filter: MessageFilter) => void
  setSearch: (search: string) => void
  
  // Conversation actions
  selectConversation: (userId: string) => void
  getConversationMessages: (userId: string) => MessageWithId[]
  
  // State actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  subscribeToMessages: (userId: string) => () => void
  refreshMessages: () => void
}

export type MessagesStore = MessagesState & MessagesActions

const initialState: MessagesState = {
  messages: [],
  conversations: new Map(),
  selectedConversation: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastUpdated: null
}

export const useMessagesStore = create<MessagesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== MESSAGE ACTIONS ==========

      sendMessage: async (recipientId, subject, content, priority = 'normal') => {
        const state = get()
        // Get current user from AuthContext (we'll need to pass this differently)
        const currentUser = JSON.parse(localStorage.getItem('auth-user') || '{}')
        
        if (!currentUser?.uid) {
          set({ error: 'User not authenticated' })
          return
        }

        const newMessage: MessageWithId = {
          id: generateId(),
          senderId: currentUser.uid,
          recipientId,
          recipientType: 'user',
          subject,
          content,
          timestamp: new Date().toISOString(),
          read: false,
          priority
        }

        // Save to Firebase
        try {
          await addDoc(collection(db, 'messages'), {
            senderId: currentUser.uid,
            recipientId,
            recipientType: 'user',
            subject,
            content,
            timestamp: serverTimestamp(),
            read: false,
            priority,
            deleted: false
          })
        } catch (error) {
          console.error('Error sending message:', error)
        }

        // Update local state
        set((state) => ({
          messages: [newMessage, ...state.messages],
          lastUpdated: new Date()
        }))

        // Add to conversations
        const conversations = new Map(state.conversations)
        const conversationMessages = conversations.get(recipientId) || []
        conversations.set(recipientId, [newMessage, ...conversationMessages])
        set({ conversations })
      },

      markAsRead: async (messageId) => {
        try {
          const messageRef = doc(db, 'messages', messageId)
          await updateDoc(messageRef, { read: true })

          set((state) => ({
            messages: state.messages.map(m =>
              m.id === messageId ? { ...m, read: true } : m
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          console.error('Error marking message as read:', error)
          // Fallback to local update
          set((state) => ({
            messages: state.messages.map(m =>
              m.id === messageId ? { ...m, read: true } : m
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        }
      },

      markAllAsRead: async () => {
        try {
          const { messages } = get()
          const currentUser = JSON.parse(localStorage.getItem('auth-user') || '{}')
          const unreadMessages = messages.filter(m => !m.read && m.recipientId === currentUser.uid)

          const updatePromises = unreadMessages.map(m =>
            updateDoc(doc(db, 'messages', m.id), { read: true })
          )

          await Promise.all(updatePromises)

          set((state) => ({
            messages: state.messages.map(m =>
              m.recipientId === currentUser.uid ? { ...m, read: true } : m
            ),
            unreadCount: 0
          }))
        } catch (error) {
          console.error('Error marking all messages as read:', error)
          set({ unreadCount: 0 })
        }
      },

      deleteMessage: async (messageId) => {
        try {
          await updateDoc(doc(db, 'messages', messageId), { deleted: true })

          set((state) => ({
            messages: state.messages.filter(m => m.id !== messageId),
            unreadCount: state.messages.find(m => m.id === messageId)?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          console.error('Error deleting message:', error)
          set((state) => ({
            messages: state.messages.filter(m => m.id !== messageId)
          }))
        }
      },

      replyToMessage: async (originalMessageId, content) => {
        const { messages } = get()
        const originalMessage = messages.find(m => m.id === originalMessageId)
        
        if (!originalMessage) {
          set({ error: 'Message not found' })
          return
        }

        // Reply to the sender of the original message
        await get().sendMessage(
          originalMessage.senderId,
          `Re: ${originalMessage.subject}`,
          content,
          originalMessage.priority
        )
      },

      // ========== FILTER ACTIONS ==========

      setFilter: (filter) => {
        const currentUser = JSON.parse(localStorage.getItem('auth-user') || '{}')
        if (!currentUser?.uid) return

        let filteredMessages = get().messages

        // Apply type filter
        if (filter.type === 'received') {
          filteredMessages = filteredMessages.filter(m => m.recipientId === currentUser.uid)
        } else if (filter.type === 'sent') {
          filteredMessages = filteredMessages.filter(m => m.senderId === currentUser.uid)
        } else if (filter.type === 'unread') {
          filteredMessages = filteredMessages.filter(m => !m.read && m.recipientId === currentUser.uid)
        }

        // Apply priority filter
        if (filter.priority && filter.priority !== 'all') {
          filteredMessages = filteredMessages.filter(m => m.priority === filter.priority)
        }

        // Apply search filter
        if (filter.search) {
          const searchLower = filter.search.toLowerCase()
          filteredMessages = filteredMessages.filter(m =>
            m.subject.toLowerCase().includes(searchLower) ||
            m.content.toLowerCase().includes(searchLower)
          )
        }

        set({ messages: filteredMessages })
      },

      setSearch: (search) => {
        if (!search) {
          // Reset to all messages
          const currentUser = JSON.parse(localStorage.getItem('auth-user') || '{}')
          if (currentUser?.uid) {
            set((state) => ({
              messages: state.messages.filter(m =>
                m.recipientId === currentUser.uid || m.senderId === currentUser.uid
              )
            }))
          }
          return
        }

        const searchLower = search.toLowerCase()
        set((state) => ({
          messages: state.messages.filter(m =>
            m.subject.toLowerCase().includes(searchLower) ||
            m.content.toLowerCase().includes(searchLower)
          )
        }))
      },

      // ========== CONVERSATION ACTIONS ==========

      selectConversation: (userId) => {
        set({ selectedConversation: userId })
        
        // Mark all messages in this conversation as read
        const { messages } = get()
        const currentUser = JSON.parse(localStorage.getItem('auth-user') || '{}')
        
        messages
          .filter(m => (m.senderId === userId || m.recipientId === userId) && !m.read && m.recipientId === currentUser.uid)
          .forEach(m => {
            get().markAsRead(m.id)
          })
      },

      getConversationMessages: (userId) => {
        const { messages } = get()
        return messages
          .filter(m => m.senderId === userId || m.recipientId === userId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      },

      // ========== STATE ACTIONS ==========

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      subscribeToMessages: (userId) => {
        if (!userId) return () => {}

        // Query for both sent and received messages
        const q = query(
          collection(db, 'messages'),
          where('deleted', '!=', true),
          orderBy('timestamp', 'desc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messages: MessageWithId[] = []
          const conversations = new Map<string, MessageWithId[]>()
          let unreadCount = 0

          snapshot.forEach((docSnap) => {
            const data = docSnap.data()
            
            // Only include messages where user is sender or recipient
            if (data.senderId !== userId && data.recipientId !== userId && data.recipientId !== 'all') {
              return
            }

            const message: MessageWithId = {
              id: docSnap.id,
              senderId: data.senderId,
              recipientId: data.recipientId,
              recipientType: data.recipientType,
              subject: data.subject,
              content: data.content,
              timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
              read: data.read || false,
              priority: data.priority || 'normal'
            }

            messages.push(message)

            // Group by conversation
            const otherUserId = data.senderId === userId ? data.recipientId : data.senderId
            const conversationMessages = conversations.get(otherUserId) || []
            conversationMessages.push(message)
            conversations.set(otherUserId, conversationMessages)

            // Count unread
            if (!data.read && data.recipientId === userId) {
              unreadCount++
            }
          })

          set({
            messages: messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
            conversations,
            unreadCount,
            isLoading: false,
            lastUpdated: new Date()
          })
        }, (error) => {
          console.error('Error subscribing to messages:', error)
          set({ error: 'Failed to load messages', isLoading: false })
        })

        return unsubscribe
      },

      refreshMessages: () => {
        set({ lastUpdated: new Date() })
      }
    }),
    {
      name: 'messages-store',
      partialize: (state) => ({
        messages: state.messages.slice(0, 100), // Keep last 100 messages
        unreadCount: state.unreadCount
      })
    }
  )
)

// ========== HELPER FUNCTIONS ==========

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// ========== SELECTOR HOOKS ==========

export const useMessages = () => useMessagesStore((state) => state.messages)
export const useUnreadMessagesCount = () => useMessagesStore((state) => state.unreadCount)
export const useSelectedConversation = () => useMessagesStore((state) => state.selectedConversation)
export const useMessagesLoading = () => useMessagesStore((state) => state.isLoading)

// ========== UTILITY FUNCTIONS ==========

/**
 * Send a message
 */
export const sendMessage = async (
  recipientId: string,
  subject: string,
  content: string,
  priority?: 'normal' | 'urgent' | 'high'
) => {
  const { sendMessage: send } = useMessagesStore.getState()
  return send(recipientId, subject, content, priority)
}

/**
 * Get messages for a conversation
 */
export const getConversationMessages = (userId: string): MessageWithId[] => {
  const { getConversationMessages: get } = useMessagesStore.getState()
  return get(userId)
}
