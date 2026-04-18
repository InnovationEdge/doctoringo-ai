import { useNavigate } from 'react-router-dom'
import logoutLogo from 'src/assets/media/svg/logout.svg'
import upgradePlanLogo from 'src/assets/media/svg/upgradePlan.svg'
import { LanguageType } from 'core/types'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useAuth } from 'src/providers/AuthProvider'
import { useTheme } from 'src/providers/ThemeContext'
import { Button, Dropdown } from 'src/components/ui'
import { UI_SIZES } from 'src/styles/uiConstants'

// Modern minimalistic icons - thin, elegant strokes
const GlobalIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const CreditCardIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const HeaderUserDropdown = () => {
  const navigate = useNavigate()
  const { logout , user } = useAuth()
  const { changeLanguage, selectedLanguage, translate } = useTranslation()
  const { isDarkMode } = useTheme()

  // Theme-aware colors
  const colors = {
    text: isDarkMode ? '#ececec' : '#374151',
    textSecondary: isDarkMode ? '#9b9b9b' : '#6b7280',
    icon: isDarkMode ? '#b4b4b4' : '#666666',
    avatarBg: isDarkMode ? '#4b5563' : '#e5e7eb'
  }

  const languageOptions = [
    {
      key: LanguageType.GEO,
      label: translate('georgian', 'ქართული'),
      flag: '🇬🇪'
    },
    {
      key: LanguageType.ENG,
      label: translate('english', 'English'),
      flag: '🇺🇸'
    }
  ]

  const isPremium = user?.subscription?.is_paid && user?.subscription?.is_active

  const userMenuItems = [
    {
      key: '1',
      label: (
        <div style={{ padding: '4px' }}>
          <p style={{ fontWeight: 600, margin: 0, color: colors.text }}>
            {user?.first_name} {user?.last_name}
            {isPremium && (
              <span
                style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                {translate('pro_badge', 'PRO')}
              </span>
            )}
          </p>
          <p style={{ color: colors.textSecondary, margin: 0, fontSize: '13px' }}>{user?.email}</p>
        </div>
      ),
      disabled: true
    },
    ...(!isPremium ? [{
      key: 'upgrade',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={upgradePlanLogo} alt='Upgrade Plan Icon' className='svg-icon-blue' width={20} height={20} />
          {translate('upgrade_plan', 'პაკეტის განახლება')}
        </div>
      ),
      onClick: () => navigate('/pricing')
    }] : []),
    ...(isPremium ? [{
      key: 'billing',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCardIcon color={colors.icon} />
          {translate('billing', 'ბილინგი')}
        </div>
      ),
      onClick: () => navigate('/billing')
    }] : []),
    {
      key: 'language',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GlobalIcon color={colors.icon} />
          {translate('language', 'ენა')}
        </div>
      ),
      children: languageOptions.map(({ key, label, flag }) => ({
        key: `language-${key}`,
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: selectedLanguage === key ? 600 : 400
            }}
          >
            <span style={{ fontSize: '18px' }}>{flag}</span>
            <span>{label}</span>
          </div>
        ),
        onClick: () => changeLanguage(key)
      }))
    },
    {
      key: 'logout',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={logoutLogo} alt='Logout Icon' className='svg-icon-blue' width={20} height={20} />
          {translate('logout', 'გასვლა')}
        </div>
      ),
      onClick: logout
    }
  ]

  // Avatar component
  const Avatar = ({ src, children }: { src?: string | null; children?: React.ReactNode }) => (
    <div style={{
      width: `${UI_SIZES.iconButton.width}px`,
      height: `${UI_SIZES.iconButton.height}px`,
      borderRadius: '50%',
      backgroundColor: colors.avatarBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      fontSize: '14px',
      fontWeight: 500,
      color: colors.text
    }}>
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        children
      )}
    </div>
  )

  return (
    <Dropdown
      menu={{ items: userMenuItems }}
      trigger={['click']}
    >
      <Button type='text' className='p-0 flex items-center'>
        <Avatar src={user?.avatar}>
          {user?.first_name?.[0]}
        </Avatar>
      </Button>
    </Dropdown>
  )
}

export default HeaderUserDropdown
