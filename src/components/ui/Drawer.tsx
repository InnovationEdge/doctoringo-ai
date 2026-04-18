import React, { useEffect, useCallback, ReactNode, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import 'src/assets/css/drawer.css'

// Grok-style minimalistic close icon
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

interface DrawerStyles {
  body?: React.CSSProperties
  header?: React.CSSProperties
  wrapper?: React.CSSProperties
  mask?: React.CSSProperties
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  placement?: 'left' | 'right' | 'top' | 'bottom'
  width?: number | string
  height?: number | string
  closable?: boolean
  maskClosable?: boolean
  className?: string
  rootClassName?: string
  styles?: DrawerStyles
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  placement = 'right',
  width = 378,
  height = 378,
  closable = true,
  maskClosable = true,
  className = '',
  rootClassName = '',
  styles,
}) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  if (!open) return null

  const isHorizontal = placement === 'left' || placement === 'right'
  const sizeValue = isHorizontal ? width : height
  const sizeStyle: CSSProperties = isHorizontal
    ? { width: typeof sizeValue === 'number' ? `${sizeValue}px` : sizeValue }
    : { height: typeof sizeValue === 'number' ? `${sizeValue}px` : sizeValue }

  const drawerContent = (
    <div className={`drawer-overlay ${rootClassName}`}>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        style={styles?.mask}
        onClick={maskClosable ? onClose : undefined}
      />

      {/* Drawer Panel */}
      <div
        className={`drawer-panel ${placement} ${className}`}
        style={{ ...sizeStyle, ...styles?.wrapper }}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="drawer-header" style={styles?.header}>
            {title && (
              <div className="drawer-title">
                {title}
              </div>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="drawer-close-btn"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="drawer-body" style={styles?.body}>
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(drawerContent, document.body)
}

export { Drawer }
export default Drawer
