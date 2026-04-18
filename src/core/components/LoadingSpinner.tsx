import { useTheme } from 'src/providers/ThemeContext'
import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  text?: string
  fullscreen?: boolean
}

const LoadingIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill={color}
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  text,
  fullscreen = false
}) => {
  const { isDarkMode } = useTheme()

  const sizeMap = {
    small: 20,
    default: 32,
    large: 48
  }

  const color = isDarkMode ? '#ececec' : '#0d0d0d'

  const spinnerContent = (
    <div className={`loading-spinner-container ${isDarkMode ? 'dark' : 'light'}`}>
      <LoadingIcon size={sizeMap[size]} color={color} />
      {text && (
        <div className='loading-text' style={{ marginTop: size === 'small' ? 8 : 16 }}>
          {text}
        </div>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className={`loading-fullscreen ${isDarkMode ? 'dark' : 'light'}`}>
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}

export default LoadingSpinner
