import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useAuth } from 'src/providers/AuthProvider'

import { getCookie } from 'src/utils/cookieHelper'
import { logger } from 'src/utils/logger'
import useIsMobile from 'src/hooks/useMobile'
import { API_BASE_URL } from 'src/lib/api'
import 'src/assets/css/model-selector.css'

export type ModelTier = 'premium' | 'standard'

export interface ModelQuotaInfo {
  premium_model: string
  premium_model_display: string
  standard_model: string
  standard_model_display: string
  daily_limit: number
  questions_used: number
  remaining_questions: number
  has_remaining: boolean
  reset_time: string
}

interface ModelSelectorProps {
  selectedModel: ModelTier
  onModelChange: (model: ModelTier) => void
  quotaInfo: ModelQuotaInfo | null
  disabled?: boolean
  onQuotaUpdate?: (quota: ModelQuotaInfo) => void
  dropdownDirection?: 'up' | 'down'
}

// Grok-style minimalistic icons
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Pro model icon - Simple star
const ProIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

// Basic model icon - Circle
const BasicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="8" />
  </svg>
)

// Upgrade icon - Arrow up
const UpgradeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`model-selector-chevron ${isOpen ? 'open' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  quotaInfo,
  disabled = false,
  onQuotaUpdate,
  dropdownDirection = 'down'
}) => {
  const { translate } = useTranslation()
  const { user } = useAuth()

  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isPremium = user?.subscription?.is_paid === true

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchQuotaInfo = useCallback(async () => {
    try {
      setLoading(true)
      const csrfToken = getCookie('csrftoken')
      const response = await fetch(`${API_BASE_URL}/api/payment/model-quota/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || ''
        },
        credentials: 'include'
      })
      if (response.ok) {
        const data: ModelQuotaInfo = await response.json()
        logger.info('Model quota fetched:', data)
        if (onQuotaUpdate) onQuotaUpdate(data)
      }
    } catch (error) {
      logger.error('Failed to fetch model quota:', error)
    } finally {
      setLoading(false)
    }
  }, [onQuotaUpdate])

  useEffect(() => {
    fetchQuotaInfo()
  }, [fetchQuotaInfo])

  const handleModelSelect = (tier: ModelTier) => {
    // If user tries to select premium but has no quota, redirect to pricing
    if (tier === 'premium' && quotaInfo && !quotaInfo.has_remaining && !isPremium) {
      setIsOpen(false)
      window.dispatchEvent(new CustomEvent('open-plans'))
      return
    }
    onModelChange(tier)
    setIsOpen(false)
  }

  const getSelectedModelName = () => selectedModel === 'premium' ? 'Legal Pro' : 'Legal Basic'

  return (
    <div ref={dropdownRef} className="model-selector">
      {/* Inline quota-exceeded banner */}
      {quotaInfo && !quotaInfo.has_remaining && !isPremium && !isOpen && (
        <div className="model-selector-quota-banner">
          <span className="model-selector-quota-banner-text">
            {translate('premium_limit_reached', 'პრემიუმ ლიმიტი ამოიწურა')}
          </span>
          <button
            type="button"
            className="model-selector-quota-banner-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-plans'))}
          >
            {translate('upgrade', 'განახლება')} →
          </button>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="model-selector-trigger"
      >
        <span className="model-selector-icon">
          {selectedModel === 'premium' ? <ProIcon /> : <BasicIcon />}
        </span>
        <span className="model-selector-name">{getSelectedModelName()}</span>
        {/* Show Pro quota on trigger (visible without opening dropdown) */}
        {quotaInfo && selectedModel === 'premium' && !isPremium && (
          <span className={`model-selector-trigger-quota ${quotaInfo.has_remaining ? '' : 'exhausted'}`}>
            {quotaInfo.remaining_questions}/{quotaInfo.daily_limit}
          </span>
        )}
        <ChevronIcon isOpen={isOpen} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`model-selector-dropdown ${isMobile ? 'mobile' : ''} ${dropdownDirection === 'up' ? 'direction-up' : ''}`}>
          {/* Premium Option */}
          <button
            type="button"
            onClick={() => handleModelSelect('premium')}
            className={`model-selector-item ${selectedModel === 'premium' ? 'selected' : ''}`}
          >
            <div className="model-selector-item-left">
              <span className="model-selector-item-icon pro">
                <ProIcon />
              </span>
              <div className="model-selector-item-name">Legal Pro</div>
            </div>
            <div className="model-selector-item-right">
              {quotaInfo && (
                <span className={`model-selector-quota ${quotaInfo.has_remaining ? 'premium' : 'exhausted'}`}>
                  {quotaInfo.remaining_questions}/{quotaInfo.daily_limit}
                </span>
              )}
              {selectedModel === 'premium' && (
                <span className="model-selector-check premium"><CheckIcon /></span>
              )}
            </div>
          </button>

          {/* Standard Option */}
          <button
            type="button"
            onClick={() => handleModelSelect('standard')}
            className={`model-selector-item ${selectedModel === 'standard' ? 'selected' : ''}`}
          >
            <div className="model-selector-item-left">
              <span className="model-selector-item-icon basic">
                <BasicIcon />
              </span>
              <div className="model-selector-item-name">Legal Basic</div>
            </div>
            <div className="model-selector-item-right">
              <span className="model-selector-quota unlimited">
                {translate('unlimited', '∞')}
              </span>
              {selectedModel === 'standard' && (
                <span className="model-selector-check standard"><CheckIcon /></span>
              )}
            </div>
          </button>

          {/* Quota reset info */}
          {quotaInfo && !quotaInfo.has_remaining && (
            <div className="model-selector-reset-info">
              {translate('premium_resets_daily', 'კვოტა განახლდება შუაღამეს')}
            </div>
          )}

          {/* Upgrade */}
          {!isPremium && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                window.dispatchEvent(new CustomEvent('open-plans'))
              }}
              className="model-selector-upgrade"
            >
              <span className="model-selector-item-icon upgrade">
                <UpgradeIcon />
              </span>
              <div className="model-selector-upgrade-name">
                {translate('upgrade_to_premium', 'გადასვლა პრემიუმზე')}
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ModelSelector
