import { LanguageType } from 'core/types'
import { ReactNode, createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import eng from 'core/helpers/eng.json'
import geo from 'core/helpers/geo.json'
import rus from 'core/helpers/rus.json'

export interface TranslationContextType {
  readonly selectedLanguage: LanguageType
  readonly changeLanguage: (lang: LanguageType) => void
  readonly translate:  (key: string, defaultValue: string) => string
}


export const useTranslation = (): TranslationContextType => {
  return useContext<TranslationContextType>(TranslationContext)
}

const initialTranslation: TranslationContextType = {
  selectedLanguage: LanguageType.GEO,
  changeLanguage: () => ({}),
  translate: () => ''
}

export const TranslationContext = createContext<TranslationContextType>(initialTranslation)

// Map ISO locale codes (from AppSidebar) to LanguageType enum
function localeToLanguageType(locale: string): LanguageType {
  if (locale.startsWith('ka')) return LanguageType.GEO
  if (locale.startsWith('ru')) return LanguageType.RUS
  return LanguageType.ENG
}

const FADE_OUT_MS = 150
const FADE_IN_MS = 200

const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>(() => {
    // Check the sidebar's language key first (primary source of truth)
    const sidebarLang = localStorage.getItem('doctoringo_language')
    if (sidebarLang) return localeToLanguageType(sidebarLang)
    // Fallback to legacy key
    const legacyLang = localStorage.getItem('language')
    if (legacyLang) return Number(legacyLang) || LanguageType.GEO
    // Auto-detect device/browser language on first visit
    if (typeof navigator !== 'undefined' && navigator.language) {
      const detectedLang = localeToLanguageType(navigator.language)
      localStorage.setItem('language', String(detectedLang))
      return detectedLang
    }
    return LanguageType.GEO
  })

  const wrapperRef = useRef<HTMLDivElement>(null)
  const pendingLangRef = useRef<LanguageType | null>(null)

  // Animate language switch: fade out → swap → fade in
  const switchWithTransition = useCallback((newLang: LanguageType) => {
    if (newLang === selectedLanguage && !pendingLangRef.current) return

    const el = wrapperRef.current
    if (!el) {
      // No DOM ref yet, just swap instantly
      setSelectedLanguage(newLang)
      localStorage.setItem('language', String(newLang))
      return
    }

    pendingLangRef.current = newLang

    // Phase 1: fade out + slight scale
    el.style.transition = `opacity ${FADE_OUT_MS}ms ease-in, transform ${FADE_OUT_MS}ms ease-in`
    el.style.opacity = '0'
    el.style.transform = 'scale(0.995)'

    setTimeout(() => {
      // Phase 2: swap language (triggers re-render with new text)
      setSelectedLanguage(newLang)
      localStorage.setItem('language', String(newLang))
      pendingLangRef.current = null

      // Phase 3: fade in (next frame after React re-render)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!wrapperRef.current) return
          wrapperRef.current.style.transition = `opacity ${FADE_IN_MS}ms ease-out, transform ${FADE_IN_MS}ms ease-out`
          wrapperRef.current.style.opacity = '1'
          wrapperRef.current.style.transform = 'scale(1)'
        })
      })
    }, FADE_OUT_MS)
  }, [selectedLanguage])

  const changeLanguage = useCallback((lang: LanguageType) => {
    switchWithTransition(lang)
  }, [switchWithTransition])

  const translate = (key: string, defaultValue: string): string => {
    if (selectedLanguage === LanguageType.GEO) return (geo as Record<string, string>)[key] || defaultValue
    if (selectedLanguage === LanguageType.ENG) return (eng as Record<string, string>)[key] || defaultValue
    if (selectedLanguage === LanguageType.RUS) return (rus as Record<string, string>)[key] || defaultValue
    return defaultValue
  }

  // Listen for language changes from AppSidebar
  useEffect(() => {
    const handleLanguageChanged = (e: Event) => {
      const locale = (e as CustomEvent).detail as string
      const langType = localeToLanguageType(locale)
      switchWithTransition(langType)
    }
    window.addEventListener('language-changed', handleLanguageChanged)
    return () => window.removeEventListener('language-changed', handleLanguageChanged)
  }, [switchWithTransition])


  const value: TranslationContextType = {
    changeLanguage,
    selectedLanguage,
    translate
  }

  return (
    <TranslationContext.Provider value={value}>
      <div
        ref={wrapperRef}
        style={{
          opacity: 1,
          transform: 'scale(1)',
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </div>
    </TranslationContext.Provider>
  )
}
export default TranslationProvider
