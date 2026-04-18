import React, { useEffect, useState } from 'react'
import { paymentApi, Payment, PaymentMethodType } from 'src/api/payment'
import { useTranslation } from 'src/providers/TranslationProvider'
import LoadingSpinner from 'src/core/components/LoadingSpinner'
import 'src/assets/css/billing.css'

// Icons
const CreditCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const CloseCircleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

const ClockCircleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const ReloadIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

// Helper function to get payment method icon
const getPaymentMethodIcon = (methodType?: PaymentMethodType) => {
  switch (methodType) {
    case 'google_pay':
      return <GoogleIcon />
    case 'apple_pay':
      return <AppleIcon />
    case 'card':
    default:
      return <CreditCardIcon />
  }
}

const PaymentHistory: React.FC = () => {
  const { translate } = useTranslation()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const data = await paymentApi.getPaymentHistory()
      setPayments(data)
    } catch (error) {
      console.error('Failed to load payment history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Helper function to get status tag with CSS classes
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="billing-status-tag success">
            <CheckCircleIcon />
            {translate('Completed', 'დასრულებული')}
          </span>
        )
      case 'pending':
        return (
          <span className="billing-status-tag pending">
            <ClockCircleIcon />
            {translate('Pending', 'მიმდინარე')}
          </span>
        )
      case 'failed':
        return (
          <span className="billing-status-tag failed">
            <CloseCircleIcon />
            {translate('Failed', 'ვერ მოხერხდა')}
          </span>
        )
      case 'cancelled':
        return (
          <span className="billing-status-tag cancelled">
            <CloseCircleIcon />
            {translate('Cancelled', 'გაუქმებული')}
          </span>
        )
      default:
        return (
          <span className="billing-status-tag one-time">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="payment-history-page">
      <h3 className="payment-history-title">
        {translate('Payment History', 'გადახდების ისტორია')}
      </h3>

      {payments.length === 0 && !loading && (
        <div className="billing-info-alert" style={{ marginBottom: 24 }}>
          <span className="billing-info-alert-icon"><InfoIcon /></span>
          <div>
            <div className="billing-info-alert-title">
              {translate('No Payments Yet', 'გადახდები ჯერ არ არის')}
            </div>
            <div className="billing-info-alert-text">
              {translate(
                'Your payment history will appear here after you make your first payment.',
                'თქვენი გადახდების ისტორია გამოჩნდება აქ პირველი გადახდის შემდეგ.'
              )}
            </div>
          </div>
        </div>
      )}

      <div className="billing-card">
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : payments.length === 0 ? (
          <div className="billing-empty">
            {translate('No payment history', 'გადახდების ისტორია ცარიელია')}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="billing-table">
              <thead>
                <tr>
                  <th>{translate('Date', 'თარიღი')}</th>
                  <th>{translate('Amount', 'თანხა')}</th>
                  <th>{translate('Payment Method', 'გადახდის მეთოდი')}</th>
                  <th>{translate('Type', 'ტიპი')}</th>
                  <th>{translate('Status', 'სტატუსი')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.created_at)}</td>
                    <td className="amount">{payment.amount} {payment.currency}</td>
                    <td>
                      <div className="billing-table-payment">
                        {getPaymentMethodIcon(payment.payment_method_type)}
                        <span>
                          {payment.payment_method_type === 'google_pay' && 'Google Pay'}
                          {payment.payment_method_type === 'apple_pay' && 'Apple Pay'}
                          {payment.payment_method_type === 'card' && payment.card_brand && (
                            `${payment.card_brand} ••${payment.card_last4}`
                          )}
                          {payment.payment_method_type === 'card' && !payment.card_brand && translate('Card', 'ბარათი')}
                          {!payment.payment_method_type && translate('Card', 'ბარათი')}
                        </span>
                      </div>
                    </td>
                    <td>
                      {payment.is_renewal ? (
                        <span className="billing-status-tag renewal">
                          <ReloadIcon />
                          {translate('Auto-Renewal', 'ავტომატური განახლება')}
                        </span>
                      ) : (
                        <span className="billing-status-tag one-time">
                          {translate('One-time', 'ერთჯერადი')}
                        </span>
                      )}
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

export default PaymentHistory
