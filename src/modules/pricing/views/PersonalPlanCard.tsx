import { Button } from 'src/components/ui'
import { useNavigate } from 'react-router-dom'
import BusinessPlanCard from 'src/modules/pricing/views/BusinessPlanCard'
import { PlanType } from 'api/pricing/types'
import { personalPricingPlans } from 'src/modules/pricing/helpers'
import { useAuth } from 'src/providers/AuthProvider'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'
import { useEffect, useState } from 'react'
import useIsMobile from 'src/hooks/useMobile'

interface PersonalPlanCardProps {
    planType: PlanType
}

const PersonalPlanCard = ({ planType }: PersonalPlanCardProps) => {
  const navigate = useNavigate()
  const { user, refreshSubscription } = useAuth()
  const { translate } = useTranslation()
  const { isDarkMode } = useTheme()
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState<Array<string>>([])

  // Use subscription from AuthProvider
  const subscription = user?.subscription

  useEffect(() => {
    // Refresh subscription when component mounts
    refreshSubscription()

    // Listen for payment success to refresh subscription
    const handlePaymentSuccess = () => {
      setTimeout(() => refreshSubscription(), 2000) // Wait 2s for backend to process
    }

    window.addEventListener('payment-success', handlePaymentSuccess)
    return () => window.removeEventListener('payment-success', handlePaymentSuccess)
  }, [refreshSubscription])

  const handleUpgradeClick = async (title: string) => {
    setLoading(prev => [...prev, title])
    // Go directly to checkout page - options are available there
    navigate('/checkout')
    setLoading(prev => prev.filter(t => t !== title))
  }

  const getButtonText = (plan: any) => {
    if (plan.planType === 'free') {
      return subscription?.is_paid
        ? translate('not_current_plan', 'მიმდინარე გეგმა არ არის')
        : translate('current_plan', 'მიმდინარე გეგმა')
    }
    if (plan.planType === 'premium') {
      return subscription?.is_paid && subscription?.is_active
        ? translate('current_plan', 'მიმდინარე გეგმა')
        : translate('upgrade_to_premium', 'პრემიუმზე გადასვლა')
    }
    return plan.buttonText
  }

  const isButtonDisabled = (plan: any) => {
    // Free plan is always disabled
    if (plan.planType === 'free') {
      return true
    }
    // Premium plan is disabled if user already has active subscription
    if (plan.planType === 'premium') {
      return subscription?.is_paid && subscription?.is_active
    }
    // Coming soon plans (business/enterprise) are disabled
    if (plan.planType === 'business' || plan.planType === 'enterprise') {
      return true
    }
    return false
  }

  // ChatGPT-style colors
  const bgColor = isDarkMode ? '#171717' : '#f7f7f8'
  const borderColor = isDarkMode ? '#2f2f2f' : '#e5e5e5'
  const textColor = isDarkMode ? '#ececec' : '#0d0d0d'
  const secondaryTextColor = isDarkMode ? '#8e8e8e' : '#666666'

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: isMobile ? '0 12px 24px' : '0 16px 40px',
        width: '100%'
      }}>
        {planType === PlanType.PERSONAL
          ? <div style={{
              display: 'flex',
              gap: isMobile ? '12px' : '20px',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              justifyContent: 'center',
              maxWidth: '1000px',
              width: '100%'
            }}>
            {personalPricingPlans(translate, user?.isEuropean).map((plan, index) => (
              <div
                key={index}
                style={{
                  flex: isMobile ? '1 1 100%' : '1 1 0',
                  maxWidth: isMobile ? '100%' : '320px',
                  minWidth: isMobile ? 'auto' : '260px',
                  backgroundColor: bgColor,
                  border: plan.isHighlighted
                    ? (isDarkMode ? '2px solid #ffffff' : '2px solid #000000')
                    : `1px solid ${borderColor}`,
                  borderRadius: '16px',
                  padding: isMobile ? '16px' : '20px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                  <span style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 600,
                    color: textColor,
                    display: 'block',
                    marginBottom: '6px'
                  }}>
                    {plan.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: isMobile ? '24px' : '28px',
                      fontWeight: 700,
                      color: textColor
                    }}>
                      {plan.price}
                    </span>
                    <span style={{
                      fontSize: isMobile ? '12px' : '13px',
                      marginLeft: '4px',
                      color: secondaryTextColor
                    }}>
                      / {translate('monthly', 'თვე')}
                    </span>
                  </div>
                  <Button
                    size='middle'
                    block
                    loading={loading.includes(plan.title)}
                    disabled={isButtonDisabled(plan)}
                    onClick={() => !isButtonDisabled(plan) && handleUpgradeClick(plan.title)}
                    style={{
                      height: isMobile ? '34px' : '36px',
                      borderRadius: '18px',
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 500,
                      backgroundColor: plan.isHighlighted
                        ? (isDarkMode ? '#ffffff' : '#000000')
                        : 'transparent',
                      borderColor: plan.isHighlighted
                        ? (isDarkMode ? '#ffffff' : '#000000')
                        : borderColor,
                      color: plan.isHighlighted
                        ? (isDarkMode ? '#000000' : '#ffffff')
                        : textColor,
                      boxShadow: 'none'
                    }}
                  >
                    {getButtonText(plan)}
                  </Button>
                </div>
                <ul style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  flex: 1
                }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      marginBottom: isMobile ? '4px' : '6px',
                      fontSize: isMobile ? '11px' : '12px',
                      lineHeight: 1.4,
                      color: secondaryTextColor
                    }}>
                      <span style={{ color: isDarkMode ? '#52c41a' : '#389e0d', flexShrink: 0 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          : <BusinessPlanCard />
        }
      </div>
    </>
  )
}

export default PersonalPlanCard
