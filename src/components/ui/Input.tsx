import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState, useRef, useEffect, ReactNode } from 'react'
import 'src/assets/css/input.css'

// Grok-style minimalistic clear icon
const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: 'small' | 'middle' | 'large'
  inputPrefix?: ReactNode
  suffix?: ReactNode
  allowClear?: boolean
  onClear?: () => void
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'middle',
  inputPrefix,
  suffix,
  allowClear,
  onClear,
  className = '',
  value,
  onChange,
  ...props
}, ref) => {
  const hasValue = value !== undefined && value !== ''

  const handleClear = () => {
    if (onClear) {
      onClear()
    }
    if (onChange) {
      const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>
      onChange(event)
    }
  }

  // Size class
  const sizeClass = {
    small: 'input-sm',
    middle: 'input-md',
    large: 'input-lg'
  }[size]

  // Build input classes
  const inputClasses = [
    'input',
    sizeClass,
    inputPrefix && 'has-prefix',
    (suffix || allowClear) && 'has-suffix',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="input-wrapper">
      {inputPrefix && (
        <span className="input-prefix">
          {inputPrefix}
        </span>
      )}
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        className={inputClasses}
        {...props}
      />
      {(suffix || (allowClear && hasValue)) && (
        <span className="input-suffix">
          {allowClear && hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="input-clear-btn"
              aria-label="Clear"
            >
              <ClearIcon />
            </button>
          )}
          {suffix}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// TextArea component
interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: 'small' | 'middle' | 'large'
  autoSize?: boolean | { minRows?: number; maxRows?: number }
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  size = 'middle',
  autoSize,
  className = '',
  style,
  ...props
}, ref) => {
  const [height, setHeight] = useState<number | undefined>()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const combinedRef = (node: HTMLTextAreaElement | null) => {
    textareaRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
    }
  }

  useEffect(() => {
    if (autoSize && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'

      const minRows = typeof autoSize === 'object' ? autoSize.minRows || 1 : 1
      const maxRows = typeof autoSize === 'object' ? autoSize.maxRows || Infinity : Infinity

      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const paddingTop = parseInt(getComputedStyle(textarea).paddingTop) || 0
      const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom) || 0

      const minHeight = lineHeight * minRows + paddingTop + paddingBottom
      const maxHeight = maxRows === Infinity ? Infinity : lineHeight * maxRows + paddingTop + paddingBottom

      const scrollHeight = textarea.scrollHeight
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)

      setHeight(newHeight)
    }
  }, [props.value, autoSize])

  // Size class
  const sizeClass = {
    small: 'textarea-sm',
    middle: 'textarea-md',
    large: 'textarea-lg'
  }[size]

  // Build textarea classes
  const textareaClasses = [
    'textarea',
    sizeClass,
    autoSize && 'autosize',
    className
  ].filter(Boolean).join(' ')

  const heightStyle = height ? { height: `${height}px` } : {}

  return (
    <textarea
      ref={combinedRef}
      className={textareaClasses}
      style={{ ...style, ...heightStyle }}
      {...props}
    />
  )
})

TextArea.displayName = 'TextArea'

// Attach TextArea to Input
const InputWithTextArea = Input as typeof Input & { TextArea: typeof TextArea }
InputWithTextArea.TextArea = TextArea

export { Input, TextArea }
export default InputWithTextArea
