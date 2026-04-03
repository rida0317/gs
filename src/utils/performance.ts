// src/utils/performance.ts - Performance optimization utilities

import { useMemo, useCallback, useRef, useState, useEffect } from 'react'

// Memoization utilities
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T => {
  return useCallback(callback, dependencies)
}

export const useMemoizedValue = <T>(
  factory: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(factory, dependencies)
}

// Debouncing utility
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttling utility
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] => {
  const [isIntersecting, setIntersecting] = useState(false)
  const [element, setElement] = useState<Element | null>(null)

  useEffect(() => {
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [element, options])

  const callbackRef = useCallback((node: Element | null) => {
    setElement(node)
  }, [])

  return [callbackRef, isIntersecting]
}

// Virtualization utilities for long lists
export interface VirtualizationConfig {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export const useVirtualization = (
  itemCount: number,
  config: VirtualizationConfig
) => {
  const { itemHeight, containerHeight, overscan = 5 } = config
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = itemCount * itemHeight
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(() => {
    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        top: i * itemHeight,
        height: itemHeight
      })
    }
    return items
  }, [startIndex, endIndex, itemHeight])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    totalHeight,
    visibleItems,
    handleScroll,
    startIndex,
    endIndex
  }
}

// Image loading optimization
export const useImagePreloader = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    const preloadImages = async () => {
      const loaded: string[] = []

      for (const url of imageUrls) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
              if (!isCancelled) {
                loaded.push(url)
                setLoadedImages([...loaded])
                resolve(url)
              }
            }
            img.onerror = reject
            img.src = url
          })
        } catch (error) {
          console.warn(`Failed to load image: ${url}`, error)
        }
      }

      if (!isCancelled) {
        setLoading(false)
      }
    }

    preloadImages()

    return () => {
      isCancelled = true
    }
  }, [imageUrls])

  return { loadedImages, loading }
}

// Resource caching utility
export class ResourceCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set(key: string, data: T): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() })
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Performance monitoring utilities
export const usePerformanceMonitor = (label: string) => {
  const startTime = useRef<number>()

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current
      console.log(`${label} took ${duration.toFixed(2)}ms`)
      startTime.current = undefined
      return duration
    }
    return 0
  }, [label])

  return { start, end }
}

// Memory management utilities
export const useMemoryManagement = () => {
  const cleanupRefs = useRef<(() => void)[]>([])

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupRefs.current.push(cleanupFn)
  }, [])

  useEffect(() => {
    return () => {
      cleanupRefs.current.forEach(cleanup => cleanup())
      cleanupRefs.current = []
    }
  }, [])

  const clearMemory = useCallback(() => {
    cleanupRefs.current.forEach(cleanup => cleanup())
    cleanupRefs.current = []
  }, [])

  return { addCleanup, clearMemory }
}

// Batch update utility for better performance
export const useBatchUpdate = <T>(
  initialState: T,
  batchSize: number = 10
): [T, (updates: Partial<T>[]) => void] => {
  const [state, setState] = useState<T>(initialState)
  const pendingUpdates = useRef<Partial<T>[]>([])

  const updateBatch = useCallback((updates: Partial<T>[]) => {
    pendingUpdates.current.push(...updates)
    
    if (pendingUpdates.current.length >= batchSize) {
      setState(prevState => {
        const newState = { ...prevState }
        pendingUpdates.current.forEach(update => {
          Object.assign(newState, update)
        })
        pendingUpdates.current = []
        return newState
      })
    }
  }, [batchSize])

  useEffect(() => {
    // Flush remaining updates on unmount
    return () => {
      if (pendingUpdates.current.length > 0) {
        setState(prevState => {
          const newState = { ...prevState }
          pendingUpdates.current.forEach(update => {
            Object.assign(newState, update)
          })
          return newState
        })
      }
    }
  }, [])

  return [state, updateBatch]
}

export default {
  useMemoizedCallback,
  useMemoizedValue,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useVirtualization,
  useImagePreloader,
  ResourceCache,
  usePerformanceMonitor,
  useMemoryManagement,
  useBatchUpdate
}