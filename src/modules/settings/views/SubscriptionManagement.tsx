import React, { useEffect, useState } from 'react'
import { Button, Modal, message } from 'src/components/ui'
import { paymentApi, SubscriptionStatus, PaymentMethodType } from 'src/api/payment'
import { useAuth } from 'src/providers/AuthProvider'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'

// Icons
const CreditCardIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const CalendarIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const CheckCircleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const CloseCircleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const DeleteIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

const ReloadIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
)

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

const InfoIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

// Helper function to get payment method icon
const getPaymentMethodIcon = (methodType?: PaymentMethodType) => {
  switch (methodType) {
    case 'google_pay':
      return <GoogleIcon size={20} />
    case 'apple_pay':
      return <AppleIcon size={20} />
    case 'card':
    default:
      return <CreditCardIcon size={20} />
  }
}

// Helper function to get payment method label
const getPaymentMethodLabel = (methodType?: PaymentMethodType, translate?: any) => {
  switch (methodType) {
    case 'google_pay':
      return 'Google Pay'
    case 'apple_pay':
      return 'Apple Pay'
    case 'card':
    default:
      return translate ? translate('Card', 'ბარათი') : 'Card'
  }
}

const SubscriptionManagement: React.FC = () => {
  const { refreshSubscription } = useAuth()
  const { translate } = useTranslation()
  const { isDarkMode } = useTheme()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Theme colors
  const textColor = isDarkMode ? '#ececec' : '#0d0d0d'
  const secondaryTextColor = isDarkMode ? '#8e8e8e' : '#666666'
  const cardBgColor = isDarkMode ? '#171717' : '#ffffff'
  const borderColor = isDarkMode ? '#2f2f2f' : '#e5e5e5'

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    setLoading(true)
    try {
      const data = await paymentApi.getSubscriptionStatus()
      setSubscription(data)
    } catch (error) {
      console.error('Failed to load subscription:', error)
      message.error(translate('Failed to load subscription', 'გამოწერის ჩატვირთვა ვერ მოხერხდა'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAutoRenewal = () => {
    Modal.confirm({
      title: translate('Cancel Auto-Renewal?', 'გავაუქმოთ ავტომატური განახლება?'),
      content: translate(
        'Your subscription will remain active until the expiry date, but will not renew automatically.',
        'თქვენი გამოწერა აქტიური დარჩება ვადის ამოწურვამდე, მაგრამ არ განახლდება ავტომატურად.'
      ),
      okText: translate('Yes, Cancel Auto-Renewal', 'დიახ, გავაუქმოთ'),
      cancelText: translate('No, Keep It', 'არა, დავტოვოთ'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setActionLoading('cancel')
        try {
          const updated = await paymentApi.cancelSubscription()
          setSubscription(updated)
          await refreshSubscription()
          message.success(translate('Auto-renewal cancelled', 'ავტომატური განახლება გაუქმდა'))
        } catch (error: any) {
          message.error(error.message || translate('Failed to cancel', 'გაუქმება ვერ მოხერხდა'))
        } finally {
          setActionLoading(null)
        }
      }
    })
  }

  const handleReactivateAutoRenewal = () => {
    Modal.confirm({
      title: translate('Reactivate Auto-Renewal?', 'ხელახლა ჩავრთოთ ავტომატური განახლება?'),
      content: translate(
        'Your subscription will automatically renew every 30 days using your saved card.',
        'თქვენი გამოწერა ავტომატურად განახლდება ყოველ 30 დღეში თქვენი შენახული ბარათით.'
      ),
      okText: translate('Yes, Reactivate', 'დიახ, ჩავართოთ'),
      cancelText: translate('Cancel', 'გაუქმება'),
      onOk: async () => {
        setActionLoading('reactivate')
        try {
          const updated = await paymentApi.reactivateSubscription()
          setSubscription(updated)
          await refreshSubscription()
          message.success(translate('Auto-renewal activated', 'ავტომატური განახლება ჩართულია'))
        } catch (error: any) {
          message.error(error.message || translate('Failed to reactivate', 'ხელახლა ჩართვა ვერ მოხერხდა'))
        } finally {
          setActionLoading(null)
        }
      }
    })
  }

  const handleRemovePaymentMethod = () => {
    Modal.confirm({
      title: translate('Remove Saved Payment Method?', 'წავშალოთ შენახული გადახდის მეთოდი?'),
      content: translate(
        'This will remove your saved payment method and cancel auto-renewal. You can add a new payment method when purchasing your next subscription.',
        'ეს წაშლის თქვენს შენახულ გადახდის მეთოდს და გააუქმებს ავტომატურ განახლებას. შეგიძლიათ დაამატოთ ახალი გადახდის მეთოდი შემდეგი გამოწერის შეძენისას.'
      ),
      okText: translate('Yes, Remove', 'დიახ, წავშალოთ'),
      cancelText: translate('Cancel', 'გაუქმება'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setActionLoading('remove')
        try {
          const updated = await paymentApi.removePaymentMethod()
          setSubscription(updated)
          await refreshSubscription()
          message.success(translate('Payment method removed', 'გადახდის მეთოდი წაშლილია'))
        } catch (error: any) {
          message.error(error.message || translate('Failed to remove', 'წაშლა ვერ მოხერხდა'))
        } finally {
          setActionLoading(null)
        }
      }
    })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '24px',
        backgroundColor: cardBgColor,
        borderRadius: '16px',
        border: `1px solid ${borderColor}`
      }}>
        <h3 style={{ margin: 0, color: textColor, fontSize: '20px', fontWeight: 600 }}>
          {translate('Subscription Management', 'გამოწერის მართვა')}
        </h3>
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (!subscription || subscription.status === 'free') {
    return (
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '24px',
        backgroundColor: cardBgColor,
        borderRadius: '16px',
        border: `1px solid ${borderColor}`
      }}>
        <h3 style={{ margin: '0 0 20px', color: textColor, fontSize: '20px', fontWeight: 600 }}>
          {translate('Subscription Management', 'გამოწერის მართვა')}
        </h3>
        <div style={{
          padding: '16px',
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
          border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'}`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span style={{ color: '#3b82f6', flexShrink: 0 }}><InfoIcon /></span>
          <div>
            <div style={{ fontWeight: 500, color: textColor, marginBottom: '4px' }}>
              {translate('No Active Subscription', 'აქტიური გამოწერა არ არის')}
            </div>
            <div style={{ fontSize: '14px', color: secondaryTextColor }}>
              {translate(
                'You do not have an active subscription. Visit the pricing page to upgrade.',
                'თქვენ არ გაქვთ აქტიური გამოწერა. ეწვიეთ ფასების გვერდს განახლებისთვის.'
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 24px', color: textColor, fontSize: '20px', fontWeight: 600 }}>
        {translate('Subscription Management', 'გამოწერის მართვა')}
      </h3>

      {/* Current Subscription Status */}
      <div style={{
        marginBottom: 24,
        padding: '24px',
        backgroundColor: cardBgColor,
        borderRadius: '16px',
        border: `1px solid ${borderColor}`
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '14px', color: secondaryTextColor, display: 'block', marginBottom: '8px' }}>
              {translate('Current Plan', 'მიმდინარე გეგმა')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h4 style={{ margin: 0, color: textColor, fontSize: '18px', fontWeight: 600 }}>
                {subscription.is_paid ? translate('Premium', 'პრემიუმი') : translate('Free', 'უფასო')}
              </h4>
              {subscription.is_active && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: isDarkMode ? 'rgba(82, 196, 26, 0.15)' : '#f6ffed',
                  color: '#52c41a',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: `1px solid ${isDarkMode ? 'rgba(82, 196, 26, 0.3)' : '#b7eb8f'}`
                }}>
                  {translate('Active', 'აქტიური')}
                </span>
              )}
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: borderColor }} />

          {/* Expiry Date */}
          {subscription.expires_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: isDarkMode ? '#69b1ff' : '#1a73e8' }}><CalendarIcon /></span>
              <div>
                <span style={{ display: 'block', fontSize: '13px', color: secondaryTextColor }}>
                  {translate('Expires On', 'იწურება')}
                </span>
                <span style={{ fontWeight: 500, fontSize: '15px', color: textColor }}>
                  {formatDate(subscription.expires_at)}
                </span>
              </div>
            </div>
          )}

          {/* Auto-Renewal Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {subscription.auto_renew ? (
              <span style={{ color: '#52c41a' }}><CheckCircleIcon /></span>
            ) : (
              <span style={{ color: isDarkMode ? '#5c5c5c' : '#8c8c8c' }}><CloseCircleIcon /></span>
            )}
            <div>
              <span style={{ display: 'block', fontSize: '13px', color: secondaryTextColor }}>
                {translate('Auto-Renewal', 'ავტომატური განახლება')}
              </span>
              <span style={{ fontWeight: 500, fontSize: '15px', color: textColor }}>
                {subscription.auto_renew
                  ? translate('Enabled', 'ჩართულია')
                  : translate('Disabled', 'გამორთულია')}
              </span>
            </div>
          </div>

          {/* Next Billing Date */}
          {subscription.auto_renew && subscription.next_billing_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: isDarkMode ? '#69b1ff' : '#1a73e8' }}><CalendarIcon /></span>
              <div>
                <span style={{ display: 'block', fontSize: '13px', color: secondaryTextColor }}>
                  {translate('Next Billing Date', 'შემდეგი გადახდის თარიღი')}
                </span>
                <span style={{ fontWeight: 500, fontSize: '15px', color: textColor }}>
                  {formatDate(subscription.next_billing_date)}
                </span>
              </div>
            </div>
          )}

          {/* Saved Payment Method */}
          {subscription.has_saved_payment_method && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: textColor }}>{getPaymentMethodIcon(subscription.saved_payment_method_type)}</span>
              <div>
                <span style={{ display: 'block', fontSize: '13px', color: secondaryTextColor }}>
                  {translate('Saved Payment Method', 'შენახული გადახდის მეთოდი')}
                </span>
                <span style={{ fontWeight: 500, fontSize: '15px', color: textColor }}>
                  {getPaymentMethodLabel(subscription.saved_payment_method_type, translate)}
                  {subscription.saved_card_last4 && ` •••• ${subscription.saved_card_last4}`}
                  {subscription.saved_card_brand && subscription.saved_payment_method_type === 'card' && ` (${subscription.saved_card_brand})`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Renewal Alert */}
      {subscription.auto_renew && (
        <div style={{
          marginBottom: 24,
          padding: '16px',
          backgroundColor: isDarkMode ? 'rgba(82, 196, 26, 0.1)' : '#f6ffed',
          border: `1px solid ${isDarkMode ? 'rgba(82, 196, 26, 0.3)' : '#b7eb8f'}`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span style={{ color: '#52c41a', flexShrink: 0 }}><CheckCircleIcon /></span>
          <div>
            <div style={{ fontWeight: 500, color: textColor, marginBottom: '4px' }}>
              {translate('Auto-Renewal Active', 'ავტომატური განახლება აქტიურია')}
            </div>
            <div style={{ fontSize: '14px', color: secondaryTextColor }}>
              {translate(
                'Your subscription will automatically renew every 30 days. You will be charged 49 GEL using your saved card.',
                'თქვენი გამოწერა ავტომატურად განახლდება ყოველ 30 დღეში. თქვენ დაგიკავდებათ 49 ლარი თქვენი შენახული ბარათიდან.'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '24px',
        backgroundColor: cardBgColor,
        borderRadius: '16px',
        border: `1px solid ${borderColor}`
      }}>
        <h4 style={{ margin: '0 0 20px', color: textColor, fontSize: '16px', fontWeight: 600 }}>
          {translate('Manage Subscription', 'გამოწერის მართვა')}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cancel/Reactivate Auto-Renewal */}
          {subscription.is_paid && subscription.has_saved_payment_method && (
            <div>
              {subscription.auto_renew ? (
                <Button
                  variant="default"
                  danger
                  icon={<CloseCircleIcon size={16} />}
                  onClick={handleCancelAutoRenewal}
                  loading={actionLoading === 'cancel'}
                  block
                  size="large"
                >
                  {translate('Cancel Auto-Renewal', 'გავაუქმოთ ავტომატური განახლება')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={<ReloadIcon size={16} />}
                  onClick={handleReactivateAutoRenewal}
                  loading={actionLoading === 'reactivate'}
                  block
                  size="large"
                  className="primary-blue-button-color"
                >
                  {translate('Reactivate Auto-Renewal', 'ხელახლა ჩავართოთ ავტომატური განახლება')}
                </Button>
              )}
              <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '13px', color: secondaryTextColor }}>
                {subscription.auto_renew
                  ? translate(
                      'Your subscription will remain active until the expiry date.',
                      'თქვენი გამოწერა აქტიური დარჩება ვადის ამოწურვამდე.'
                    )
                  : translate(
                      'Subscription will automatically renew using your saved card.',
                      'გამოწერა ავტომატურად განახლდება თქვენი შენახული ბარათით.'
                    )}
              </p>
            </div>
          )}

          {/* Remove Payment Method */}
          {subscription.has_saved_payment_method && (
            <>
              <div style={{ height: '1px', backgroundColor: borderColor }} />
              <div>
                <Button
                  variant="default"
                  danger
                  icon={<DeleteIcon size={16} />}
                  onClick={handleRemovePaymentMethod}
                  loading={actionLoading === 'remove'}
                  block
                  size="large"
                >
                  {translate('Remove Payment Method', 'გადახდის მეთოდის წაშლა')}
                </Button>
                <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '13px', color: secondaryTextColor }}>
                  {translate(
                    'This will also cancel auto-renewal. You can add a new payment method when purchasing your next subscription.',
                    'ეს ასევე გააუქმებს ავტომატურ განახლებას. შეგიძლიათ დაამატოთ ახალი გადახდის მეთოდი შემდეგი გამოწერის შეძენისას.'
                  )}
                </p>
              </div>
            </>
          )}

          {/* No saved payment method message */}
          {!subscription.has_saved_payment_method && subscription.is_paid && (
            <div style={{
              padding: '16px',
              backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
              border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'}`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <span style={{ color: '#3b82f6', flexShrink: 0 }}><InfoIcon /></span>
              <div>
                <div style={{ fontWeight: 500, color: textColor, marginBottom: '4px' }}>
                  {translate('No Saved Payment Method', 'შენახული გადახდის მეთოდი არ არის')}
                </div>
                <div style={{ fontSize: '14px', color: secondaryTextColor }}>
                  {translate(
                    'To enable auto-renewal, purchase a new subscription with "Save payment method" option. Supports cards, Google Pay, and Apple Pay.',
                    'ავტომატური განახლების ჩასართავად, შეიძინეთ ახალი გამოწერა "შევინახოთ გადახდის მეთოდი" ოფციით. მხარდაჭერილია ბარათები, Google Pay და Apple Pay.'
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionManagement
