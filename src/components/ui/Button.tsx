import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'
import 'src/assets/css/button.css'

// Grok-style minimalistic loading spinner
const LoadingSpinner = () => (
  <svg
    className="btn-spinner"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: 'primary' | 'default' | 'text' | 'link' | 'danger'
  type?: 'primary' | 'default' | 'text' | 'link' | 'danger' // Alias for variant (antd compatibility)
  htmlType?: 'button' | 'submit' | 'reset'
  size?: 'small' | 'middle' | 'large' | 'medium'
  danger?: boolean
  loading?: boolean
  icon?: ReactNode
  shape?: 'default' | 'circle' | 'round'
  block?: boolean
  ghost?: boolean
  children?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant,
  type = 'default',
  htmlType = 'button',
  size = 'middle',
  danger = false,
  loading = false,
  icon,
  shape = 'default',
  block = false,
  ghost = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  // Use variant if provided, otherwise use type
  const buttonVariant = variant || type

  // Size class
  const sizeClass = {
    small: 'btn-sm',
    middle: 'btn-md',
    medium: 'btn-md',
    large: 'btn-lg'
  }[size]

  // Shape class
  const shapeClass = {
    default: 'btn-rounded',
    circle: 'btn-circle',
    round: 'btn-pill'
  }[shape]

  // Variant class
  const variantClass = ghost ? 'btn-ghost' : `btn-${buttonVariant}`

  // Build class string
  const classes = [
    'btn',
    sizeClass,
    shapeClass,
    variantClass,
    danger && 'danger',
    block && 'block',
    loading && 'loading',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      ref={ref}
      type={htmlType}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && (
        <span className={`btn-icon ${!children ? 'no-children' : ''}`}>
          {icon}
        </span>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export { Button }
export default Button
