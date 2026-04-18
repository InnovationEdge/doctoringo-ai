import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { logger } from 'src/utils/logger'
import { API_BASE_URL } from '../lib/api'

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

export interface GeoInfo {
  country_code: CountryCode
  is_european: boolean
  currency: 'EUR' | 'USD' | 'GEL'
  price_amount: number
}

interface CountryContextType {
  selectedCountry: CountryCode
  setSelectedCountry: (country: CountryCode) => void
  geoInfo: GeoInfo | null
  countries: Country[]
  loading: boolean
  detectCountryFromIP: () => Promise<void>
}

const STORAGE_KEY = 'doctoringo_selected_country'
const GEO_CACHE_KEY = 'doctoringo_geo_info'
const GEO_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// EU country codes for pricing
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
]

const CountryContext = createContext<CountryContextType | undefined>(undefined)

interface CountryProviderProps {
  children: ReactNode
}

export const CountryProvider: React.FC<CountryProviderProps> = ({ children }) => {
  const [selectedCountry, setSelectedCountryState] = useState<CountryCode>('GE')
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch available countries from API
  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/countries/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.countries) {
          setCountries(data.countries)
        }
      }
    } catch (error) {
      logger.error('Failed to fetch countries:', error)
    }
  }

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedCountryState(stored as CountryCode)
    }
    fetchCountries()

    // Check for cached geo info
    const cachedGeo = localStorage.getItem(GEO_CACHE_KEY)
    if (cachedGeo) {
      try {
        const { data, timestamp } = JSON.parse(cachedGeo)
        if (Date.now() - timestamp < GEO_CACHE_DURATION) {
          setGeoInfo(data)
          // Auto-set country if not manually set
          if (!stored && data.country_code) {
            setSelectedCountryState(data.country_code)
          }
          setLoading(false)
          return
        }
      } catch (e) {
        logger.error('Failed to parse cached geo info:', e)
      }
    }

    // Detect from IP if no cache
    detectCountryFromIP()
  }, [])

  // Persist to localStorage when changed
  const setSelectedCountry = (country: CountryCode) => {
    setSelectedCountryState(country)
    localStorage.setItem(STORAGE_KEY, country)
    logger.info('Country changed to:', country)
  }

  // Detect country from IP using ipapi.co
  const detectCountryFromIP = async () => {
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const countryCode = data.country_code || 'GE'
        const isEuropean = EU_COUNTRIES.includes(countryCode)

        // Determine pricing based on region
        let currency: 'EUR' | 'USD' | 'GEL' = 'USD'
        let priceAmount = 20

        if (countryCode === 'GE') {
          currency = 'GEL'
          priceAmount = 49
        } else if (isEuropean) {
          currency = 'EUR'
          priceAmount = 20
        } else {
          currency = 'USD'
          priceAmount = 20
        }

        const geo: GeoInfo = {
          country_code: countryCode,
          is_european: isEuropean,
          currency,
          price_amount: priceAmount
        }

        setGeoInfo(geo)

        // Cache the result
        localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({
          data: geo,
          timestamp: Date.now()
        }))

        // Auto-set country only if not manually set before
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) {
          // Map detected country to available law jurisdictions
          // For now, default to GE unless we have their country's laws
          setSelectedCountryState('GE')
        }

        logger.info('Geo detection successful:', geo)
      }
    } catch (error) {
      logger.error('Failed to detect country from IP:', error)
      // Default to Georgia
      setGeoInfo({
        country_code: 'GE',
        is_european: false,
        currency: 'GEL',
        price_amount: 49
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        geoInfo,
        countries,
        loading,
        detectCountryFromIP
      }}
    >
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = (): CountryContextType => {
  const context = useContext(CountryContext)
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider')
  }
  return context
}

export default CountryProvider
