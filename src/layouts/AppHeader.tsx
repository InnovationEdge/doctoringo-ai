import { useTheme } from 'src/providers/ThemeContext'
import { useTranslation } from 'src/providers/TranslationProvider'
import { Dispatch, SetStateAction, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderBurgerMenu from 'core/components/HeaderBurgerMenu'
import useIsMobile from 'src/hooks/useMobile'
import menuFold from 'src/assets/media/svg/menuFold.svg'
import { useCountry } from 'src/providers/CountryProvider'
import { usePrivateMode } from 'src/providers/PrivateModeProvider'
import { useAuth } from 'src/providers/AuthProvider'
import CountrySelector from 'src/components/CountrySelector'
import { UI_SIZES, getUIColors } from 'src/styles/uiConstants'
import 'src/assets/css/header.css'

// Private mode icon (lock/incognito style)
const PrivateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const MenuIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

interface AppHeaderProps {
    sidebarVisible: boolean
    setSidebarVisible: Dispatch<SetStateAction<boolean>>
    isAuthenticated?: boolean
}

const AppHeader = ({
  setSidebarVisible,
  isAuthenticated = false
}: AppHeaderProps) => {
  const { isDarkMode } = useTheme()
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const isMobile = useIsMobile(1251)

  const { selectedCountry, setSelectedCountry } = useCountry()
  const { isPrivateMode, togglePrivateMode } = usePrivateMode()
  const { user } = useAuth()
  const isPremium = user?.subscription?.is_paid && user?.subscription?.is_active

  // Use shared colors
  const colors = getUIColors(isDarkMode)

  const handleToggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev)
  }, [setSidebarVisible])

  const handleSignIn = useCallback(() => {
    navigate('/login')
  }, [navigate])

  // For unauthenticated users - simple Grok-style header with Sign in/Sign up
  if (!isAuthenticated) {
    return (
      <header
        className='main-header'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          borderBottom: 'none',
          boxShadow: 'none',
          padding: isMobile ? `0 ${UI_SIZES.header.paddingX}px` : `0 ${UI_SIZES.header.paddingXDesktop}px`,
          height: isMobile ? `${UI_SIZES.header.height}px` : `${UI_SIZES.header.heightDesktop}px`,
          lineHeight: isMobile ? `${UI_SIZES.header.height}px` : `${UI_SIZES.header.heightDesktop}px`
        }}
      >
        {/* Left side - empty or just branding for unauthenticated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Country Selector still available */}
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </div>

        {/* Right side - Sign in / Sign up buttons (Grok style) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type='button'
            className='header-signin-btn'
            onClick={handleSignIn}
          >
            {translate('log_in', 'ავტორიზაცია')}
          </button>
          <button
            type='button'
            className='header-signup-btn'
            onClick={handleSignIn}
          >
            {translate('sign_up', 'რეგისტრაცია')}
          </button>
        </div>
      </header>
    )
  }

  // For authenticated users - clean header with sidebar toggle and Private button
  return (
    <header
      className='main-header'
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        borderBottom: 'none',
        boxShadow: 'none',
        padding: isMobile ? `0 ${UI_SIZES.header.paddingX}px` : `0 ${UI_SIZES.header.paddingXDesktop}px`,
        height: isMobile ? `${UI_SIZES.header.height}px` : `${UI_SIZES.header.heightDesktop}px`,
        lineHeight: isMobile ? `${UI_SIZES.header.height}px` : `${UI_SIZES.header.heightDesktop}px`
      }}
    >
      {/* Left side - sidebar toggle (mobile) + Country selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isMobile && (
          <button
            type='button'
            className="header-icon-btn"
            onClick={handleToggleSidebar}
            aria-label={translate('toggle_sidebar', 'გვერდითი მენიუ')}
          >
            <img src={menuFold} alt='menu-fold' className='svg-icon-blue' style={{ width: UI_SIZES.iconButton.iconSize, height: UI_SIZES.iconButton.iconSize }} />
          </button>
        )}
        {/* Legislation/Country Selector */}
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />
      </div>

      {/* Right side - Private button only (Grok style) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile menu button */}
        {isMobile && (
          <button
            type='button'
            className="header-icon-btn"
            onClick={() => setVisible(true)}
            aria-label={translate('menu', 'მენიუ')}
          >
            <MenuIcon color={colors.icon} />
          </button>
        )}

        {/* Upgrade button for free users */}
        {!isPremium && (
          <button
            type='button'
            className='header-upgrade-btn'
            onClick={() => navigate('/pricing')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {translate('upgrade_to_pro', 'Upgrade to Pro')}
          </button>
        )}

        {/* Private mode button - Grok style */}
        <button
          type='button'
          className={`header-private-btn ${isPrivateMode ? 'active' : ''}`}
          onClick={togglePrivateMode}
          title={isPrivateMode ? 'Private mode is on' : 'Enable private mode'}
        >
          <PrivateIcon />
          <span>Private</span>
        </button>
      </div>

      <HeaderBurgerMenu
        setVisible={setVisible}
        visible={visible}
        isPremium={!!isPremium}
        onUpgrade={() => navigate('/pricing')}
      />
    </header>
  )
}

export default AppHeader
