// src/hooks/useToast.ts - Toast notification hook

import { useCallback, useState } from 'react'
import { ToastType } from '../components/Toast'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove after duration
    if (duration && duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration)
  }, [addToast])

  const showError = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration)
  }, [addToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration)
  }, [addToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration)
  }, [addToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  }
}

// Global toast instance for use outside React components
let globalToasts: Toast[] = []

export const showToast = (message: string, type: ToastType, duration?: number) => {
  const id = `global-toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newToast: Toast = { id, message, type, duration }
  
  globalToasts = [...globalToasts, newToast]
  
  // Dispatch custom event to notify React components
  window.dispatchEvent(new CustomEvent('toast-added', { detail: newToast }))
  
  // Auto-remove after duration
  if (duration && duration > 0) {
    setTimeout(() => {
      removeGlobalToast(id)
    }, duration)
  }
}

export const removeGlobalToast = (id: string) => {
  globalToasts = globalToasts.filter(toast => toast.id !== id)
  window.dispatchEvent(new CustomEvent('toast-removed', { detail: { id } }))
}

export const clearGlobalToasts = () => {
  globalToasts = []
  window.dispatchEvent(new CustomEvent('toasts-cleared'))
}

export const getGlobalToasts = () => globalToasts

export default useToast