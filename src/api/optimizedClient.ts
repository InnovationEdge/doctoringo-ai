/**
 * Optimized API client with caching, deduplication, and performance improvements
 */

import { sessionCache, requestDeduplicator, createCancellableFetch, retryWithBackoff } from 'src/utils/performanceUtils'
import { API_BASE_URL } from '../lib/api'

function getCookie(name: string): string | null {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookieElement = cookies[i]
      if (cookieElement) {
        const cookie = cookieElement.trim()
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        }
      }
    }
  }
  return cookieValue
}

interface FetchOptions extends RequestInit {
  useCache?: boolean
  cacheTTL?: number
  retryOnFailure?: boolean
  timeout?: number
}

/**
 * Optimized fetch with caching, deduplication, and retry logic
 */
export async function optimizedFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    useCache = false,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    retryOnFailure = false,
    timeout = 60000, // 60s default, chat uses 120s
    ...fetchOptions
  } = options

  const url = `${API_BASE_URL}${endpoint}`
  const cacheKey = `${fetchOptions.method || 'GET'}:${endpoint}:${JSON.stringify(fetchOptions.body || {})}`

  // Check cache first (only for GET requests)
  if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cached = sessionCache.get(cacheKey)
    if (cached) {
      return cached as T
    }
  }

  // Add authentication headers
  const csrfToken = getCookie('csrftoken')
  const headers = {
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    ...fetchOptions.headers
  }

  // Deduplicate identical concurrent requests
  return requestDeduplicator.deduplicate(cacheKey, async () => {
    const fetchFn = async () => {
      const { promise } = createCancellableFetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include'
      }, timeout)

      try {
        const response = await promise

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Cache successful responses
        if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
          sessionCache.set(cacheKey, data, cacheTTL)
        }

        return data as T
      } catch (error) {
        // Don't cache errors
        throw error
      }
    }

    // Retry logic for important requests
    if (retryOnFailure) {
      return retryWithBackoff(fetchFn, 3, 1000)
    }

    return fetchFn()
  })
}

/**
 * Optimized sessions API
 */
export const optimizedSessionsApi = {
  // Get all sessions with caching
  getSessions: async (query?: string) => {
    const endpoint = query
      ? `/api/sessions/?q=${encodeURIComponent(query)}`
      : '/api/sessions/'

    return optimizedFetch<any[]>(endpoint, {
      method: 'GET',
      useCache: true,
      cacheTTL: 2 * 60 * 1000 // Cache for 2 minutes
    })
  },

  // Create session (no caching, but with retry)
  createSession: async () => {
    const result = await optimizedFetch<any>('/api/sessions/', {
      method: 'POST',
      retryOnFailure: true
    })

    // Invalidate sessions cache
    sessionCache.delete('GET:/api/sessions/:{}')

    return result
  },

  // Get single session (with caching)
  getSession: async (sessionId: string) => {
    return optimizedFetch<any>(`/api/sessions/${sessionId}/`, {
      method: 'GET',
      useCache: true,
      cacheTTL: 5 * 60 * 1000
    })
  }
}

/**
 * Prefetch critical data for faster loading
 */
export async function prefetchCriticalData() {
  try {
    await optimizedSessionsApi.getSessions()
  } catch {
    // Silent fail for prefetch
  }
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  sessionCache.clear()
  requestDeduplicator.clear()
}

/**
 * Invalidate specific cache entries
 */
export function invalidateCache(pattern: string) {
  // This is simplified - you'd want more sophisticated pattern matching
  sessionCache.delete(pattern)
}
