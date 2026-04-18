import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from 'src/components/ThemeContext'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useAuth } from 'src/providers/AuthProvider'
import { useCountry } from 'src/providers/CountryProvider'
import { paymentApi, CreateEmbeddedPaymentResponse } from 'src/api/payment'
import useIsMobile from 'src/hooks/useMobile'
import { message } from 'src/components/ui'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, CheckCircle, Shield, Lock, Loader2,
  CreditCard, Zap, FileText, Sparkles, HeadphonesIcon, Scale, RefreshCw
} from 'lucide-react'

// Declare Flitt checkout function
declare global {
  interface Window {
    checkout: (container: string, options: any) => {
      on: (event: string, callback: (model?: any) => void) => void
    }
  }
}

const CheckoutPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'
  const { translate } = useTranslation()
  const { refreshSubscription } = useAuth()
  const { geoInfo } = useCountry()
  const isMobile = useIsMobile()

  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<CreateEmbeddedPaymentResponse | null>(null)
  const [saveCard, setSaveCard] = useState(true)
  const [autoRenew, setAutoRenew] = useState(true)
  const [checkoutInitialized, setCheckoutInitialized] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const checkoutRef = useRef<HTMLDivElement>(null)

  // Payment is always in GEL (49 GEL) - Flitt merchant only supports GEL
  const price = 49
  const currency = 'GEL'
  const currencySymbol = '₾'

  // Get options from URL params
  useEffect(() => {
    const hasAutoRenewParam = searchParams.has('auto_renew')
    const hasSaveCardParam = searchParams.has('save_card')

    if (hasAutoRenewParam) {
      const urlAutoRenew = searchParams.get('auto_renew') === 'true'
      setAutoRenew(urlAutoRenew)
      if (urlAutoRenew) {
        setSaveCard(true)
      }
    }

    if (hasSaveCardParam && !searchParams.get('auto_renew')) {
      setSaveCard(searchParams.get('save_card') === 'true')
    }
  }, [searchParams])

  // Keep translate ref fresh for use in effects without causing re-runs
  const translateRef = useRef(translate)
  translateRef.current = translate

  // Track SDK loaded state
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState(false)

  // Load Flitt SDK script
  useEffect(() => {
    const SDK_TIMEOUT = 15000
    let timeoutId: NodeJS.Timeout | null = null

    const loadFlittSDK = async () => {
      timeoutId = setTimeout(() => {
        if (!sdkReady) {
          console.error('Flitt SDK load timeout')
          setSdkError(true)
          message.error(translateRef.current('payment_form_load_failed', 'Payment form failed to load. Please refresh the page.'))
        }
      }, SDK_TIMEOUT)

      if (typeof window.checkout === 'function') {
        setSdkReady(true)
        if (timeoutId) clearTimeout(timeoutId)
        return
      }

      if (document.querySelector('script[src*="pay.flitt.com"]')) {
        let attempts = 0
        while (typeof window.checkout !== 'function' && attempts < 100) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }
        if (typeof window.checkout === 'function') {
          setSdkReady(true)
          if (timeoutId) clearTimeout(timeoutId)
        }
        return
      }

      const link = document.createElement('link')
      link.href = 'https://pay.flitt.com/latest/checkout-vue/checkout.css'
      link.rel = 'stylesheet'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://pay.flitt.com/latest/checkout-vue/checkout.js'
      script.async = true

      script.onload = async () => {
        let attempts = 0
        while (typeof window.checkout !== 'function' && attempts < 100) {
          await new Promise(r => setTimeout(r, 100))
          attempts++
        }
        if (typeof window.checkout === 'function') {
          setSdkReady(true)
          if (timeoutId) clearTimeout(timeoutId)
        } else {
          setSdkError(true)
          message.error(translateRef.current('payment_form_load_failed', 'Payment form failed to load.'))
        }
      }

      script.onerror = () => {
        console.error('Failed to load Flitt SDK')
        setSdkError(true)
        if (timeoutId) clearTimeout(timeoutId)
        message.error(translateRef.current('payment_form_load_failed', 'Payment form failed to load. Please refresh the page.'))
      }

      document.head.appendChild(script)
    }

    loadFlittSDK()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Create payment
  const initializePayment = async () => {
    setLoading(true)
    try {
      const data = await paymentApi.createEmbeddedPayment({
        auto_renew: autoRenew,
        save_payment_method: saveCard,
        region: geoInfo?.country_code || 'GE'
      })
      setPaymentData(data)
      setLoading(false)
    } catch (error: any) {
      message.error(error.message || translate('payment_creation_failed', 'Payment creation failed'))
      setLoading(false)
    }
  }

  // Initialize checkout when payment data and SDK are ready
  // Wait for DOM container to exist (AnimatePresence delays mount)
  useEffect(() => {
    if (!paymentData || !sdkReady || checkoutInitialized) return

    const initCheckout = () => {
      const container = document.getElementById('flitt-checkout-container')
      if (!container) return false

      const options = {
        options: {
          methods: ['card', 'wallets'],
          card_icons: ['mastercard', 'visa', 'maestro'],
          active_tab: 'card',
          title: '',
          link: '',
          fields: false,
          full_screen: isMobile,
          button: true,
          email: false,
          theme: {
            type: isDarkMode ? 'dark' : 'light'
          }
        },
        params: {
          token: paymentData.token
        },
        css_variable: {
          main: isDarkMode ? '#033C81' : '#0d0d0d',
          card_bg: isDarkMode ? '#0d0d0d' : '#ffffff',
          card_shadow: isDarkMode ? '#000000' : '#e5e5e5'
        }
      }

      try {
        const checkoutInstance = window.checkout('#flitt-checkout-container', options)

      checkoutInstance.on('success', () => {
        setPaymentStatus('success')
        setTimeout(async () => {
          try {
            await refreshSubscription()
          } catch (err) {
            console.error('Failed to refresh subscription:', err)
          }
          window.dispatchEvent(new Event('payment-success'))
          navigate('/payment/success?status=success', { replace: true })
        }, 2000)
      })

      checkoutInstance.on('error', (model: any) => {
        setPaymentStatus('error')
        console.error('Flitt payment error:', model)
        let errorMessage: string | undefined
        if (model) {
          errorMessage = model.error_message
            || model.message
            || model.error?.message
            || (typeof model.attr === 'function' ? model.attr('error.message') : undefined)
            || (model.error && typeof model.error === 'string' ? model.error : undefined)
        }
        message.error(errorMessage || translateRef.current('payment_failed', 'Payment failed'))
      })

      checkoutInstance.on('ready', () => {})
      checkoutInstance.on('close', () => {})

      setCheckoutInitialized(true)
      return true
    } catch (err) {
      console.error('Failed to initialize Flitt checkout:', err)
      message.error(translateRef.current('checkout_init_failed', 'Checkout form failed to load'))
      return true
    }
    }

    // Try immediately, then retry until container exists in DOM
    if (!initCheckout()) {
      let attempts = 0
      const interval = setInterval(() => {
        attempts++
        if (initCheckout() || attempts > 20) {
          clearInterval(interval)
        }
      }, 200)
      return () => clearInterval(interval)
    }
  }, [paymentData, isDarkMode, checkoutInitialized, refreshSubscription, navigate, sdkReady, isMobile])

  const handleSaveCardChange = (checked: boolean) => {
    setSaveCard(checked)
    if (!checked) {
      setAutoRenew(false)
    }
  }

  const handleAutoRenewChange = (checked: boolean) => {
    setAutoRenew(checked)
    if (checked) {
      setSaveCard(true)
    }
  }

  const features = [
    { icon: Scale, text: translate('advanced_legal_reasoning', 'Advanced Legal Reasoning') },
    { icon: CheckCircle, text: translate('verified_answers', 'Verified answers from official sources') },
    { icon: FileText, text: translate('document_analysis', 'Document analysis & summarization') },
    { icon: Sparkles, text: translate('premium_models', 'Premium AI models (GPT 5.1)') },
    { icon: FileText, text: translate('document_generation', 'Legal document generation') },
    { icon: HeadphonesIcon, text: translate('priority_support', 'Priority support') }
  ]

  // Success state
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#fcfcf9] dark:bg-[#171717] p-5">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle size={48} className="text-green-500" />
            </motion.div>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#1a1a1a] dark:text-white mb-3 text-center">
            {translate('payment_successful', 'Payment completed successfully!')}
          </h2>
          <p className="text-[#676767] dark:text-[#8e8e8e] text-sm">
            {translate('redirecting', 'Redirecting...')}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfcf9] dark:bg-[#171717] flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <nav className="sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between bg-[#fcfcf9]/80 dark:bg-[#171717]/80 backdrop-blur-md border-b border-[#e5e5e5]/50 dark:border-white/5">
        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-1.5 p-2 rounded-xl text-[#8e8e8e] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex items-center gap-2 text-[#8e8e8e]">
          <Lock size={14} />
          <span className="text-[11px] font-medium uppercase tracking-wider">
            {translate('secure_checkout', 'Secure Checkout')}
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex justify-center items-start md:items-center px-4 md:px-10 py-6 md:py-12 overflow-y-auto">
        <div className={`w-full ${isMobile ? 'max-w-[480px]' : 'max-w-[960px]'}`}>

          <AnimatePresence mode="wait">
            {/* Step 1: Payment Options (before payment initialized) */}
            {!paymentData && !loading && !sdkError && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-5'} gap-5 md:gap-6`}
              >
                {/* Left: Order Summary (3 cols on desktop) */}
                <div className={`${isMobile ? '' : 'md:col-span-3'} flex flex-col gap-4 md:gap-5`}>
                  {/* Plan Card */}
                  <div className="bg-white dark:bg-[#121212] rounded-[28px] border border-[#e5e5e0] dark:border-white/10 overflow-hidden">
                    {/* Accent strip */}
                    <div className="h-1.5 bg-gradient-to-r from-[#033C81] to-[#c07850]" />

                    <div className="p-5 md:p-8">
                      {/* Header with plan name + price */}
                      <div className="flex items-center justify-between mb-5 md:mb-6">
                        <div className="flex items-center gap-3 md:gap-0 md:flex-col md:items-start">
                          {/* Mobile: icon inline with name */}
                          {isMobile && (
                            <div className="w-10 h-10 rounded-xl bg-[#033C81] flex items-center justify-center">
                              <Zap size={20} className="text-white" />
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#8e8e8e] font-medium block mb-0.5 md:mb-1">
                              {translate('upgrading_to', 'Upgrading to')}
                            </span>
                            <h3 className="text-[22px] md:text-[32px] font-serif font-semibold text-[#1a1a1a] dark:text-white leading-tight">
                              Doctoringo Pro
                            </h3>
                          </div>
                        </div>
                        {/* Desktop: icon with rotation */}
                        {!isMobile && (
                          <div className="w-12 h-12 rounded-2xl bg-[#033C81] flex items-center justify-center rotate-3">
                            <Zap size={24} className="text-white" />
                          </div>
                        )}
                        {/* Mobile: price on right */}
                        {isMobile && (
                          <div className="text-right">
                            <span className="text-[28px] font-serif font-bold text-[#1a1a1a] dark:text-white tracking-tighter leading-none">
                              {currencySymbol}{price}
                            </span>
                            <span className="block text-[10px] text-[#8e8e8e] font-medium uppercase tracking-wide mt-0.5">
                              / {translate('month', 'month')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Desktop: Price block */}
                      {!isMobile && (
                        <div className="flex items-baseline gap-1 mb-8 pb-8 border-b border-[#e5e5e0] dark:border-white/10">
                          <span className="text-[48px] font-serif font-bold text-[#1a1a1a] dark:text-white tracking-tighter leading-none">
                            {currencySymbol}{price}
                          </span>
                          <span className="text-lg font-serif text-[#8e8e8e] ml-0.5">
                            {currency}
                          </span>
                          <span className="text-[#8e8e8e] ml-2 text-[11px] font-medium uppercase tracking-[0.15em]">
                            / {translate('month', 'month')}
                          </span>
                        </div>
                      )}

                      {/* Features */}
                      {isMobile ? (
                        /* Mobile: compact horizontal pills */
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-[#e5e5e0] dark:border-white/10">
                          {features.slice(0, 4).map(({ icon: Icon, text }, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1.5 bg-[#f3f2ee] dark:bg-[#1a1a1a] rounded-full px-3 py-1.5"
                            >
                              <Icon size={12} className="text-[#033C81] shrink-0" />
                              <span className="text-[11px] text-[#676767] dark:text-[#8e8e8e] whitespace-nowrap">
                                {text}
                              </span>
                            </div>
                          ))}
                          {features.length > 4 && (
                            <div className="flex items-center bg-[#033C81]/10 rounded-full px-3 py-1.5">
                              <span className="text-[11px] font-medium text-[#033C81]">
                                +{features.length - 4} {translate('more', 'more')}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Desktop: full grid */
                        <div className="grid grid-cols-2 gap-3">
                          {features.map(({ icon: Icon, text }, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * index }}
                              className="flex items-center gap-3"
                            >
                              <div className="w-7 h-7 rounded-lg bg-[#033C81]/10 dark:bg-[#033C81]/15 flex items-center justify-center shrink-0">
                                <Icon size={14} className="text-[#033C81]" />
                              </div>
                              <span className="text-[13px] text-[#676767] dark:text-[#8e8e8e] leading-snug">
                                {text}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Badge - Desktop only */}
                  {!isMobile && (
                    <div className="bg-white dark:bg-[#121212] rounded-[28px] p-5 border border-[#e5e5e0] dark:border-white/10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#f3f2ee] dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
                        <Shield size={20} className="text-[#033C81]" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-[#1a1a1a] dark:text-white block">
                          {translate('secure_payment', 'Secure Payment')}
                        </span>
                        <span className="text-[12px] text-[#8e8e8e]">
                          {translate('secure_payment_desc', 'Protected with SSL encryption via Flitt')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Payment Settings (2 cols on desktop) */}
                <div className={`${isMobile ? '' : 'md:col-span-2'} flex flex-col gap-4 md:gap-5`}>
                  <div className="bg-white dark:bg-[#121212] rounded-[28px] p-5 md:p-6 border border-[#e5e5e0] dark:border-white/10">
                    <h4 className="text-[12px] md:text-[13px] uppercase tracking-[0.15em] font-semibold text-[#8e8e8e] mb-3 md:mb-4">
                      {translate('payment_options', 'Payment Options')}
                    </h4>

                    <div className="flex flex-col gap-2.5 md:gap-3">
                      {/* Save Card */}
                      <label
                        role="checkbox"
                        aria-checked={saveCard}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleSaveCardChange(!saveCard) }}}
                        onClick={() => handleSaveCardChange(!saveCard)}
                        className={`flex items-center gap-3 p-3.5 md:p-4 rounded-2xl cursor-pointer transition-all border ${
                          saveCard
                            ? 'bg-[#f3f2ee] dark:bg-[#1a1a1a] border-[#033C81]/30'
                            : 'bg-transparent border-[#e5e5e0] dark:border-white/10 hover:border-[#d0d0d0] dark:hover:border-white/20'
                        }`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          saveCard
                            ? 'border-[#033C81] bg-[#033C81]'
                            : 'border-[#d9d9d9] dark:border-[#5c5c5c] bg-transparent'
                        }`}>
                          {saveCard && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-[13px] text-[#1a1a1a] dark:text-white block leading-tight">
                            {translate('save_card', 'Save Card')}
                          </span>
                          <span className="text-[11px] text-[#8e8e8e] block">
                            {translate('save_card_desc', 'For future payments')}
                          </span>
                        </div>
                        <CreditCard size={16} className="text-[#8e8e8e] shrink-0" />
                      </label>

                      {/* Auto Renew */}
                      <label
                        role="checkbox"
                        aria-checked={autoRenew}
                        aria-disabled={!saveCard}
                        tabIndex={saveCard ? 0 : -1}
                        onKeyDown={(e) => { if (saveCard && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); handleAutoRenewChange(!autoRenew) }}}
                        onClick={() => saveCard && handleAutoRenewChange(!autoRenew)}
                        className={`flex items-center gap-3 p-3.5 md:p-4 rounded-2xl transition-all border ${
                          saveCard ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                        } ${
                          autoRenew
                            ? 'bg-[#f3f2ee] dark:bg-[#1a1a1a] border-[#033C81]/30'
                            : 'bg-transparent border-[#e5e5e0] dark:border-white/10 hover:border-[#d0d0d0] dark:hover:border-white/20'
                        }`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          autoRenew
                            ? 'border-[#033C81] bg-[#033C81]'
                            : 'border-[#d9d9d9] dark:border-[#5c5c5c] bg-transparent'
                        }`}>
                          {autoRenew && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-[13px] text-[#1a1a1a] dark:text-white block leading-tight">
                            {translate('auto_renew', 'Auto-Renew')}
                          </span>
                          <span className="text-[11px] text-[#8e8e8e] block">
                            {translate('auto_renew_desc', 'Renews automatically every 30 days')}
                          </span>
                        </div>
                        <RefreshCw size={15} className="text-[#8e8e8e] shrink-0" />
                      </label>
                    </div>

                    {/* Order Total */}
                    <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-[#e5e5e0] dark:border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[12px] md:text-[13px] text-[#676767] dark:text-[#8e8e8e]">
                          Doctoringo Pro ({translate('monthly', 'Monthly')})
                        </span>
                        <span className="text-[12px] md:text-[13px] font-medium text-[#1a1a1a] dark:text-white">
                          {currencySymbol}{price}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#e5e5e0] dark:border-white/10">
                        <span className="text-[13px] md:text-sm font-semibold text-[#1a1a1a] dark:text-white">
                          {translate('total', 'Total')}
                        </span>
                        <span className="text-base md:text-lg font-serif font-bold text-[#1a1a1a] dark:text-white">
                          {currencySymbol}{price} <span className="text-[10px] md:text-[11px] font-sans font-normal text-[#8e8e8e]">{currency}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={initializePayment}
                      disabled={loading}
                      className="w-full mt-5 md:mt-6 py-3.5 md:py-4 rounded-[20px] text-[13px] md:text-[14px] font-bold uppercase tracking-[0.15em] bg-black dark:bg-white text-white dark:text-black shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {translate('proceed_to_payment', 'Proceed to Payment')}
                    </button>
                  </div>

                  {/* Mobile Security */}
                  {isMobile && (
                    <div className="flex justify-center items-center gap-2 pb-2">
                      <Shield size={13} className="text-[#8e8e8e]" />
                      <span className="text-[10px] text-[#8e8e8e]">
                        {translate('secure_payment_desc', 'Protected with SSL encryption via Flitt')}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && !paymentData && !sdkError && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <div className={`${isMobile ? 'w-full max-w-[480px]' : 'w-[480px]'} bg-white dark:bg-[#121212] rounded-[28px] p-10 md:p-14 border border-[#e5e5e0] dark:border-white/10 text-center`}>
                  <div className="w-14 h-14 rounded-2xl bg-[#033C81]/10 flex items-center justify-center mx-auto mb-5">
                    <Loader2 className="w-7 h-7 text-[#033C81] animate-spin" />
                  </div>
                  <h4 className="text-lg font-serif font-medium text-[#1a1a1a] dark:text-white mb-2">
                    {translate('preparing_checkout', 'Preparing...')}
                  </h4>
                  <p className="text-[13px] text-[#8e8e8e]">
                    {translate('connecting_payment', 'Connecting to payment system')}
                  </p>
                </div>
              </motion.div>
            )}

            {/* SDK Error State */}
            {sdkError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <div className={`${isMobile ? 'w-full max-w-[480px]' : 'w-[480px]'} bg-white dark:bg-[#121212] rounded-[28px] p-10 md:p-14 border border-[#e5e5e0] dark:border-white/10 text-center`}>
                  <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                    <span className="text-2xl">!</span>
                  </div>
                  <h4 className="text-lg font-serif font-medium text-[#1a1a1a] dark:text-white mb-2">
                    {translate('payment_form_error', 'Payment form failed to load')}
                  </h4>
                  <p className="text-sm text-[#8e8e8e] mb-6">
                    {translate('try_refresh', 'Please refresh the page or try again later')}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3.5 rounded-[20px] text-[14px] font-bold uppercase tracking-[0.15em] bg-black dark:bg-white text-white dark:text-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {translate('refresh_page', 'Refresh Page')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Flitt Checkout Container */}
            {paymentData && (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <div className={`w-full ${isMobile ? 'max-w-[480px]' : 'max-w-[520px]'}`}>
                  <div className="bg-white dark:bg-[#121212] rounded-[28px] p-5 md:p-7 border border-[#e5e5e0] dark:border-white/10">
                    {/* Mini order summary */}
                    <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#e5e5e0] dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#033C81] flex items-center justify-center">
                          <Zap size={18} className="text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#1a1a1a] dark:text-white block">Doctoringo Pro</span>
                          <span className="text-[11px] text-[#8e8e8e]">{translate('monthly_subscription', 'Monthly subscription')}</span>
                        </div>
                      </div>
                      <span className="text-lg font-serif font-bold text-[#1a1a1a] dark:text-white">
                        {currencySymbol}{price}
                      </span>
                    </div>

                    <div id="flitt-checkout-container" ref={checkoutRef} style={{ minHeight: isMobile ? '300px' : '400px' }} />
                  </div>

                  {/* Security footer */}
                  <div className="flex justify-center items-center gap-2 mt-4 py-2">
                    <Lock size={12} className="text-[#8e8e8e]" />
                    <span className="text-[11px] text-[#8e8e8e]">
                      {translate('secure_payment_desc', 'Protected with SSL encryption via Flitt')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
