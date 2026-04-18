/**
 * iOS-Inspired Theme Constants
 * Doctoringo AI brand colors with iOS design principles
 * Round, beautiful, clean with soft shadows and smooth animations
 */

// Brand Colors - Your colors with iOS presentation
export const BRAND_COLORS = {
  PRIMARY_BLUE: '#033C81', // Doctoringo AI Blue
  BLUE_LIGHT: '#e6f2ff',
  GOLD: '#E8A838', // Premium badges
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: '#8E8E93', // iOS Gray for subtle elements
} as const

// Text Colors - iOS style
export const TEXT_COLORS = {
  LIGHT: {
    PRIMARY: '#000000',
    SECONDARY: '#3C3C43', // iOS secondary text
    TERTIARY: '#8E8E93', // iOS tertiary text
  },
  DARK: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#EBEBF5', // iOS secondary text (dark)
    TERTIARY: '#8E8E93', // iOS tertiary text (dark)
  },
} as const

// Background Colors - iOS style
export const BG_COLORS = {
  LIGHT: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#F2F2F7', // iOS grouped background
    TERTIARY: '#E5E5EA', // iOS tertiary grouped background
    CARD: '#FFFFFF',
  },
  DARK: {
    PRIMARY: '#000000',
    SECONDARY: '#1C1C1E', // iOS grouped background (dark)
    TERTIARY: '#2C2C2E', // iOS tertiary grouped background (dark)
    CARD: '#1C1C1E',
  },
} as const

// Interactive States - iOS style with brand blue (very subtle and smooth)
export const INTERACTIVE_COLORS = {
  LIGHT: {
    HOVER: 'rgba(0, 0, 0, 0.03)', // Extremely subtle hover
    ACTIVE: 'rgba(3, 60, 129, 0.06)', // Brand blue tint
    BORDER: 'rgba(0, 0, 0, 0.06)',
    BORDER_HOVER: 'rgba(3, 60, 129, 0.12)',
    BORDER_ACTIVE: 'rgba(3, 60, 129, 0.2)',
  },
  DARK: {
    HOVER: 'rgba(255, 255, 255, 0.04)', // Extremely subtle hover
    ACTIVE: 'rgba(3, 60, 129, 0.12)', // Brand blue tint (dark)
    BORDER: 'rgba(255, 255, 255, 0.08)',
    BORDER_HOVER: 'rgba(255, 255, 255, 0.11)',
    BORDER_ACTIVE: 'rgba(3, 60, 129, 0.25)',
  },
} as const

// Sidebar - iOS style with glass morphism
export const SIDEBAR_COLORS = {
  LIGHT: {
    BG: 'rgba(242, 242, 247, 0.95)', // Glass effect
    BORDER: 'rgba(0, 0, 0, 0.08)',
    SHADOW: '0 0 20px rgba(0, 0, 0, 0.03)', // Soft shadow
    BLUR: 'blur(20px) saturate(180%)',
  },
  DARK: {
    BG: 'rgba(28, 28, 30, 0.95)', // Glass effect
    BORDER: 'rgba(255, 255, 255, 0.08)',
    SHADOW: '0 0 30px rgba(0, 0, 0, 0.5)', // Soft shadow
    BLUR: 'blur(20px) saturate(180%)',
  },
} as const

// Typography
export const TYPOGRAPHY = {
  SIZES: {
    XS: '11px',
    SM: '13px',
    BASE: '14px',
    MD: '15px',
    LG: '16px',
    XL: '18px',
    XXL: '20px',
  },
  WEIGHTS: {
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
} as const

// Spacing
export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '12px',
  LG: '14px',
  XL: '16px',
  XXL: '20px',
  XXXL: '24px',
} as const

// Border Radius - iOS style (more rounded, softer)
export const BORDER_RADIUS = {
  SM: '8px',   // iOS small radius
  MD: '10px',  // iOS standard radius
  LG: '13px',  // iOS large radius (cards, buttons)
  XL: '16px',  // iOS extra large
  FULL: '50%',
  PILL: '100px', // iOS pill shape
} as const

// Transitions - iOS style (smooth ease curves)
export const TRANSITIONS = {
  FAST: 'all 0.2s ease-out',
  DEFAULT: 'all 0.3s ease',
  SLOW: 'all 0.4s ease-in-out',
  SPRING: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)', // iOS spring
} as const

// iOS-style Shadows (subtle and soft)
export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
  MD: '0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.08)',
  LG: '0 4px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.12)',
  XL: '0 8px 16px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.16)',
  BRAND: '0 2px 8px rgba(3, 60, 129, 0.25)', // Brand color shadow
  BRAND_HOVER: '0 4px 12px rgba(3, 60, 129, 0.35)',
} as const

// Button Sizes
export const BUTTON_SIZES = {
  SMALL: {
    height: '32px',
    fontSize: TYPOGRAPHY.SIZES.SM,
    padding: '0 12px',
  },
  MEDIUM: {
    height: '36px',
    fontSize: TYPOGRAPHY.SIZES.BASE,
    padding: '0 14px',
  },
  LARGE: {
    height: '40px',
    fontSize: TYPOGRAPHY.SIZES.MD,
    padding: '0 16px',
  },
} as const

/**
 * Helper function to get theme colors based on mode
 */
export const getThemeColors = (isDarkMode: boolean) => ({
  text: isDarkMode ? TEXT_COLORS.DARK : TEXT_COLORS.LIGHT,
  bg: isDarkMode ? BG_COLORS.DARK : BG_COLORS.LIGHT,
  interactive: isDarkMode ? INTERACTIVE_COLORS.DARK : INTERACTIVE_COLORS.LIGHT,
  sidebar: isDarkMode ? SIDEBAR_COLORS.DARK : SIDEBAR_COLORS.LIGHT,
})
