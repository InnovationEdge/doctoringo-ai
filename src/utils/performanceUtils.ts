/**
 * Performance optimization utilities
 */
import { logger } from './logger'

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to ensure a function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Simple in-memory cache with TTL support
 */
class Cache<T> {
  private cache: Map<string, { data: T; expires: number }> = new Map()

  set(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    // Default 5 minutes
    const expires = Date.now() + ttl
    this.cache.set(key, { data, expires })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

// Export cache instances for different data types
export const sessionCache = new Cache<any>()
export const chatCache = new Cache<any>()
export const documentCache = new Cache<any>()

/**
 * Request deduplication - prevents multiple identical requests
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map()

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }

    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Remove from pending after completion
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  cancel(key: string) {
    this.pendingRequests.delete(key)
  }

  clear() {
    this.pendingRequests.clear()
  }
}

export const requestDeduplicator = new RequestDeduplicator()

/**
 * Measure and log performance metrics
 */
export function measurePerformance(label: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  logger.debug(`${label}: ${(end - start).toFixed(2)}ms`)
}

/**
 * Async version of measurePerformance
 */
export async function measurePerformanceAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  logger.debug(`${label}: ${(end - start).toFixed(2)}ms`)
  return result
}

/**
 * Optimize typewriter effect for better performance
 * Speeds optimized for near-instant display while maintaining smooth effect
 */
export function calculateOptimalTypingSpeed(contentLength: number): {
  speed: number
  chunkSize: number
} {
  // Much faster speeds for better UX - total animation time ~500-1500ms max
  if (contentLength < 100) {
    return { speed: 5, chunkSize: 5 } // ~100ms total for short content
  } else if (contentLength < 500) {
    return { speed: 3, chunkSize: 10 } // ~150ms total for medium content
  } else if (contentLength < 2000) {
    return { speed: 2, chunkSize: 20 } // ~200ms total for long content
  } else {
    return { speed: 1, chunkSize: 50 } // ~400ms total for very long content
  }
}

/**
 * Batch multiple state updates
 */
export function batchUpdates(updates: Array<() => void>) {
  // React 18 batches updates automatically in most cases
  // This is a helper for explicit batching if needed
  updates.forEach(update => update())
}

/**
 * Create a cancellable fetch request
 */
export function createCancellableFetch(
  url: string,
  options: RequestInit = {},
  timeout: number = 60000 // 60s default
): { promise: Promise<Response>; cancel: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const promise = fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId)
  })

  return {
    promise,
    cancel: () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        logger.debug(`Retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, as: string = 'fetch') {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = url
  link.as = as
  document.head.appendChild(link)
}

/**
 * Check if user has slow connection
 */
export function isSlowConnection(): boolean {
  // @ts-ignore - navigator.connection is not in TypeScript types
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (!connection) return false

  // Check if connection is 2G or save-data is enabled
  return connection.effectiveType === '2g' ||
         connection.effectiveType === 'slow-2g' ||
         connection.saveData === true
}

/**
 * Get optimal chunk size for streaming based on connection
 */
export function getOptimalChunkSize(): number {
  if (isSlowConnection()) {
    return 50 // Smaller chunks for slow connections
  }
  return 200 // Larger chunks for fast connections
}

/**
 * Local storage with expiration
 */
export class PersistentCache {
  private prefix: string

  constructor(prefix: string = 'app_cache_') {
    this.prefix = prefix
  }

  set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000) {
    // Default 24 hours
    const item = {
      data,
      expires: Date.now() + ttl
    }
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch {
      // localStorage quota exceeded or unavailable
    }
  }

  get(key: string): any | null {
    try {
      const itemStr = localStorage.getItem(this.prefix + key)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      if (Date.now() > item.expires) {
        this.delete(key)
        return null
      }

      return item.data
    } catch {
      return null
    }
  }

  delete(key: string) {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch {
      // localStorage unavailable
    }
  }

  clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch {
      // localStorage unavailable
    }
  }
}

export const persistentCache = new PersistentCache()
