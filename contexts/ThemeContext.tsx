import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeStorage from '../utils/safeStorage';
import { THEME_COLORS, DARK_THEME_COLORS } from '@/constants/theme-colors';

// Use safe storage for web environment to handle localStorage issues
const isWeb = typeof window !== 'undefined';
const storage = isWeb ? SafeStorage : AsyncStorage;

// Light theme colors using centralized color palette
const lightTheme = {
  colors: {
    primary: THEME_COLORS.primary[600],              // #2563eb
    primaryLight: THEME_COLORS.primary[500],         // #3b82f6
    primaryDark: THEME_COLORS.primary[700],          // #1d4ed8
    navy: THEME_COLORS.primary[800],                 // #1e40af
    accent: THEME_COLORS.accent[500],                // #0ea5e9
    background: THEME_COLORS.semantic.surface.primary,           // #ffffff
    backgroundSecondary: THEME_COLORS.neutral[100],  // #f1f5f9
    backgroundTertiary: THEME_COLORS.neutral[50],    // #f8fafc
    card: THEME_COLORS.semantic.surface.primary,     // #ffffff
    input: THEME_COLORS.semantic.surface.tertiary,   // #f1f5f9
    text: {
      primary: THEME_COLORS.semantic.text.primary,   // #1e293b
      secondary: THEME_COLORS.semantic.text.secondary, // #64748b
      muted: THEME_COLORS.semantic.text.muted,       // #94a3b8
      inverse: THEME_COLORS.semantic.text.inverse,   // #ffffff
    },
    status: {
      success: THEME_COLORS.status.success[500],     // #10b981
      warning: THEME_COLORS.status.warning[500],     // #f59e0b
      error: THEME_COLORS.status.error[500],         // #ef4444
      info: THEME_COLORS.status.info[500],           // #3b82f6
    },
    border: THEME_COLORS.semantic.border.default,    // #e2e8f0
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Navigation specific colors
    navigation: {
      background: THEME_COLORS.semantic.navigation.background,
      border: THEME_COLORS.semantic.navigation.border,
      active: THEME_COLORS.semantic.navigation.active,
      inactive: THEME_COLORS.semantic.navigation.inactive,
      accent: THEME_COLORS.semantic.navigation.accent,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

// Dark theme colors using centralized color palette
const darkTheme = {
  colors: {
    primary: DARK_THEME_COLORS.primary[500],         // #3b82f6
    primaryLight: DARK_THEME_COLORS.primary[400],    // #60a5fa
    primaryDark: DARK_THEME_COLORS.primary[600],     // #2563eb
    navy: DARK_THEME_COLORS.primary[700],            // #1d4ed8
    accent: DARK_THEME_COLORS.accent[500],           // #0ea5e9
    background: DARK_THEME_COLORS.semantic.surface.secondary,    // #0f172a
    backgroundSecondary: DARK_THEME_COLORS.semantic.surface.primary,  // #1e293b
    backgroundTertiary: DARK_THEME_COLORS.semantic.surface.tertiary,  // #334155
    card: DARK_THEME_COLORS.semantic.surface.primary,           // #1e293b
    input: DARK_THEME_COLORS.semantic.surface.tertiary,         // #334155
    text: {
      primary: DARK_THEME_COLORS.semantic.text.primary,         // #f8fafc
      secondary: DARK_THEME_COLORS.semantic.text.secondary,     // #cbd5e1
      muted: DARK_THEME_COLORS.semantic.text.muted,             // #94a3b8
      inverse: DARK_THEME_COLORS.semantic.text.inverse,         // #1e293b
    },
    status: {
      success: DARK_THEME_COLORS.status.success[500],           // #10b981
      warning: DARK_THEME_COLORS.status.warning[500],           // #f59e0b
      error: DARK_THEME_COLORS.status.error[500],               // #ef4444
      info: DARK_THEME_COLORS.status.info[500],                 // #3b82f6
    },
    border: DARK_THEME_COLORS.semantic.border.default,          // #475569
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Navigation specific colors
    navigation: {
      background: DARK_THEME_COLORS.semantic.navigation.background,
      border: DARK_THEME_COLORS.semantic.navigation.border,
      active: DARK_THEME_COLORS.semantic.navigation.active,
      inactive: DARK_THEME_COLORS.semantic.navigation.inactive,
      accent: DARK_THEME_COLORS.semantic.navigation.accent,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await storage.getItem('themePreference');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await storage.setItem('themePreference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Memoize the theme value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}