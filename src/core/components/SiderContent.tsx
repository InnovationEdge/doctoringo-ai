import { useNavigate } from 'react-router-dom'
import { useState, useCallback, memo, useRef, useEffect } from 'react'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'
import { useAuth } from 'src/providers/AuthProvider'
import { LanguageType } from 'core/types'
import ChatHistoryWithGroups from './ChatHistoryWithGroups'
import SearchChatsModal from './SearchChatsModal'
import knowhowLogoLight from 'src/assets/media/images/knowhow-logo-light.png'
import knowhowLogoDark from 'src/assets/media/images/knowhow-logo-dark.png'
import 'src/assets/css/sidebar.css'

// Modern minimalistic icons - thin, elegant strokes
const NewChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 8v6" />
    <path d="M9 11h6" />
  </svg>
)

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
)

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
)

const SidebarToggleIcon = ({ collapsed }: { collapsed?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    {collapsed ? (
      <path d="m14 9 3 3-3 3" />
    ) : (
      <path d="m16 9-3 3 3 3" />
    )}
  </svg>
)

const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
)

const CreditCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const UpgradeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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

interface SiderContentProps {
  collapsed: boolean
  onSessionSelect?: (sessionId: string) => void
  activeSessionId?: string | null
  onToggleCollapse?: () => void
}

const SiderContent = ({
  collapsed,
  onSessionSelect,
  activeSessionId,
  onToggleCollapse
}: SiderContentProps) => {
  const navigate = useNavigate()
  const { translate, changeLanguage, selectedLanguage } = useTranslation()
  const { isDarkMode, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isPremium = user?.subscription?.is_paid && user?.subscription?.is_active

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
        setLanguageMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        setLanguageMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleNewChat = useCallback(() => {
    if (isCreatingChat) return
    setIsCreatingChat(true)
    try {
      if (onSessionSelect) onSessionSelect('')
      navigate('/')
      setTimeout(() => window.dispatchEvent(new Event('reset-chat')), 50)
    } finally {
      setTimeout(() => setIsCreatingChat(false), 300)
    }
  }, [isCreatingChat, navigate, onSessionSelect])

  const handleSearchClick = useCallback(() => {
    setSearchModalVisible(true)
  }, [])

  const handleLanguageChange = (lang: LanguageType) => {
    changeLanguage(lang)
    setLanguageMenuOpen(false)
    setUserMenuOpen(false)
  }

  const logoSrc = isDarkMode ? knowhowLogoDark : knowhowLogoLight

  // Collapsed state
  if (collapsed) {
    return (
      <div className="sidebar-container collapsed" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Toggle button */}
          <button
            type='button'
            className="sidebar-icon-btn"
            onClick={onToggleCollapse}
            style={{ width: 36, height: 36 }}
          >
            <SidebarToggleIcon collapsed />
          </button>

          {/* New chat button - collapsed */}
          <button
            type='button'
            className="sidebar-icon-btn"
            onClick={handleNewChat}
            disabled={isCreatingChat}
            style={{ width: 36, height: 36, marginTop: 8 }}
            title={translate('new_chat', 'ახალი ჩატი')}
          >
            <NewChatIcon />
          </button>
        </div>

        {/* User avatar - collapsed */}
        <button
          type='button'
          className="sidebar-icon-btn"
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login')
            } else {
              onToggleCollapse?.()
            }
          }}
          style={{ width: 36, height: 36, marginBottom: 8 }}
          title={isAuthenticated ? (user?.first_name || 'Profile') : translate('log_in', 'შესვლა')}
        >
          <div className="sidebar-user-avatar" style={{ width: 28, height: 28 }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <UserIcon />
            )}
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="sidebar-container">
      {/* Header: Logo (Grok-style) + Toggle */}
      <div className="sidebar-header">
        {/* Left: Logo only - Grok style */}
        <button
          type='button'
          className="sidebar-logo-btn grok-style"
          onClick={() => {
            if (onSessionSelect) onSessionSelect('')
            navigate('/')
            setTimeout(() => window.dispatchEvent(new Event('reset-chat')), 50)
          }}
        >
          <img src={logoSrc} alt="Doctoringo" />
        </button>

        {/* Right: Sidebar toggle */}
        <button
          type='button'
          className="sidebar-icon-btn"
          onClick={onToggleCollapse}
          style={{ width: 32, height: 32 }}
        >
          <SidebarToggleIcon collapsed={false} />
        </button>
      </div>

      {/* Menu items */}
      <div className="sidebar-menu-section">
        {/* New chat button */}
        <button
          type='button'
          className="sidebar-menu-btn"
          onClick={handleNewChat}
          disabled={isCreatingChat}
        >
          <NewChatIcon />
          <span>{translate('new_chat', 'ახალი ჩატი')}</span>
        </button>

        {/* Search chats */}
        <button
          type='button'
          className="sidebar-menu-btn"
          onClick={handleSearchClick}
        >
          <SearchIcon />
          <span>{translate('search_chats', 'ჩატების ძიება')}</span>
        </button>

        {/* Documents */}
        <button
          type='button'
          className="sidebar-menu-btn"
          onClick={() => navigate('/documents')}
        >
          <DocumentIcon />
          <span>{translate('documents', 'დოკუმენტები')}</span>
        </button>
      </div>

      {/* Divider + Your chats header */}
      <div className="sidebar-section-header">
        <div className="sidebar-section-header-inner">
          <span className="sidebar-section-title">
            {translate('your_chats', 'თქვენი ჩატები')}
          </span>
        </div>
      </div>

      {/* Chat History */}
      <div className="sidebar-chat-history">
        <ChatHistoryWithGroups
          collapsed={collapsed}
          onSessionSelect={onSessionSelect || (() => {})}
          activeSessionId={activeSessionId || null}
          searchQuery=''
        />
      </div>

      {/* Upgrade banner for free users */}
      {isAuthenticated && !isPremium && (
        <div className="sidebar-upgrade-banner">
          <div className="sidebar-upgrade-text">
            <span className="sidebar-upgrade-title">{translate('upgrade_to_pro', 'გადავიდე Pro-ზე')}</span>
            <span className="sidebar-upgrade-desc">{translate('unlock_premium_features', 'განბლოკე პრემიუმ ფუნქციები')}</span>
          </div>
          <button
            type="button"
            className="sidebar-upgrade-btn"
            onClick={() => navigate('/pricing')}
          >
            {translate('upgrade', 'განახლება')} — ₾49/{translate('month', 'თვე')}
          </button>
        </div>
      )}

      {/* User section with dropdown */}
      <div className="sidebar-user-section" ref={userMenuRef}>
        {/* User Menu Dropdown - opens upward */}
        {userMenuOpen && isAuthenticated && (
          <div className="sidebar-user-dropdown">
            {/* User info header */}
            <div className="sidebar-dropdown-header">
              <p className="sidebar-dropdown-name">
                {user?.first_name} {user?.last_name}
                {isPremium && (
                  <span className="sidebar-pro-badge">PRO</span>
                )}
              </p>
              <p className="sidebar-dropdown-email">{user?.email}</p>
            </div>

            <div className="sidebar-dropdown-divider" />

            {/* Upgrade option (if not premium) */}
            {!isPremium && (
              <button
                type="button"
                className="sidebar-dropdown-item"
                onClick={() => {
                  navigate('/pricing')
                  setUserMenuOpen(false)
                }}
              >
                <UpgradeIcon />
                <span>{translate('upgrade_plan', 'პაკეტის განახლება')}</span>
              </button>
            )}

            {/* Billing (if premium) */}
            {isPremium && (
              <button
                type="button"
                className="sidebar-dropdown-item"
                onClick={() => {
                  navigate('/billing')
                  setUserMenuOpen(false)
                }}
              >
                <CreditCardIcon />
                <span>{translate('billing', 'ბილინგი')}</span>
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              type="button"
              className="sidebar-dropdown-item"
              onClick={() => {
                toggleTheme()
              }}
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
              <span>{isDarkMode ? translate('light_theme', 'ღია თემა') : translate('dark_theme', 'მუქი თემა')}</span>
            </button>

            {/* Language selector with submenu */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`sidebar-dropdown-item ${languageMenuOpen ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setLanguageMenuOpen(!languageMenuOpen)
                }}
              >
                <GlobeIcon />
                <span>{translate('language', 'ენა')}</span>
                <ChevronUpIcon />
              </button>

              {languageMenuOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  marginBottom: '4px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid #2a2a2a',
                  zIndex: 1002
                }}>
                  <button
                    type="button"
                    className={`sidebar-dropdown-item ${selectedLanguage === LanguageType.GEO ? 'selected' : ''}`}
                    onClick={() => handleLanguageChange(LanguageType.GEO)}
                    style={{ width: '100%' }}
                  >
                    <span style={{ fontSize: '16px' }}>🇬🇪</span>
                    <span>{translate('georgian', 'ქართული')}</span>
                    {selectedLanguage === LanguageType.GEO && <CheckIcon />}
                  </button>
                  <button
                    type="button"
                    className={`sidebar-dropdown-item ${selectedLanguage === LanguageType.ENG ? 'selected' : ''}`}
                    onClick={() => handleLanguageChange(LanguageType.ENG)}
                    style={{ width: '100%' }}
                  >
                    <span style={{ fontSize: '16px' }}>🇺🇸</span>
                    <span>English</span>
                    {selectedLanguage === LanguageType.ENG && <CheckIcon />}
                  </button>
                </div>
              )}
            </div>

            <div className="sidebar-dropdown-divider" />

            {/* Logout */}
            <button
              type="button"
              className="sidebar-dropdown-item logout"
              onClick={() => {
                logout()
                setUserMenuOpen(false)
              }}
            >
              <LogoutIcon />
              <span>{translate('logout', 'გასვლა')}</span>
            </button>
          </div>
        )}

        {/* User button */}
        <button
          type='button'
          className="sidebar-user-btn"
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login')
            } else {
              setUserMenuOpen(!userMenuOpen)
            }
          }}
        >
          {/* Avatar */}
          <div className="sidebar-user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <UserIcon />
            )}
          </div>

          {/* Name */}
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {isAuthenticated ? (user?.first_name || user?.email?.split('@')[0] || 'User') : translate('log_in', 'შესვლა')}
            </div>
            {isAuthenticated && !isPremium && (
              <div className="sidebar-user-plan">Free</div>
            )}
            {isAuthenticated && isPremium && (
              <div className="sidebar-user-plan pro">Pro</div>
            )}
          </div>

          {/* Chevron */}
          {isAuthenticated && (
            <span className="sidebar-user-chevron" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronUpIcon />
            </span>
          )}
        </button>
      </div>

      {/* Search Modal */}
      <SearchChatsModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSessionSelect={(sessionId) => {
          if (onSessionSelect) onSessionSelect(sessionId)
          window.dispatchEvent(new CustomEvent('select-session', { detail: { sessionId } }))
          navigate('/')
        }}
      />
    </div>
  )
}

export default memo(SiderContent)
