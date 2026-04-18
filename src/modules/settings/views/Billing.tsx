import React, { useEffect, useState, useCallback } from 'react'
import { Modal, message } from 'src/components/ui'
import { paymentApi, SubscriptionStatus, Payment, PaymentMethodType } from 'src/api/payment'
import { useAuth } from 'src/providers/AuthProvider'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from 'src/core/components/LoadingSpinner'
import 'src/assets/css/billing.css'

// Icons
const CreditCardIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const DeleteIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
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

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ArrowLeftIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
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

const Billing: React.FC = () => {
  const { refreshSubscription } = useAuth()
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [subscriptionData] = await Promise.all([
        paymentApi.getSubscriptionStatus(),
        loadPayments()
      ])
      setSubscription(subscriptionData)
    } catch {
      message.error(translate('Failed to load billing data', 'ბილინგის მონაცემების ჩატვირთვა ვერ მოხერხდა'))
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    setPaymentsLoading(true)
    try {
      const data = await paymentApi.getPaymentHistory()
      setPayments(data)
      return data
    } catch {
      return []
    } finally {
      setPaymentsLoading(false)
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
        'Your subscription will automatically renew every 30 days using your saved payment method.',
        'თქვენი გამოწერა ავტომატურად განახლდება ყოველ 30 დღეში თქვენი შენახული გადახდის მეთოდით.'
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
        'This will remove your saved payment method and cancel auto-renewal.',
        'ეს წაშლის თქვენს შენახულ გადახდის მეთოდს და გააუქმებს ავტომატურ განახლებას.'
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

  // Memoize formatters to prevent recreation
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ka-GE', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [])

  const formatAmount = useCallback((amount?: number | string) => {
    if (!amount) return '-'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `₾${num.toFixed(2)}`
  }, [])

  const getStatusTag = useCallback((status?: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="billing-status-tag success">
            <CheckIcon size={12} />
            {translate('Paid', 'გადახდილია')}
          </span>
        )
      case 'pending':
        return (
          <span className="billing-status-tag pending">
            {translate('Pending', 'მიმდინარე')}
          </span>
        )
      case 'failed':
        return (
          <span className="billing-status-tag failed">
            {translate('Failed', 'წარუმატებელი')}
          </span>
        )
      default:
        return (
          <span className="billing-status-tag">
            {status}
          </span>
        )
    }
  }, [translate])

  if (loading) {
    return (
      <div className="billing-page loading">
        <div className="billing-card">
          <h3 className="billing-history-title">
            {translate('Billing', 'ბილინგი')}
          </h3>
          <div className="billing-empty">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  if (!subscription || subscription.status === 'free') {
    return (
      <div className="billing-page loading">
        <div className="billing-header">
          <button
            type="button"
            className="billing-back-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeftIcon size={20} />
            {translate('back', 'უკან')}
          </button>
          <h2>{translate('Billing', 'ბილინგი')}</h2>
        </div>
        <div className="billing-card">
          <div className="billing-info-alert">
            <span className="billing-info-alert-icon"><InfoIcon /></span>
            <div>
              <div className="billing-info-alert-title">
                {translate('No Active Subscription', 'აქტიური გამოწერა არ არის')}
              </div>
              <div className="billing-info-alert-text">
                {translate(
                  'You do not have an active subscription. Visit the pricing page to upgrade.',
                  'თქვენ არ გაქვთ აქტიური გამოწერა. ეწვიეთ ფასების გვერდს განახლებისთვის.'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="billing-page">
      <div className="billing-header">
        <button
          type="button"
          className="billing-back-btn"
          onClick={() => navigate('/')}
        >
          <ArrowLeftIcon size={20} />
          {translate('back', 'უკან')}
        </button>
        <h2>{translate('Billing & Subscription', 'ბილინგი და გამოწერა')}</h2>
      </div>

      {/* Current Plan Card */}
      <div className="billing-card">
        <div style={{ marginBottom: 28 }}>
          <span className="billing-plan-label">
            {translate('Current Plan', 'მიმდინარე გეგმა')}
          </span>
          <div className="billing-plan-header">
            <h3 className="billing-plan-title">
              {translate('Pro Plan', 'პრო გეგმა')}
            </h3>
            <span className="billing-status-badge active">
              <CheckIcon size={12} /> {translate('Active', 'აქტიური')}
            </span>
          </div>
          <div className="billing-price">
            <span className="billing-price-amount">₾49</span>
            <span className="billing-price-period">/ {translate('month', 'თვე')}</span>
          </div>
        </div>

        {/* Expiration & Renewal Info */}
        {subscription.expires_at && (
          <div className="billing-info-box">
            <span className="billing-info-label">
              {subscription.auto_renew ? translate('Renews on', 'განახლდება') : translate('Expires on', 'იწურება')}
            </span>
            <span className="billing-info-value">
              {formatDate(subscription.auto_renew ? subscription.next_billing_date : subscription.expires_at)}
            </span>
          </div>
        )}

        <div className="billing-divider" />

        {/* Payment Method */}
        <div style={{ marginBottom: 16 }}>
          <span className="billing-section-label">
            {translate('Payment Method', 'გადახდის მეთოდი')}
          </span>
          {subscription.has_saved_payment_method ? (
            <div className="billing-payment-method">
              <div className="billing-payment-icon">
                {getPaymentMethodIcon(subscription.saved_payment_method_type)}
              </div>
              <div className="billing-payment-info">
                <span className="billing-payment-name">
                  {getPaymentMethodLabel(subscription.saved_payment_method_type, translate)}
                  {subscription.saved_card_last4 && ` •••• ${subscription.saved_card_last4}`}
                </span>
                {subscription.saved_card_brand && subscription.saved_payment_method_type === 'card' && (
                  <span className="billing-payment-brand">
                    {subscription.saved_card_brand}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="billing-remove-btn"
                onClick={handleRemovePaymentMethod}
                disabled={actionLoading === 'remove'}
              >
                <DeleteIcon size={16} />
                {translate('Remove', 'წაშლა')}
              </button>
            </div>
          ) : (
            <div className="billing-no-payment">
              <InfoIcon size={16} />
              {translate('No saved payment method', 'შენახული გადახდის მეთოდი არ არის')}
            </div>
          )}
        </div>

        {/* Auto-Renewal Toggle */}
        {subscription.has_saved_payment_method && (
          <>
            <div className="billing-divider" />
            <div className="billing-auto-renewal">
              <div className="billing-auto-renewal-header">
                <span className="billing-auto-renewal-title">
                  {translate('Auto-Renewal', 'ავტომატური განახლება')}
                </span>
                <button
                  type="button"
                  className={`billing-action-btn ${subscription.auto_renew ? 'danger' : 'primary'}`}
                  onClick={subscription.auto_renew ? handleCancelAutoRenewal : handleReactivateAutoRenewal}
                  disabled={actionLoading === 'cancel' || actionLoading === 'reactivate'}
                >
                  {subscription.auto_renew
                    ? translate('Cancel', 'გაუქმება')
                    : translate('Enable', 'ჩართვა')}
                </button>
              </div>
              <span className="billing-auto-renewal-desc">
                {subscription.auto_renew
                  ? translate(
                      'Your subscription will automatically renew every 30 days.',
                      'თქვენი გამოწერა ავტომატურად განახლდება ყოველ 30 დღეში.'
                    )
                  : translate(
                      'Enable auto-renewal to keep your Pro benefits active.',
                      'ჩართეთ ავტომატური განახლება რომ შეინარჩუნოთ პრო სტატუსი.'
                    )}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Payment History Card */}
      <div className="billing-card">
        <h5 className="billing-history-title">
          {translate('Payment History', 'გადახდების ისტორია')}
        </h5>

        {paymentsLoading ? (
          <div className="billing-empty">
            <LoadingSpinner />
          </div>
        ) : payments.length === 0 ? (
          <div className="billing-empty">
            {translate('No payment history', 'გადახდების ისტორია არ არის')}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="billing-table">
              <thead>
                <tr>
                  <th>{translate('Date', 'თარიღი')}</th>
                  <th>{translate('Amount', 'თანხა')}</th>
                  <th>{translate('Payment Method', 'გადახდის მეთოდი')}</th>
                  <th>{translate('Status', 'სტატუსი')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.created_at)}</td>
                    <td className="amount">{formatAmount(payment.amount)}</td>
                    <td>
                      <div className="billing-table-payment">
                        {getPaymentMethodIcon(payment.payment_method_type)}
                        <span>
                          {payment.payment_method_type === 'google_pay' && 'Google Pay'}
                          {payment.payment_method_type === 'apple_pay' && 'Apple Pay'}
                          {payment.payment_method_type === 'card' && payment.card_brand && `${payment.card_brand} ••${payment.card_last4}`}
                        </span>
                      </div>
                    </td>
                    <td>{getStatusTag(payment.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length > 0 && (
              <div className="billing-total">
                {translate(`Total ${payments.length} payments`, `სულ ${payments.length} გადახდა`)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Billing
