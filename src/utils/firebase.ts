import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAnalytics, Analytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics'
import { logger } from './logger'

// Firebase configuration using Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

let app: FirebaseApp | null = null
let analytics: Analytics | null = null

/**
 * Initialize Firebase
 * Only initializes if Firebase config is present and running in browser
 */
export const initializeFirebase = (): { app: FirebaseApp | null; analytics: Analytics | null } => {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    logger.info('🔥 Firebase: Skipping initialization (not in browser environment)')
    return { app: null, analytics: null }
  }

  // Check if Firebase is already initialized
  if (app && analytics) {
    logger.info('🔥 Firebase: Already initialized')
    return { app, analytics }
  }

  // Validate Firebase configuration
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    logger.warn('⚠️ Firebase: Missing configuration. Analytics will be disabled.')
    return { app: null, analytics: null }
  }

  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig)

    // Initialize Analytics
    analytics = getAnalytics(app)

    logger.info('🔥 Firebase initialized successfully')
    logger.info('📊 Firebase Analytics enabled')

    return { app, analytics }
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase:', error)
    return { app: null, analytics: null }
  }
}

/**
 * Get Analytics instance (initializes if needed)
 */
export const getAnalyticsInstance = (): Analytics | null => {
  if (!analytics) {
    const { analytics: analyticsInstance } = initializeFirebase()
    return analyticsInstance
  }
  return analytics
}

/**
 * Track custom events
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  const analyticsInstance = getAnalyticsInstance()
  if (!analyticsInstance) return

  try {
    logEvent(analyticsInstance, eventName, eventParams)
    logger.debug(`📊 Event tracked: ${eventName}`, eventParams)
  } catch (error) {
    logger.error('❌ Error tracking event:', error)
  }
}

/**
 * Set user ID for analytics
 */
export const setAnalyticsUserId = (userId: string | null) => {
  const analyticsInstance = getAnalyticsInstance()
  if (!analyticsInstance) return

  try {
    if (userId) {
      setUserId(analyticsInstance, userId)
      logger.debug(`👤 Analytics user ID set: ${userId}`)
    } else {
      setUserId(analyticsInstance, null)
      logger.debug('👤 Analytics user ID cleared')
    }
  } catch (error) {
    logger.error('❌ Error setting user ID:', error)
  }
}

/**
 * Set user properties for analytics
 */
export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
  const analyticsInstance = getAnalyticsInstance()
  if (!analyticsInstance) return

  try {
    setUserProperties(analyticsInstance, properties)
    logger.debug('👤 User properties set:', properties)
  } catch (error) {
    logger.error('❌ Error setting user properties:', error)
  }
}

/**
 * Predefined event tracking functions
 */

// User events
export const trackUserLogin = (method: string = 'google') => {
  trackEvent('login', { method })
}

export const trackUserSignup = (method: string = 'google') => {
  trackEvent('sign_up', { method })
}

export const trackUserLogout = () => {
  trackEvent('logout')
}

// Chat events
export const trackChatMessage = (sessionId: string, messageLength: number) => {
  trackEvent('chat_message_sent', {
    session_id: sessionId,
    message_length: messageLength
  })
}

export const trackChatResponse = (sessionId: string, responseLength: number, responseTime: number) => {
  trackEvent('chat_response_received', {
    session_id: sessionId,
    response_length: responseLength,
    response_time_ms: responseTime
  })
}

export const trackNewChatSession = () => {
  trackEvent('new_chat_session')
}

// Document events
export const trackDocumentGeneration = (documentType: string, success: boolean) => {
  trackEvent('document_generated', {
    document_type: documentType,
    success
  })
}

export const trackDocumentDownload = (documentType: string, format: string) => {
  trackEvent('document_downloaded', {
    document_type: documentType,
    format
  })
}

// File events
export const trackFileUpload = (fileType: string, fileSize: number) => {
  trackEvent('file_uploaded', {
    file_type: fileType,
    file_size: fileSize
  })
}

// Page events
export const trackPageView = (pageName: string, path: string) => {
  trackEvent('page_view', {
    page_name: pageName,
    page_path: path
  })
}

// Subscription events
export const trackSubscriptionView = () => {
  trackEvent('view_pricing')
}

export const trackSubscriptionUpgrade = (plan: string) => {
  trackEvent('subscription_upgrade', {
    plan
  })
}

// Error events
export const trackError = (errorType: string, errorMessage: string) => {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage
  })
}

// Engagement events
export const trackSessionDuration = (duration: number) => {
  trackEvent('session_duration', {
    duration_seconds: duration
  })
}

export default {
  initializeFirebase,
  getAnalyticsInstance,
  trackEvent,
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  // User events
  trackUserLogin,
  trackUserSignup,
  trackUserLogout,
  // Chat events
  trackChatMessage,
  trackChatResponse,
  trackNewChatSession,
  // Document events
  trackDocumentGeneration,
  trackDocumentDownload,
  // File events
  trackFileUpload,
  // Page events
  trackPageView,
  // Subscription events
  trackSubscriptionView,
  trackSubscriptionUpgrade,
  // Error events
  trackError,
  // Engagement events
  trackSessionDuration
}
