import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'src/providers/TranslationProvider'
import { logger } from 'src/utils/logger'
import useIsMobile from 'src/hooks/useMobile'
import { Spin } from 'src/components/ui'
import { API_BASE_URL } from 'src/lib/api'
import 'src/assets/css/country-selector.css'

export type CountryCode = 'GE' | 'US' | 'DE' | 'EU' | 'EE' | string

export interface Country {
  code: CountryCode
  name: string
  native_name: string
  flag_emoji: string
  source_name: string
  source_url: string
  default_language: string
  document_count: number
}

interface CountrySelectorProps {
  selectedCountry: CountryCode
  onCountryChange: (country: CountryCode) => void
  disabled?: boolean
}

// Check icon for selected state
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Chevron icon
const ChevronIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onCountryChange,
  disabled = false
}) => {
  const { translate } = useTranslation()
  const isMobile = useIsMobile(480) // Only hide text on very small screens
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/countries/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.countries) {
          setCountries(data.countries)
          logger.info('Countries fetched:', data.countries.length)
        }
      }
    } catch (error) {
      logger.error('Failed to fetch countries:', error)
      setCountries([{
        code: 'GE',
        name: 'Georgia',
        native_name: 'საქართველო',
        flag_emoji: '🇬🇪',
        source_name: 'Matsne',
        source_url: 'https://matsne.gov.ge',
        default_language: 'ka',
        document_count: 0
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleCountrySelect = useCallback((code: CountryCode) => {
    onCountryChange(code)
    setIsOpen(false)
  }, [onCountryChange])

  const selectedCountryData = useMemo(() => {
    return countries.find(c => c.code === selectedCountry)
  }, [countries, selectedCountry])

  // Sort countries: selected first, then Georgia, then alphabetically by native_name
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      // Selected country always first
      if (a.code === selectedCountry) return -1
      if (b.code === selectedCountry) return 1
      // Georgia second (if not selected)
      if (a.code === 'GE') return -1
      if (b.code === 'GE') return 1
      // Then alphabetically
      return a.native_name.localeCompare(b.native_name)
    })
  }, [countries, selectedCountry])

  return (
    <div ref={dropdownRef} className="country-selector-container">
      {/* Trigger Button */}
      <button
        type="button"
        className="country-selector-trigger"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
      >
        <span className="flag-emoji">
          {selectedCountryData?.flag_emoji || '🇬🇪'}
        </span>
        {!isMobile && (
          <span className="country-name">
            {selectedCountryData?.native_name || 'საქართველო'}
          </span>
        )}
        <span className={`chevron ${isOpen ? 'open' : ''}`}>
          <ChevronIcon />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="country-selector-dropdown">
          {/* Header */}
          <div className="country-selector-header">
            <span>{translate('select_jurisdiction', 'იურისდიქცია')}</span>
          </div>

          {loading ? (
            <div className="country-selector-loading">
              <Spin size="small" />
            </div>
          ) : (
            <div className="country-selector-items">
              {sortedCountries.map((country) => {
                const isSelected = selectedCountry === country.code
                return (
                  <div
                    key={country.code}
                    role="button"
                    tabIndex={0}
                    className={`country-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCountrySelect(country.code)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCountrySelect(country.code)}
                    style={{
                      position: 'relative',
                      paddingLeft: '56px',
                      paddingRight: '60px',
                      minHeight: '52px'
                    }}
                  >
                    {/* Flag - absolute left */}
                    <span style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '28px',
                      lineHeight: 1
                    }}>
                      {country.flag_emoji}
                    </span>

                    {/* Name & Source - center */}
                    <div style={{
                      paddingTop: '10px',
                      paddingBottom: '10px'
                    }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        lineHeight: 1.3
                      }}>
                        {country.native_name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        opacity: 0.8,
                        marginTop: '2px',
                        lineHeight: 1.3
                      }}>
                        {country.source_name}
                      </div>
                    </div>

                    {/* Right side - absolute right */}
                    <span style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {country.document_count > 0 && (
                        <span className="country-count">{country.document_count.toLocaleString()}</span>
                      )}
                      {isSelected && (
                        <span style={{ color: '#3b82f6', display: 'flex' }}>
                          <CheckIcon />
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CountrySelector
