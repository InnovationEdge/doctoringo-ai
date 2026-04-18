import { createContext, ReactNode, useContext, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthReducer } from 'src/store/useAuthReducer'
import { Auth } from 'src/api'
import { setAnalyticsUserId, setAnalyticsUserProperties, trackUserLogin, trackUserLogout } from 'src/utils/firebase'
import { API_BASE_URL } from '../lib/api'

export interface SubscriptionStatus {
  status: 'free' | 'paid'
  is_paid: boolean
  is_active: boolean
  expires_at?: string
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  ip: string | null
  isEuropean: boolean
  subscription?: SubscriptionStatus
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  login: () => console.error('Login function not implemented'),
  logout: () => console.error('Logout function not implemented'),
  refreshSubscription: async () => console.error('RefreshSubscription function not implemented')
})

export const useAuth = () => useContext(AuthContext)

// Cache keys for localStorage
const GEO_CACHE_KEY = 'doctoringo_geo_cache'
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface GeoCache {
  ip: string
  isEuropean: boolean
  timestamp: number
}

const fetchIp = async (): Promise<string | null> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    })
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Failed to fetch IP:', error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

const fetchGeoInfo = async (ip: string): Promise<boolean> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal
    })
    const data = await response.json()
    return data.continent_code === 'EU' && data.country_code !== 'GE'
  } catch (error) {
    console.error('Failed to fetch geo info:', error)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

const getCachedGeoInfo = (): GeoCache | null => {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY)
    if (!cached) return null

    const data: GeoCache = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid
    if (now - data.timestamp < GEO_CACHE_TTL) {
      return data
    }

    // Cache expired
    localStorage.removeItem(GEO_CACHE_KEY)
    return null
  } catch (error) {
    console.error('Error reading geo cache:', error)
    return null
  }
}

const setCachedGeoInfo = (ip: string, isEuropean: boolean) => {
  try {
    const data: GeoCache = {
      ip,
      isEuropean,
      timestamp: Date.now()
    }
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error setting geo cache:', error)
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useAuthReducer()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_REQUEST_START' })

        // Parallel requests for better performance
        const [csrfResponse, userResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/csrf/`, { credentials: 'include' }),
          Auth.getAuthUser()
        ])

        if (!csrfResponse.ok) {
          throw new Error('Failed to get CSRF token')
        }

        const user = userResponse

        // Check cache first for geo info
        let ip: string | null = user.ip
        let isEuropean = false

        const cachedGeo = getCachedGeoInfo()

        if (cachedGeo && cachedGeo.ip === ip) {
          // Use cached geo info
          isEuropean = cachedGeo.isEuropean
        } else {
          // Fetch fresh geo info
          if (!ip) {
            ip = await fetchIp()
          }

          if (ip) {
            isEuropean = await fetchGeoInfo(ip)
            // Cache the result
            setCachedGeoInfo(ip, isEuropean)
          }
        }

        // Fetch subscription status in parallel (non-blocking)
        let subscription: SubscriptionStatus | undefined

        try {
          const subResponse = await fetch(`${API_BASE_URL}/api/payment/subscription/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })

          if (subResponse.ok) {
            subscription = await subResponse.json()
          }
        } catch {
          // Don't fail auth if subscription fetch fails
        }

        dispatch({
          type: 'AUTH_REQUEST_SUCCESS',
          payload: { ...user, ip, isEuropean, subscription }
        })

        // Track user login in Firebase Analytics
        setAnalyticsUserId(user.id.toString())
        setAnalyticsUserProperties({
          email: user.email,
          subscription_status: subscription?.status || 'free',
          is_european: isEuropean,
          username: user.username
        })
        trackUserLogin('google')
      } catch (error) {
        console.info('Initialization complete: User not authenticated.')
        dispatch({ type: 'AUTH_REQUEST_FAILURE' })

        // If on a protected route and not authenticated, redirect to login
        if (location.pathname !== '/login' && location.pathname !== '/signup') {
          // Only redirect if we're sure the user isn't authenticated
          const isProtectedRoute = !['/', '/pricing'].includes(location.pathname)
          if (isProtectedRoute) {
            navigate('/login')
          }
        }
      }
    }

    initializeAuth().then()
  }, [])

  const login = () => {
    localStorage.setItem('postLoginRedirect', location.pathname)
    window.location.href = `${API_BASE_URL}/accounts/google/login/`
  }

  const refreshSubscription = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/subscription/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to fetch subscription: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const subscription = await response.json()

      if (!state.user) {
        throw new Error('User not authenticated - cannot update subscription')
      }

      dispatch({
        type: 'AUTH_REQUEST_SUCCESS',
        payload: { ...state.user, subscription }
      })
    } catch (error) {
      // Re-throw the error so caller can handle it
      throw error
    }
  }

  const logout = async () => {
    try {
      await Auth.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // Track logout event before clearing user data
      trackUserLogout()
      setAnalyticsUserId(null)

      // Always clear the auth state, regardless of API success
      dispatch({ type: 'LOGOUT_SUCCESS' })
      // Dispatch auth-changed event for components to listen
      window.dispatchEvent(new Event('auth-changed'))
      // Clear any local storage
      localStorage.removeItem('postLoginRedirect')
      navigate('/login')
    }
  }

  useEffect(() => {
    if (state.user) {
      const redirectPath = localStorage.getItem('postLoginRedirect')
      if (redirectPath) {
        localStorage.removeItem('postLoginRedirect')
        navigate(redirectPath)
      }
    }
  }, [state.user, navigate])

  // Listen for session expired events from API calls
  useEffect(() => {
    const handleSessionExpired = () => {
      // Only clear auth state - don't call full logout() which navigates
      // App.tsx's handler and AuthGuard will handle navigation
      trackUserLogout()
      setAnalyticsUserId(null)
      dispatch({ type: 'LOGOUT_SUCCESS' })
      localStorage.removeItem('postLoginRedirect')
      localStorage.removeItem('doctoringo_user')
    }

    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [])

  const value: AuthContextType = {
    isAuthenticated: !!state.user,
    user: state.user,
    isLoading: state.isLoading,
    login,
    logout,
    refreshSubscription
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
