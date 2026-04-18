import { Tooltip } from 'src/components/ui'
import { useTheme } from 'src/providers/ThemeContext'
import { useState, useEffect } from 'react'
import PersonalPlanCard from 'src/modules/pricing/views/PersonalPlanCard'
import { PlanType } from 'api/pricing/types'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'src/providers/AuthProvider'
import { trackSubscriptionView } from 'src/utils/firebase'
import googleIcon from 'src/assets/media/svg/google.svg'
import useIsMobile from 'src/hooks/useMobile'
import 'src/assets/css/pricing.css'

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
)

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const Pricing = () => {
  const { isDarkMode, toggleTheme } = useTheme()
  const { translate } = useTranslation()
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [planType, setPlanType] = useState<PlanType>(PlanType.PERSONAL)

  // Track pricing page view
  useEffect(() => {
    trackSubscriptionView()
  }, [])

  return (
    <div className="pricing-page">
      {/* Pricing Content */}
      <div className="pricing-content">
        {/* Back button at top-left */}
        <div className={`pricing-back-btn-container ${isMobile ? 'mobile' : ''}`}>
          <button
            type="button"
            className={`pricing-back-btn ${isMobile ? 'mobile' : ''}`}
            onClick={() => navigate(isAuthenticated ? '/' : '/login')}
          >
            <ArrowLeftIcon />
            {translate('back', 'უკან')}
          </button>
        </div>

        {/* Theme toggle at top-right */}
        <div className={`pricing-theme-toggle-container ${isMobile ? 'mobile' : ''}`}>
          <Tooltip title={isDarkMode ? translate('light_theme', 'ღია თემა') : translate('dark_theme', 'მუქი თემა')}>
            <button
              type="button"
              className="pricing-theme-toggle"
              onClick={toggleTheme}
              aria-label={isDarkMode ? translate('switch_to_light_theme', 'ღია თემაზე გადასვლა') : translate('switch_to_dark_theme', 'მუქი თემაზე გადასვლა')}
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </Tooltip>
        </div>

        {/* Main Content */}
        <div className={`pricing-main ${isMobile ? 'mobile' : ''}`}>
          {/* Title */}
          <h1 className={`pricing-title ${isMobile ? 'mobile' : ''}`}>
            {translate('upgrade_your_plan', 'გააუმჯობესეთ თქვენი პაკეტი')}
          </h1>

          <p className="pricing-subtitle">
            {translate('choose_the_perfect_plan', 'აირჩიეთ თქვენთვის შესაფერისი პაკეტი და მიიღეთ წვდომა ყველა ფუნქციაზე')}
          </p>

          {/* Plan Type Toggle */}
          <div className="pricing-toggle-container">
            <button
              type="button"
              className={`pricing-toggle-btn ${planType === PlanType.PERSONAL ? 'active' : ''}`}
              onClick={() => setPlanType(PlanType.PERSONAL)}
            >
              {translate('personal', 'პირადი')}
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${planType === PlanType.BUSINESS ? 'active' : ''}`}
              onClick={() => setPlanType(PlanType.BUSINESS)}
            >
              {translate('business', 'ბიზნესი')}
            </button>
          </div>

          {/* Plan Cards */}
          <PersonalPlanCard planType={planType} />

          {/* Sign up section - only show if not authenticated */}
          {!isAuthenticated && (
            <div className="pricing-signup-section">
              <h3 className="pricing-signup-title">
                {translate('get_started_free', 'დაიწყეთ უფასოდ')}
              </h3>
              <button
                type="button"
                className="pricing-google-btn"
                onClick={e => {
                  e.preventDefault()
                  login()
                }}
              >
                <img src={googleIcon} alt="Google" />
                {translate('continue_with_google', 'Google-ით გაგრძელება')}
              </button>
              <span className="pricing-login-text">
                {translate('already_have_account', 'უკვე გაქვთ ანგარიში')}?{' '}
                <button
                  type="button"
                  className="pricing-login-link"
                  onClick={() => navigate('/login')}
                >
                  {translate('log_in', 'შესვლა')}
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pricing
