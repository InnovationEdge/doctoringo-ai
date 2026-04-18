import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface TooltipProps {
  title: ReactNode
  children: React.ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click'
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({
  title,
  children,
  placement = 'top',
  trigger = 'hover',
  className
}) => {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()

    let top = 0
    let left = 0

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + 8
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - 8
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + 8
        break
    }

    // Keep tooltip within viewport
    const padding = 8
    if (left < padding) left = padding
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding
    }
    if (top < padding) top = padding
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding
    }

    setPosition({ top, left })
  }

  useEffect(() => {
    if (visible) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [visible])

  const showTooltip = () => setVisible(true)
  const hideTooltip = () => setVisible(false)

  const triggerProps: Record<string, unknown> = {
    ref: triggerRef
  }

  if (trigger === 'hover') {
    triggerProps.onMouseEnter = showTooltip
    triggerProps.onMouseLeave = hideTooltip
    triggerProps.onFocus = showTooltip
    triggerProps.onBlur = hideTooltip
  } else {
    triggerProps.onClick = () => setVisible(!visible)
  }

  if (!title) {
    return children
  }

  return (
    <>
      {React.cloneElement(children, triggerProps)}
      {visible && createPortal(
        <div
          ref={tooltipRef}
          className={clsx(
            'fixed z-[9999] px-2 py-1 text-xs font-medium',
            'text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg',
            'animate-fade-in pointer-events-none',
            className
          )}
          style={{ top: position.top, left: position.left }}
        >
          {title}
          {/* Arrow */}
          <div
            className={clsx(
              'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45',
              placement === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
              placement === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
              placement === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
              placement === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
            )}
          />
        </div>,
        document.body
      )}
    </>
  )
}

export { Tooltip }
export default Tooltip
