import { Button } from 'src/components/ui'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'src/providers/ThemeContext'
import { useTranslation } from 'src/providers/TranslationProvider'
import { AuthUser } from 'src/providers/AuthProvider'

interface HeaderDropdownProps {
    user: AuthUser | null
}

const HeaderDropdown = ({ user }: HeaderDropdownProps) => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const { translate } = useTranslation()

  // ChatGPT-style colors
  const bgColor = isDarkMode ? '#2f2f2f' : '#ffffff'
  const textColor = isDarkMode ? '#ececec' : '#1a1a1a'
  const secondaryTextColor = isDarkMode ? '#a0a0a0' : '#666666'
  const borderColor = isDarkMode ? '#424242' : '#e5e5e5'

  return (
    <div style={{
      backgroundColor: bgColor,
      borderRadius: '16px',
      padding: '12px',
      minWidth: '260px',
      boxShadow: isDarkMode
        ? '0 4px 24px rgba(0, 0, 0, 0.4)'
        : '0 4px 24px rgba(0, 0, 0, 0.12)',
      border: `1px solid ${borderColor}`
    }}>
      {user ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 4px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: textColor,
              margin: 0
            }}>Doctoringo Pro</h4>
            <p style={{
              fontSize: '12px',
              color: secondaryTextColor,
              margin: '4px 0 0 0'
            }}>
              {translate('advanced_legal_ai', 'მოწინავე AI ასისტენტი')}
            </p>
          </div>
          <Button
            type='primary'
            onClick={() => navigate('/pricing')}
            size='small'
            style={{
              fontWeight: 600,
              fontSize: '13px',
              marginLeft: '12px',
              borderRadius: '20px',
              backgroundColor: '#000000',
              border: 'none'
            }}
          >
            {translate('upgrade', 'გაუმჯობესება')}
          </Button>
        </div>
      ) : (
        <div style={{ padding: '8px 4px' }}>
          <h4 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: textColor,
            margin: '0 0 8px 0'
          }}>
            {translate('welcome_to_knowhow', 'კეთილი იყოს თქვენი მობრძანება')}
          </h4>
          <p style={{
            fontSize: '13px',
            color: secondaryTextColor,
            margin: '0 0 16px 0',
            lineHeight: 1.5
          }}>
            {translate('login_for_full_access', 'შედით ანგარიშზე სრული ფუნქციონალისთვის')}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type='primary'
              onClick={() => navigate('/login')}
              style={{
                borderRadius: '20px',
                fontWeight: 500,
                backgroundColor: '#000000',
                border: 'none'
              }}
            >
              {translate('log_in', 'შესვლა')}
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              style={{
                borderRadius: '20px',
                fontWeight: 500,
                borderColor: borderColor,
                color: textColor
              }}
            >
              {translate('sign_up', 'რეგისტრაცია')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HeaderDropdown
