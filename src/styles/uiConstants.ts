// Shared UI Constants for consistent sizing across all components
// Use these constants everywhere to maintain visual consistency

export const UI_SIZES = {
  // Icon button (theme toggle, menu buttons, etc.)
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    iconSize: 18
  },

  // Pill button (CountrySelector, ModelSelector triggers)
  pillButton: {
    height: 30,
    paddingX: 10,
    paddingY: 5,
    borderRadius: 15,
    fontSize: 13,
    gap: 6,
    emojiSize: 16
  },

  // Dropdown menu
  dropdown: {
    borderRadius: 12,
    padding: 8,
    minWidth: 260,
    maxWidth: 300,
    itemPadding: '10px 12px',
    itemBorderRadius: 10,
    gap: 2
  },

  // Header
  header: {
    height: 56,
    heightDesktop: 64,
    paddingX: 16,
    paddingXDesktop: 24
  }
} as const

// Shared color getters
export const getUIColors = (isDarkMode: boolean) => ({
  // Backgrounds
  pillBg: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
  hoverBg: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  dropdownBg: isDarkMode ? '#2a2a2a' : '#ffffff',
  selectedBg: isDarkMode ? '#3a3a3a' : '#f0f0f0',
  itemHoverBg: isDarkMode ? '#333333' : '#f5f5f5',

  // Text
  text: isDarkMode ? '#ffffff' : '#1a1a1a',
  textSecondary: isDarkMode ? '#888888' : '#666666',
  icon: isDarkMode ? '#b4b4b4' : '#666666',

  // Borders
  border: isDarkMode ? '#333333' : '#e5e5e5',

  // Shadows
  dropdownShadow: isDarkMode
    ? '0 4px 24px rgba(0, 0, 0, 0.4)'
    : '0 4px 24px rgba(0, 0, 0, 0.12)'
})

// Shared button style generator
export const getIconButtonStyle = (isDarkMode: boolean): React.CSSProperties => ({
  width: `${UI_SIZES.iconButton.width}px`,
  height: `${UI_SIZES.iconButton.height}px`,
  borderRadius: `${UI_SIZES.iconButton.borderRadius}px`,
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  outline: 'none',
  transition: 'background-color 0.15s ease',
  color: getUIColors(isDarkMode).icon
})

// Shared pill button style generator
export const getPillButtonStyle = (isDarkMode: boolean): React.CSSProperties => {
  const colors = getUIColors(isDarkMode)
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${UI_SIZES.pillButton.gap}px`,
    padding: `${UI_SIZES.pillButton.paddingY}px ${UI_SIZES.pillButton.paddingX}px`,
    height: `${UI_SIZES.pillButton.height}px`,
    borderRadius: `${UI_SIZES.pillButton.borderRadius}px`,
    backgroundColor: colors.pillBg,
    border: 'none',
    color: colors.text,
    fontWeight: 500,
    fontSize: `${UI_SIZES.pillButton.fontSize}px`,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.15s ease',
    flexShrink: 0
  }
}

// Shared dropdown style generator
export const getDropdownStyle = (isDarkMode: boolean): React.CSSProperties => {
  const colors = getUIColors(isDarkMode)
  return {
    position: 'absolute',
    backgroundColor: colors.dropdownBg,
    borderRadius: `${UI_SIZES.dropdown.borderRadius}px`,
    padding: `${UI_SIZES.dropdown.padding}px`,
    minWidth: `${UI_SIZES.dropdown.minWidth}px`,
    boxShadow: colors.dropdownShadow,
    border: `1px solid ${colors.border}`,
    zIndex: 1000
  }
}
