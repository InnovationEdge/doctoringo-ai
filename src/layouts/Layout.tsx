import AppHeader from 'src/layouts/AppHeader'
import { useTheme } from 'src/providers/ThemeContext'
import AppSider from 'src/layouts/AppSider'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useIsMobile from 'src/hooks/useMobile'
import { useTranslation } from 'src/providers/TranslationProvider'
import { usePageTracking } from 'src/hooks/usePageTracking'
import { useAuth } from 'src/providers/AuthProvider'
import { usePrivateMode } from 'src/providers/PrivateModeProvider'

// Pages where footer should be hidden (ChatGPT style - disclaimer is in input area)
const HIDE_FOOTER_PATHS = ['/', '/chat']

const AppLayout = () => {
  const { isDarkMode } = useTheme()
  const isMobile = useIsMobile()
  const { translate } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { isPrivateMode } = usePrivateMode()
  const location = useLocation()
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile)

  // Check if footer should be hidden on current page
  const hideFooter = HIDE_FOOTER_PATHS.includes(location.pathname)

  // Track page views automatically
  usePageTracking()

  useEffect(() => {
    setSidebarVisible(!isMobile)
  }, [isMobile])

  // Load PDFs from static public URLs (not bundled in JS) - 226KB savings
  const handleDownloadTerms = () => {
    const link = document.createElement('a')
    link.href = '/static/documents/terms_of_service.pdf'
    link.download = 'Terms of Service for Know How Assistance LLC.pdf'
    link.click()
  }

  const handleDownloadPrivacy = () => {
    const link = document.createElement('a')
    link.href = '/static/documents/privacy_policy.pdf'
    link.download = 'Privacy Policy for Know How Assistance LLC.pdf'
    link.click()
  }

  // Claude-style colors - cream/warm white for light, dark for dark
  const bgColor = isDarkMode ? '#1a1a1a' : '#faf9f5'
  const textColor = isDarkMode ? '#8e8e8e' : '#666666'
  const linkColor = isDarkMode ? '#ececec' : '#1a1a1a'

  return (
    <div style={{
      minHeight: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex'
    }}>
      {/* Only show sidebar for authenticated users when not in private mode */}
      {isAuthenticated && !isPrivateMode && (
        <AppSider
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
        />
      )}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          transition: 'margin-left 0.2s ease-out',
          backgroundColor: bgColor,
          marginLeft: (isAuthenticated && !isPrivateMode) ? (isMobile ? 0 : (sidebarVisible ? 280 : 60)) : 0,
          color: isDarkMode ? '#ececec' : '#1a1a1a'
        }}
      >
        {/* Only show header for authenticated users */}
        {isAuthenticated && (
          <AppHeader
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
            isAuthenticated={isAuthenticated}
          />
        )}
        <main
          className="inner-content custom-scrollbar"
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0
          }}
        >
          <Outlet />
        </main>
        {!hideFooter && (
          <footer
            style={{
              textAlign: 'center',
              padding: '12px 16px',
              fontSize: '13px',
              backgroundColor: bgColor
            }}
          >
            <span style={{ color: textColor }}>
              © 2025 Doctoringo AI. {translate('by_using_this_service', 'ამ სერვისის გამოყენებით, თქვენ ეთანხმებით ჩვენს')}{' '}
              <span
                onClick={handleDownloadTerms}
                style={{
                  color: linkColor,
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px'
                }}
              >
                {translate('terms_of_service', 'მომსახურების პირობებს')}
              </span>{' '}
              {translate('and_conjunction', 'და')}{' '}
              <span
                onClick={handleDownloadPrivacy}
                style={{
                  color: linkColor,
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px'
                }}
              >
                {translate('privacy_policy_short', 'კონფიდენციალურობის პოლიტიკას')}
              </span>.
            </span>
          </footer>
        )}
      </div>
    </div>
  )
}

export default AppLayout
