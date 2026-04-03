// src/hooks/useKeyboardNavigation.ts - Keyboard navigation hook

import { useCallback, useEffect, useRef } from 'react'

interface KeyboardNavigationOptions {
  enabled?: boolean
  onEscape?: () => void
  onEnter?: () => void
  onTab?: (e: KeyboardEvent) => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onHome?: () => void
  onEnd?: () => void
  onSpace?: () => void
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    enabled = true,
    onEscape,
    onEnter,
    onTab,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onSpace
  } = options

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onEscape?.()
        break
      case 'Enter':
        e.preventDefault()
        onEnter?.()
        break
      case 'Tab':
        onTab?.(e)
        break
      case 'ArrowUp':
        e.preventDefault()
        onArrowUp?.()
        break
      case 'ArrowDown':
        e.preventDefault()
        onArrowDown?.()
        break
      case 'ArrowLeft':
        e.preventDefault()
        onArrowLeft?.()
        break
      case 'ArrowRight':
        e.preventDefault()
        onArrowRight?.()
        break
      case 'Home':
        e.preventDefault()
        onHome?.()
        break
      case 'End':
        e.preventDefault()
        onEnd?.()
        break
      case ' ':
        e.preventDefault()
        onSpace?.()
        break
    }
  }, [enabled, onEscape, onEnter, onTab, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onHome, onEnd, onSpace])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return { handleKeyDown }
}

// Hook for modal keyboard navigation
export const useModalKeyboardNavigation = (isOpen: boolean, onClose: () => void) => {
  const firstFocusableElementRef = useRef<HTMLElement | null>(null)
  const lastFocusableElementRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'Tab':
        // Focus trapping logic
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElementRef.current) {
            e.preventDefault()
            lastFocusableElementRef.current?.focus()
          }
        } else {
          if (document.activeElement === lastFocusableElementRef.current) {
            e.preventDefault()
            firstFocusableElementRef.current?.focus()
          }
        }
        break
    }
  }, [isOpen, onClose])

  const setFocusableElements = useCallback((container: HTMLElement | null) => {
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length > 0) {
      firstFocusableElementRef.current = focusableElements[0]
      lastFocusableElementRef.current = focusableElements[focusableElements.length - 1]
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return { setFocusableElements, handleKeyDown }
}

// Hook for list keyboard navigation
export const useListKeyboardNavigation = <T>(
  items: T[],
  currentIndex: number,
  onIndexChange: (index: number) => void,
  enabled: boolean = true
) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || items.length === 0) return

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        onIndexChange(prevIndex)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        onIndexChange(nextIndex)
        break
      }
      case 'Home':
        e.preventDefault()
        onIndexChange(0)
        break
      case 'End':
        e.preventDefault()
        onIndexChange(items.length - 1)
        break
    }
  }, [enabled, items.length, currentIndex, onIndexChange])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return { handleKeyDown }
}

// Hook for table keyboard navigation
export const useTableKeyboardNavigation = (
  rows: number,
  cols: number,
  currentRow: number,
  currentCol: number,
  onCellChange: (row: number, col: number) => void,
  enabled: boolean = true
) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        const newRowUp = currentRow > 0 ? currentRow - 1 : 0
        onCellChange(newRowUp, currentCol)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const newRowDown = currentRow < rows - 1 ? currentRow + 1 : rows - 1
        onCellChange(newRowDown, currentCol)
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const newColLeft = currentCol > 0 ? currentCol - 1 : 0
        onCellChange(currentRow, newColLeft)
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        const newColRight = currentCol < cols - 1 ? currentCol + 1 : cols - 1
        onCellChange(currentRow, newColRight)
        break
      }
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          // Move to previous cell
          if (currentCol > 0) {
            onCellChange(currentRow, currentCol - 1)
          } else if (currentRow > 0) {
            onCellChange(currentRow - 1, cols - 1)
          }
        } else {
          // Move to next cell
          if (currentCol < cols - 1) {
            onCellChange(currentRow, currentCol + 1)
          } else if (currentRow < rows - 1) {
            onCellChange(currentRow + 1, 0)
          }
        }
        break
      case 'Home':
        e.preventDefault()
        onCellChange(currentRow, 0)
        break
      case 'End':
        e.preventDefault()
        onCellChange(currentRow, cols - 1)
        break
    }
  }, [enabled, rows, cols, currentRow, currentCol, onCellChange])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return { handleKeyDown }
}

// Hook for dropdown keyboard navigation
export const useDropdownKeyboardNavigation = (
  isOpen: boolean,
  options: string[],
  selectedIndex: number,
  onSelect: (index: number) => void,
  onClose: () => void,
  enabled: boolean = true
) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !isOpen || options.length === 0) return

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : options.length - 1
        onSelect(prevIndex)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const nextIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0
        onSelect(nextIndex)
        break
      }
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(selectedIndex)
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'Tab':
        onClose()
        break
    }
  }, [enabled, isOpen, options.length, selectedIndex, onSelect, onClose])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return { handleKeyDown }
}

export default useKeyboardNavigation