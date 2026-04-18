import Language from 'src/modules/menu/views/Language'
import { Dispatch, SetStateAction } from 'react'
import { useTheme } from 'src/providers/ThemeContext'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useAuth } from 'src/providers/AuthProvider'
import { Drawer } from 'src/components/ui'
import 'src/assets/css/sidebar.css'

// Modern minimalistic icons using currentColor
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

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const ZapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

interface HeaderBurgerMenuProps {
    visible: boolean
    setVisible: Dispatch<SetStateAction<boolean>>
    isPremium?: boolean
    onUpgrade?: () => void
}

const HeaderBurgerMenu = ({ visible, setVisible, isPremium, onUpgrade }: HeaderBurgerMenuProps) => {
  const { isDarkMode, toggleTheme } = useTheme()
  const { translate } = useTranslation()
  const { user, logout } = useAuth()

  const menuItems = [
    ...(!isPremium && onUpgrade ? [{
      key: 'upgrade',
      isUpgrade: true as const,
      icon: <ZapIcon />,
      label: translate('upgrade_to_pro', 'Upgrade to Pro'),
      onClick: () => { onUpgrade(); setVisible(false) }
    }] : []),
    {
      key: 'theme',
      icon: isDarkMode ? <SunIcon /> : <MoonIcon />,
      label: isDarkMode ? translate('light_theme', 'თეთრი თემა') : translate('dark_theme', 'ბნელი თემა'),
      onClick: toggleTheme
    },
    {
      key: 'language',
      content: <Language />
    },
    ...(user ? [{
      key: 'logout',
      icon: <LogoutIcon />,
      label: translate('logout', 'გასვლა'),
      onClick: logout
    }] : [])
  ]

  return (
    <Drawer
      open={visible}
      onClose={() => setVisible(false)}
      placement='right'
      width={280}
      title={
        <span style={{
          color: '#2563eb',
          fontWeight: 600,
          fontSize: '16px'
        }}>
          Doctoringo AI
        </span>
      }
    >
      <nav className="burger-menu-nav">
        {menuItems.map((item) => (
          <div key={item.key}>
            {item.content ? (
              <div className="burger-menu-item">
                {item.content}
              </div>
            ) : 'isUpgrade' in item && item.isUpgrade ? (
              <button
                type='button'
                className="burger-menu-btn"
                onClick={item.onClick}
                style={{
                  background: 'linear-gradient(135deg, #033C81 0%, #c47a58 100%)',
                  color: '#fff',
                  borderRadius: '10px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}
              >
                {item.icon && item.icon}
                <span>{item.label}</span>
              </button>
            ) : (
              <button
                type='button'
                className="burger-menu-btn"
                onClick={item.onClick}
              >
                {item.icon && item.icon}
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </nav>
    </Drawer>
  )
}

export default HeaderBurgerMenu
