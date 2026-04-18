import { Modal, Button } from 'src/components/ui'
import { useState } from 'react'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'

// Icons
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

interface SubscriptionModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: (autoRenew: boolean, saveCard: boolean) => void
  loading: boolean
}

const SubscriptionModal = ({ visible, onCancel, onConfirm, loading }: SubscriptionModalProps) => {
  const { translate } = useTranslation()
  const { isDarkMode } = useTheme()
  const [saveCard, setSaveCard] = useState(true)
  const [autoRenew, setAutoRenew] = useState(true)

  const textColor = isDarkMode ? '#ffffff' : '#000000'
  const secondaryTextColor = isDarkMode ? '#8e8e8e' : '#666666'

  const handleSaveCardChange = (checked: boolean) => {
    setSaveCard(checked)
    if (!checked) {
      setAutoRenew(false)
    }
  }

  const handleAutoRenewChange = (checked: boolean) => {
    setAutoRenew(checked)
    if (checked) {
      setSaveCard(true)
    }
  }

  const handleConfirm = () => {
    onConfirm(autoRenew, saveCard)
  }

  return (
    <Modal
      open={visible}
      onClose={onCancel}
      title={
        <h4 style={{ margin: 0, color: textColor, fontSize: '18px', fontWeight: 600 }}>
          {translate('subscription_options', 'გამოწერის პარამეტრები')}
        </h4>
      }
      width={500}
      footer={
        <>
          <Button onClick={onCancel}>
            {translate('cancel', 'გაუქმება')}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={loading}
          >
            {translate('proceed_to_payment', 'გადახდაზე გადასვლა')}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Info alert */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
          border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span style={{ color: '#3b82f6', flexShrink: 0 }}><InfoIcon /></span>
          <div>
            <div style={{ fontWeight: 500, color: textColor, marginBottom: '4px' }}>
              {translate('subscription_info', 'თქვენ აპირებთ პრემიუმ გეგმაზე გადასვლას')}
            </div>
            <div style={{ fontSize: '13px', color: secondaryTextColor }}>
              {translate('subscription_desc', 'აირჩიეთ გადახდის პარამეტრები')}
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Save card checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => handleSaveCardChange(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                marginTop: '2px',
                accentColor: '#3b82f6'
              }}
            />
            <div>
              <div style={{ fontWeight: 500, color: textColor }}>
                {translate('save_payment_method', 'გადახდის მეთოდის შენახვა მომავალი გადახდებისთვის')}
              </div>
              <div style={{ fontSize: '12px', color: secondaryTextColor, marginTop: '2px' }}>
                {translate('save_payment_desc', 'მხარდაჭერილია ბარათები, Google Pay და Apple Pay. მონაცემები უსაფრთხოდ ინახება.')}
              </div>
            </div>
          </label>

          {/* Auto renew checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: saveCard ? 'pointer' : 'not-allowed',
            opacity: saveCard ? 1 : 0.5
          }}>
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => handleAutoRenewChange(e.target.checked)}
              disabled={!saveCard}
              style={{
                width: '18px',
                height: '18px',
                marginTop: '2px',
                accentColor: '#3b82f6'
              }}
            />
            <div>
              <div style={{ fontWeight: 500, color: textColor }}>
                {translate('auto_renew_subscription', 'გამოწერის ავტომატური განახლება')}
              </div>
              <div style={{ fontSize: '12px', color: secondaryTextColor, marginTop: '2px' }}>
                {translate('auto_renew_desc', 'თქვენი გამოწერა ავტომატურად განახლდება ყოველთვიურად')}
              </div>
            </div>
          </label>
        </div>

        {/* Warning alert for auto-renew */}
        {autoRenew && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
            border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fcd34d'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ color: '#f59e0b', flexShrink: 0 }}><WarningIcon /></span>
            <div>
              <div style={{ fontWeight: 500, color: textColor, marginBottom: '4px' }}>
                {translate('auto_renew_notice', 'ავტომატური განახლება')}
              </div>
              <div style={{ fontSize: '13px', color: secondaryTextColor }}>
                {translate(
                  'auto_renew_notice_desc',
                  'თქვენი ბარათიდან ავტომატურად ჩამოიჭრება 49 ლარი ყოველი 30 დღის შემდეგ. შეგიძლიათ გააუქმოთ ნებისმიერ დროს პარამეტრებიდან.'
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info alert for one-time payment */}
        {saveCard && !autoRenew && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <span style={{ color: '#3b82f6', flexShrink: 0 }}><InfoIcon /></span>
            <div>
              <div style={{ fontWeight: 500, color: textColor, marginBottom: '4px' }}>
                {translate('one_time_payment', 'ერთჯერადი გადახდა')}
              </div>
              <div style={{ fontSize: '13px', color: secondaryTextColor }}>
                {translate(
                  'one_time_payment_desc',
                  'თქვენი ბარათი შეინახება, მაგრამ ავტომატური გადახდა არ მოხდება. გამოწერა მოქმედებს 30 დღის განმავლობაში.'
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SubscriptionModal
