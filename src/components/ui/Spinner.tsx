import React from 'react'
import 'src/assets/css/spinner.css'

interface SpinnerProps {
  size?: 'small' | 'default' | 'large'
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'default', className = '' }) => {
  const sizeClass = {
    small: 'spinner-sm',
    default: 'spinner-md',
    large: 'spinner-lg'
  }[size]

  return (
    <svg
      className={`spinner ${sizeClass} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        style={{ opacity: 0.25 }}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        style={{ opacity: 0.75 }}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Spin wrapper component for compatibility with Ant Design's Spin
interface SpinProps {
  spinning?: boolean
  size?: 'small' | 'default' | 'large'
  children?: React.ReactNode
  tip?: string
}

const Spin: React.FC<SpinProps> = ({ spinning = true, size = 'default', children, tip }) => {
  if (!children) {
    return spinning ? (
      <div className="spin-content">
        <Spinner size={size} />
        {tip && <span className="spin-tip">{tip}</span>}
      </div>
    ) : null
  }

  return (
    <div className="spin-wrapper">
      {children}
      {spinning && (
        <div className="spin-overlay">
          <Spinner size={size} />
          {tip && <span className="spin-tip">{tip}</span>}
        </div>
      )}
    </div>
  )
}

export { Spinner, Spin }
export default Spin
