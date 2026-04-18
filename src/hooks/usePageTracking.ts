import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from 'src/utils/firebase'

/**
 * Hook to automatically track page views in Firebase Analytics
 * Call this hook at the top level of your app (e.g., in App.tsx or Layout.tsx)
 */
export const usePageTracking = () => {
  const location = useLocation()

  useEffect(() => {
    // Get page name from pathname
    const pageName = getPageName(location.pathname)

    // Track page view
    trackPageView(pageName, location.pathname)
  }, [location])
}

/**
 * Convert pathname to readable page name
 */
const getPageName = (pathname: string): string => {
  // Remove leading slash
  const path = pathname.replace(/^\//, '')

  // Handle special cases
  if (!path || path === '') return 'Home'
  if (path === 'login') return 'Login'
  if (path === 'pricing') return 'Pricing'
  if (path === 'payment/success' || path === 'payment/callback') return 'Payment Success'
  if (path === 'chat') return 'Chat'
  if (path.startsWith('settings')) return 'Settings'

  // Default: capitalize first letter
  return path
    .split('/')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' > ')
}

export default usePageTracking
