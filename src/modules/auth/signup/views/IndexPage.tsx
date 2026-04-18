import googleIcon from 'src/assets/media/svg/google.svg'
import knowhowLogoLight from 'src/assets/media/images/knowhow-logo-light.png'
import knowhowLogoDark from 'src/assets/media/images/knowhow-logo-dark.png'
import { useTranslation } from 'src/providers/TranslationProvider'
import useIsMobile from 'src/hooks/useMobile'
import { useAuth } from 'src/providers/AuthProvider'
import { useTheme } from 'src/providers/ThemeContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import 'src/assets/css/auth.css'

const SignUpForm = () => {
  const { translate } = useTranslation()
  const isMobile = useIsMobile()
  const { login, isAuthenticated } = useAuth()
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  return (
    <div className="auth-page">
      {/* Left side - Signup Form */}
      <div className={`auth-form-section ${isMobile ? 'mobile' : ''}`}>
        {/* Logo at top - clickable */}
        <div
          onClick={() => navigate('/')}
          className={`auth-logo-header ${isMobile ? 'mobile' : ''}`}
        >
          <img
            src={isDarkMode ? knowhowLogoDark : knowhowLogoLight}
            alt="Doctoringo AI"
            className="auth-logo-img"
          />
          <span className="auth-logo-text">
            Doctoringo AI
          </span>
        </div>

        {/* Form Content */}
        <div className="auth-form-content">
          {/* Title */}
          <h1 className={`auth-title ${isMobile ? 'mobile' : ''}`}>
            {translate('create_account', 'შექმენით ანგარიში')}
          </h1>

          {/* Google Signup Button */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={e => {
              e.preventDefault()
              login()
            }}
          >
            <img src={googleIcon} alt="Google" />
            {translate('continue_with_google', 'Google-ით გაგრძელება')}
          </button>

          {/* Terms text at bottom */}
          <div className="auth-terms">
            <span className="auth-terms-text">
              {translate('by_using_this_service', 'ამ სერვისის გამოყენებით, თქვენ ეთანხმებით')}{' '}
              <a
                href="/static/documents/terms_of_service.pdf"
                target="_blank"
                className="auth-terms-link"
              >
                {translate('terms_of_service', 'მომსახურების პირობებს')}
              </a>
              {' '}{translate('and_conjunction', 'და')}{' '}
              <a
                href="/static/documents/privacy_policy.pdf"
                target="_blank"
                className="auth-terms-link"
              >
                {translate('privacy_policy_short', 'კონფიდენციალურობის პოლიტიკას')}
              </a>.
            </span>
          </div>
        </div>

        {/* Already have account link - uses same Google OAuth */}
        <div className="auth-bottom-link">
          <span className="auth-bottom-text">
            {translate('already_have_account', 'უკვე გაქვთ ანგარიში')}?{' '}
            <button
              type="button"
              onClick={() => login()}
              className="auth-link-btn"
            >
              {translate('log_in', 'შესვლა')}
            </button>
          </span>
        </div>
      </div>

      {/* Right side - Themed Background (hidden on mobile) */}
      {!isMobile && (
        <div className="auth-hero-section">
          {/* Abstract legal/AI themed background pattern */}
          <div className="auth-hero-pattern">
            {/* Large scales of justice silhouette */}
            <svg viewBox="0 0 400 400" className="auth-hero-svg">
              <defs>
                <linearGradient id="scaleGradientSignup" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#033C81" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#0066cc" stopOpacity="0.4"/>
                </linearGradient>
              </defs>
              {/* Pillar */}
              <rect x="190" y="100" width="20" height="250" fill="url(#scaleGradientSignup)" rx="4"/>
              {/* Top beam */}
              <rect x="80" y="90" width="240" height="16" fill="url(#scaleGradientSignup)" rx="8"/>
              {/* Left chain */}
              <line x1="100" y1="106" x2="100" y2="180" stroke="url(#scaleGradientSignup)" strokeWidth="4"/>
              {/* Right chain */}
              <line x1="300" y1="106" x2="300" y2="180" stroke="url(#scaleGradientSignup)" strokeWidth="4"/>
              {/* Left pan */}
              <ellipse cx="100" cy="200" rx="60" ry="15" fill="url(#scaleGradientSignup)"/>
              <path d="M40 200 Q100 230 160 200" stroke="url(#scaleGradientSignup)" strokeWidth="3" fill="none"/>
              {/* Right pan */}
              <ellipse cx="300" cy="200" rx="60" ry="15" fill="url(#scaleGradientSignup)"/>
              <path d="M240 200 Q300 230 360 200" stroke="url(#scaleGradientSignup)" strokeWidth="3" fill="none"/>
              {/* Base */}
              <rect x="150" y="340" width="100" height="20" fill="url(#scaleGradientSignup)" rx="4"/>
              <polygon points="200,350 130,380 270,380" fill="url(#scaleGradientSignup)"/>
            </svg>
          </div>

          {/* Glowing orb effect */}
          <div className="auth-glow-primary" />

          {/* Secondary glow */}
          <div className="auth-glow-secondary" />

          {/* Central branding */}
          <div className="auth-hero-content">
            <img
              src={knowhowLogoDark}
              alt="Doctoringo AI"
              className="auth-hero-logo"
            />
            <h2 className="auth-hero-title">
              Doctoringo AI
            </h2>
            <p className="auth-hero-subtitle">
              {translate('advanced_legal_ai', 'მოწინავე იურიდიული AI ასისტენტი')}
            </p>
          </div>

          {/* Bottom gradient fade */}
          <div className="auth-hero-fade" />
        </div>
      )}
    </div>
  )
}

export default SignUpForm
