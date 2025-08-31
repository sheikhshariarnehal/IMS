// Central Color Palette - Based on Dashboard Blue Theme
// Change colors here to update the entire app's color scheme

export const THEME_COLORS = {
  // Primary Blue Palette (Main brand colors)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main primary color
    600: '#2563eb',  // Primary dark
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Accent Blue Palette
  accent: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main accent color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral/Gray Palette
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Status Colors
  status: {
    success: {
      50: '#f0fdf4',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
  },

  // Semantic Color Mappings
  semantic: {
    // Navigation & Interactive Elements
    navigation: {
      background: '#ffffff',
      border: '#e2e8f0',
      active: '#2563eb',        // Primary blue for active states
      inactive: '#94a3b8',      // Muted gray for inactive states
      accent: '#3b82f6',        // Slightly lighter blue for highlights
    },

    // Buttons & CTAs
    button: {
      primary: '#2563eb',       // Main button color
      primaryHover: '#1d4ed8',  // Hover state
      secondary: '#f1f5f9',     // Secondary button background
      danger: '#ef4444',        // Destructive actions
      success: '#10b981',       // Success actions
    },

    // Cards & Surfaces
    surface: {
      primary: '#ffffff',       // Main card background
      secondary: '#f8fafc',     // Subtle background
      tertiary: '#f1f5f9',      // Even more subtle
      elevated: '#ffffff',      // Elevated surfaces (modals, etc.)
    },

    // Text Colors
    text: {
      primary: '#1e293b',       // Main text
      secondary: '#64748b',     // Secondary text
      muted: '#94a3b8',         // Muted text
      inverse: '#ffffff',       // Text on dark backgrounds
      link: '#2563eb',          // Links
      disabled: '#cbd5e1',      // Disabled text
    },

    // Borders & Dividers
    border: {
      default: '#e2e8f0',       // Default borders
      light: '#f1f5f9',         // Light borders
      medium: '#cbd5e1',        // Medium emphasis
      dark: '#94a3b8',          // High emphasis
    },
  },
};

// Dark theme variations (when needed)
export const DARK_THEME_COLORS = {
  ...THEME_COLORS,
  semantic: {
    navigation: {
      background: '#1e293b',
      border: '#475569',
      active: '#3b82f6',
      inactive: '#94a3b8',
      accent: '#60a5fa',
    },
    button: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#334155',
      danger: '#ef4444',
      success: '#10b981',
    },
    surface: {
      primary: '#1e293b',
      secondary: '#0f172a',
      tertiary: '#334155',
      elevated: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
      inverse: '#1e293b',
      link: '#60a5fa',
      disabled: '#475569',
    },
    border: {
      default: '#475569',
      light: '#334155',
      medium: '#64748b',
      dark: '#94a3b8',
    },
  },
};

// Helper function to get theme colors
export const getThemeColors = (isDark: boolean = false) => {
  return isDark ? DARK_THEME_COLORS : THEME_COLORS;
};

// Quick access to commonly used colors
export const QUICK_COLORS = {
  // Primary actions
  PRIMARY: '#2563eb',
  PRIMARY_LIGHT: '#3b82f6', 
  PRIMARY_DARK: '#1d4ed8',
  
  // Navigation
  NAV_ACTIVE: '#2563eb',
  NAV_INACTIVE: '#94a3b8',
  
  // Backgrounds
  WHITE: '#ffffff',
  GRAY_50: '#f8fafc',
  GRAY_100: '#f1f5f9',
  
  // Text
  TEXT_PRIMARY: '#1e293b',
  TEXT_SECONDARY: '#64748b',
  TEXT_MUTED: '#94a3b8',
  
  // Status
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
}; 