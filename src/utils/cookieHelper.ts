/**
 * Cookie utility functions
 * Shared across the application to eliminate code duplication
 */

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
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

/**
 * Set a cookie with optional expiration
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Days until expiration (optional)
 */
export function setCookie(name: string, value: string, days?: number): void {
  let expires = ''
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
    expires = '; expires=' + date.toUTCString()
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/'
}

/**
 * Delete a cookie
 * @param name - Cookie name
 */
export function deleteCookie(name: string): void {
  document.cookie = name + '=; Max-Age=-99999999; path=/'
}
