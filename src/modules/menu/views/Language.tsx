import { LanguageType } from 'core/types'
import { useTranslation } from 'src/providers/TranslationProvider'
import { useTheme } from 'src/providers/ThemeContext'

const Language = () => {
  const { changeLanguage, selectedLanguage, translate } = useTranslation()
  const { isDarkMode } = useTheme()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        color: isDarkMode ? '#ececec' : '#374151'
      }}
      onClick={() => changeLanguage(selectedLanguage === LanguageType.GEO ? LanguageType.ENG : LanguageType.GEO)}
    >
      <span style={{ fontSize: '20px', marginRight: '8px' }}>
        {selectedLanguage === LanguageType.GEO ? '🇬🇪' : '🇺🇸'}
      </span>
      <span>
        {selectedLanguage === LanguageType.GEO
          ? translate('georgian', 'ქართული')
          : translate('english', 'English')
        }
      </span>
    </div>
  )
}

export default Language
