import googleIcon from 'src/assets/media/svg/google.svg'
import lawyerHero from 'src/assets/media/lawyer-hero.png'
import { useTranslation } from 'src/providers/TranslationProvider'
import useIsMobile from 'src/hooks/useMobile'
import { useAuth } from 'src/providers/AuthProvider'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import 'src/assets/css/auth.css'

const LoginForm = () => {
  const { translate } = useTranslation()
  const isMobile = useIsMobile()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated, navigate])

  return (
    <div className="auth-page-claude">
      {/* Powered by Google Cloud badge - top left */}
      <div className="auth-powered-badge">
        <img
          src="https://www.gstatic.com/images/branding/product/2x/google_cloud_64dp.png"
          alt="Google Cloud"
          className="auth-powered-badge-icon"
        />
        <span className="auth-powered-badge-text">Powered by Google Cloud</span>
      </div>

      {/* Left side - Login Content */}
      <div className={`auth-left-section ${isMobile ? 'mobile' : ''}`}>
        {/* Main content centered */}
        <div className="auth-content-wrapper">
          {/* Tagline - Claude style */}
          <div className="auth-tagline">
            <h1 className="auth-tagline-title">
              {translate('tagline_line1', 'კანონი?')}
              <br />
              {translate('tagline_line2', 'აგიხსნი.')}
            </h1>
            <p className="auth-tagline-subtitle">
              {translate('tagline_description', 'AI იურიდიული ასისტენტი')}
            </p>
          </div>

          {/* Login box */}
          <div className="auth-login-box">
            {/* Google Login Button */}
            <button
              type="button"
              className="auth-google-btn-claude"
              onClick={e => {
                e.preventDefault()
                login()
              }}
            >
              <img src={googleIcon} alt="Google" />
              {translate('continue_with_google', 'Google-ით გაგრძელება')}
            </button>

            {/* Terms text */}
            <p className="auth-terms-claude">
              {translate('by_continuing', 'გაგრძელებით ეთანხმებით')}{' '}
              <a
                href="/static/documents/privacy_policy.pdf"
                target="_blank"
                className="auth-terms-link-claude"
              >
                {translate('privacy_policy_short', 'კონფიდენციალურობის პოლიტიკას')}
              </a>.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image (hidden on mobile) */}
      {!isMobile && (
        <div className="auth-right-section">
          <img
            src={lawyerHero}
            alt="Professional lawyer"
            className="auth-hero-image"
          />
        </div>
      )}
    </div>
  )
}

export default LoginForm
