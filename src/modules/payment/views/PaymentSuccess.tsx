import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'src/providers/AuthProvider'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/components/ThemeContext'
import useIsMobile from 'src/hooks/useMobile'
import { Button, Spin } from 'src/components/ui'
import { paymentApi } from 'src/api/payment'

// Icons
const CheckCircleIcon = ({ size = 72, className = '' }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = ({ size = 72, className = '' }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Theme color constants to avoid recalculation
const THEME_COLORS = {
  dark: { bg: '#0a0a0a', text: '#ececec', secondary: '#8e8e8e' },
  light: { bg: '#ffffff', text: '#0d0d0d', secondary: '#666666' }
} as const

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const { refreshSubscription } = useAuth()
  const { translate } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'
  const isMobile = useIsMobile()
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // Use ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef(true)
  const hasRedirectedRef = useRef(false)

  // Memoize theme colors
  const colors = useMemo(() => isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light, [isDarkMode])

  // Handle successful payment - consolidated logic
  const handlePaymentSuccess = useCallback(() => {
    if (hasRedirectedRef.current) return

    setSuccess(true)
    setVerifying(false)
    hasRedirectedRef.current = true

    // Dispatch event for other components
    window.dispatchEvent(new Event('payment-success'))

    // Redirect to home after 3 seconds
    setTimeout(() => {
      if (isMountedRef.current) {
        navigate('/', { replace: true })
      }
    }, 3000)
  }, [navigate])

  // Single consolidated useEffect for payment verification with proper cleanup
  useEffect(() => {
    isMountedRef.current = true
    let aborted = false

    const verifyPayment = async () => {
      const maxAttempts = 10  // Max 10 attempts (20 seconds total)
      const pollInterval = 2000  // Check every 2 seconds

      for (let i = 0; i < maxAttempts; i++) {
        if (aborted || hasRedirectedRef.current) return

        if (isMountedRef.current) {
          setAttempts(i + 1)
        }

        try {
          // Fetch subscription status directly from API (not from React state)
          const subscription = await paymentApi.getSubscriptionStatus()

          if (aborted) return

          // Check if subscription is now paid
          if (subscription.is_paid === true) {
            // Update auth context with new subscription
            await refreshSubscription()
            handlePaymentSuccess()
            return
          }
        } catch (error) {
          console.error('Payment verification error:', error)
        }

        // Wait before next attempt
        if (i < maxAttempts - 1 && !aborted) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
      }

      // After all attempts, mark as failed
      if (isMountedRef.current && !aborted) {
        setSuccess(false)
        setVerifying(false)
      }
    }

    verifyPayment()

    // Cleanup function
    return () => {
      aborted = true
      isMountedRef.current = false
    }
  }, [refreshSubscription, handlePaymentSuccess])

  if (verifying) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: isMobile ? '16px' : '20px',
        backgroundColor: colors.bg,
        padding: isMobile ? '16px' : '20px'
      }}>
        <Spin size={isMobile ? 'default' : 'large'} />
        <p style={{
          color: colors.secondary,
          fontSize: isMobile ? '14px' : '16px',
          textAlign: 'center',
          margin: 0
        }}>
          {translate('verifying_payment', 'გადახდის დადასტურება...')}
        </p>
        <p style={{
          color: colors.secondary,
          fontSize: isMobile ? '12px' : '13px',
          textAlign: 'center',
          margin: 0,
          opacity: 0.7
        }}>
          {translate('checking_status', `შემოწმება ${attempts}/10...`)}
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: isMobile ? '16px' : '20px',
      backgroundColor: colors.bg
    }}>
      <div className='text-center max-w-md'>
        {/* Icon */}
        <div className='mb-6'>
          {success ? (
            <CheckCircleIcon size={isMobile ? 48 : 72} className='mx-auto text-green-500' />
          ) : (
            <XCircleIcon size={isMobile ? 48 : 72} className='mx-auto text-red-500' />
          )}
        </div>

        {/* Title */}
        <h1 style={{
          color: colors.text,
          fontSize: isMobile ? '18px' : '24px',
          fontWeight: 600,
          marginBottom: '8px'
        }}>
          {success
            ? translate('payment_successful', 'გადახდა წარმატებით დასრულდა!')
            : translate('payment_failed', 'გადახდა ვერ განხორციელდა')
          }
        </h1>

        {/* Subtitle */}
        <p style={{
          color: colors.secondary,
          fontSize: isMobile ? '13px' : '14px',
          marginBottom: '24px'
        }}>
          {success
            ? translate('payment_success_message', 'თქვენ ახლა გაქვთ პრემიუმ წვდომა! გადამისამართება მთავარ გვერდზე...')
            : translate('payment_failed_message', 'გთხოვთ სცადოთ ხელახლა ან დაუკავშირდით მხარდაჭერას')
          }
        </p>

        {/* Buttons */}
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Button
            type='primary'
            onClick={() => navigate('/', { replace: true })}
            style={{
              backgroundColor: isDarkMode ? '#ffffff' : '#000000',
              borderColor: isDarkMode ? '#ffffff' : '#000000',
              color: isDarkMode ? '#000000' : '#ffffff',
              borderRadius: '24px',
              height: isMobile ? '40px' : '44px',
              fontWeight: 600,
              fontSize: isMobile ? '13px' : '14px',
              paddingLeft: isMobile ? '16px' : '20px',
              paddingRight: isMobile ? '16px' : '20px'
            }}
          >
            {translate('go_to_home', 'მთავარ გვერდზე დაბრუნება')}
          </Button>
          {!success && (
            <Button
              onClick={() => navigate('/pricing')}
              style={{
                borderRadius: '24px',
                height: isMobile ? '40px' : '44px',
                borderColor: isDarkMode ? '#2f2f2f' : '#e5e5e5',
                backgroundColor: isDarkMode ? '#171717' : 'transparent',
                color: colors.text,
                fontSize: isMobile ? '13px' : '14px',
                paddingLeft: isMobile ? '16px' : '20px',
                paddingRight: isMobile ? '16px' : '20px'
              }}
            >
              {translate('try_again', 'ხელახლა ცდა')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
