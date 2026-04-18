import React from 'react'
import { useTheme } from 'src/providers/ThemeContext'
import { getThemeColors, BRAND_COLORS, BUTTON_SIZES, BORDER_RADIUS, TRANSITIONS } from 'src/constants/theme'

interface SidebarButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  collapsed: boolean
  disabled?: boolean
  tooltip?: string
  ariaLabel?: string
  iconColor?: string
}

/**
 * Reusable sidebar button component with consistent styling and behavior
 */
const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  onClick,
  collapsed,
  disabled = false,
  tooltip,
  ariaLabel,
  iconColor = BRAND_COLORS.PRIMARY_BLUE,
}) => {
  const { isDarkMode } = useTheme()
  const colors = getThemeColors(isDarkMode)

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        height: BUTTON_SIZES.LARGE.height,
        width: collapsed ? BUTTON_SIZES.LARGE.height : '100%',
        fontSize: BUTTON_SIZES.LARGE.fontSize,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        paddingLeft: collapsed ? '0' : BUTTON_SIZES.LARGE.padding.split(' ')[1],
        paddingRight: collapsed ? '0' : BUTTON_SIZES.LARGE.padding.split(' ')[1],
        borderRadius: BORDER_RADIUS.MD,
        backgroundColor: 'transparent',
        color: colors.text.PRIMARY,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        gap: '14px',
        margin: collapsed ? '0 auto' : '0',
        border: '1px solid transparent',
        transition: TRANSITIONS.DEFAULT,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.interactive.HOVER
          e.currentTarget.style.borderColor = colors.interactive.BORDER_HOVER
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
      }}
      aria-label={ariaLabel || label}
      title={collapsed ? tooltip || label : undefined}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div style={{ fontSize: '20px', flexShrink: 0, color: iconColor, pointerEvents: 'none' }}>
        {icon}
      </div>
      {!collapsed && (
        <span style={{ fontSize: BUTTON_SIZES.LARGE.fontSize, whiteSpace: 'nowrap', fontWeight: 500, pointerEvents: 'none' }}>
          {label}
        </span>
      )}
    </div>
  )
}

export default SidebarButton
