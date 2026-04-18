import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface MenuItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  onClick?: (e: { domEvent: React.MouseEvent }) => void
}

interface MenuProps {
  items?: MenuItem[]
}

interface DropdownProps {
  menu: MenuProps
  trigger?: ('click' | 'hover')[]
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight' | 'bottom' | 'top'
  children: ReactNode
  disabled?: boolean
}

const Dropdown: React.FC<DropdownProps> = ({
  menu,
  trigger = ['hover'],
  placement = 'bottomLeft',
  children,
  disabled,
}) => {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight || 200
    const menuWidth = menuRef.current?.offsetWidth || 160

    let top = rect.bottom + 4
    let left = rect.left

    // Adjust based on placement
    if (placement.includes('Right')) {
      left = rect.right - menuWidth
    }
    if (placement.includes('top') || placement.includes('Top')) {
      top = rect.top - menuHeight - 4
    }

    // Keep within viewport
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 8
    }
    if (left < 8) {
      left = 8
    }
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setVisible(false)
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    if (trigger.includes('click')) {
      setVisible(!visible)
    }
  }

  const handleMouseEnter = () => {
    if (disabled) return
    if (trigger.includes('hover')) {
      setVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger.includes('hover')) {
      setVisible(false)
    }
  }

  const handleItemClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.disabled) return
    if (item.onClick) {
      item.onClick({ domEvent: e })
    }
    setVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {visible && createPortal(
        <div
          ref={menuRef}
          className={clsx(
            'fixed z-[1050] min-w-[160px] py-1',
            'bg-white dark:bg-[#2f2f2f] rounded-xl shadow-lg',
            'border border-gray-200 dark:border-gray-700',
            'animate-fade-in'
          )}
          style={{ top: position.top, left: position.left }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {menu.items?.map((item) => (
            <button
              key={item.key}
              onClick={(e) => handleItemClick(item, e)}
              disabled={item.disabled}
              className={clsx(
                'w-full flex items-center gap-2 px-4 py-2 text-sm text-left',
                'transition-colors',
                item.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : item.danger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

export { Dropdown }
export type { MenuItem, MenuProps }
export default Dropdown
