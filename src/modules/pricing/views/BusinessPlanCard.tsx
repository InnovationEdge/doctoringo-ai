import { Button } from 'src/components/ui'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'
import useIsMobile from 'src/hooks/useMobile'

// Icons
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const RocketIcon = ({ size = 40, color = '#666666' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)

const BusinessPlanCard = () => {
  const { translate } = useTranslation()
  const { isDarkMode } = useTheme()
  const isMobile = useIsMobile()

  // ChatGPT-style colors
  const bgColor = isDarkMode ? '#171717' : '#f7f7f8'
  const borderColor = isDarkMode ? '#2f2f2f' : '#e5e5e5'
  const textColor = isDarkMode ? '#ececec' : '#0d0d0d'
  const secondaryTextColor = isDarkMode ? '#8e8e8e' : '#666666'

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      padding: isMobile ? '12px' : '20px'
    }}>
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          padding: isMobile ? '24px 20px' : '40px 32px',
          textAlign: 'center'
        }}
      >
        <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
          <RocketIcon
            size={isMobile ? 32 : 40}
            color={isDarkMode ? '#a0a0a0' : '#666666'}
          />
        </div>

        <h3 style={{
          fontWeight: 600,
          color: textColor,
          marginBottom: '12px',
          letterSpacing: '-0.02em',
          fontSize: isMobile ? '16px' : '20px'
        }}>
          {translate('business_plans_will_be_available_soon', 'ბიზნეს გეგმები მალე იქნება ხელმისაწვდომი')}
        </h3>

        <p style={{
          color: secondaryTextColor,
          fontSize: isMobile ? '13px' : '15px',
          lineHeight: 1.6,
          marginBottom: isMobile ? '20px' : '32px'
        }}>
          {translate('working_on_special_business_plans', 'ჩვენ ვმუშაობთ სპეციალური ბიზნეს გეგმების შექმნაზე კომპანიებისთვის')}
        </p>

        <div style={{
          padding: isMobile ? '16px' : '20px 24px',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          marginBottom: isMobile ? '16px' : '24px',
          textAlign: 'left'
        }}>
          <span style={{
            display: 'block',
            marginBottom: isMobile ? '12px' : '16px',
            fontSize: isMobile ? '13px' : '14px',
            color: textColor,
            fontWeight: 600
          }}>
            {translate('business_plan_features', 'ბიზნეს პაკეტის მახასიათებლები')}:
          </span>
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}>
            {[
              translate('team_access', 'გუნდური წვდომა'),
              translate('priority_support', 'პრიორიტეტული მხარდაჭერა'),
              translate('custom_integrations', 'მორგებული ინტეგრაციები'),
              translate('advanced_analytics', 'გაფართოებული ანალიტიკა')
            ].map((feature, index) => (
              <li key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '10px',
                marginBottom: index < 3 ? (isMobile ? '8px' : '10px') : 0,
                color: secondaryTextColor,
                fontSize: isMobile ? '12px' : '14px'
              }}>
                <span style={{ color: isDarkMode ? '#52c41a' : '#389e0d' }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button
          size={isMobile ? 'medium' : 'large'}
          icon={<MailIcon />}
          onClick={() => window.location.href = 'mailto:knowhowaiassistant@gmail.com'}
          style={{
            height: isMobile ? '40px' : '48px',
            borderRadius: '24px',
            fontSize: isMobile ? '13px' : '15px',
            fontWeight: 500,
            backgroundColor: isDarkMode ? '#ffffff' : '#000000',
            borderColor: isDarkMode ? '#ffffff' : '#000000',
            color: isDarkMode ? '#000000' : '#ffffff',
            boxShadow: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: isMobile ? '0 20px' : '0 24px'
          }}
        >
          {translate('contact_us', 'დაგვიკავშირდით')}
        </Button>

        <div style={{ marginTop: isMobile ? '12px' : '16px' }}>
          <span style={{
            fontSize: isMobile ? '11px' : '13px',
            color: secondaryTextColor
          }}>
            knowhowaiassistant@gmail.com
          </span>
        </div>
      </div>
    </div>
  )
}

export default BusinessPlanCard
