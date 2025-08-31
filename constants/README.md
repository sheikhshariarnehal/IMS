# 🎨 Centralized Color System

This directory contains the centralized color palette for the entire application. By using this system, you can change the entire app's color scheme from one file.

## 📁 Files

- `theme-colors.ts` - Main color palette and theme definitions

## 🚀 Quick Start

### To Change App Colors:
1. Open `constants/theme-colors.ts`
2. Modify colors in the `THEME_COLORS` object
3. All components will automatically update

### Example: Change Primary Color
```typescript
// In theme-colors.ts
export const THEME_COLORS = {
  primary: {
    500: '#3b82f6',  // Change this to your preferred color
    600: '#2563eb',  // Darker shade
    // ... other shades
  }
}
```

## 🎯 Usage Patterns

### Method 1: Using Theme Context (Recommended)
```typescript
import { useTheme } from '@/contexts/ThemeContext';

const MyComponent = () => {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.colors.primary,        // ✅ Adapts to light/dark
      color: theme.colors.text.primary,
    }
  });
}
```

### Method 2: Direct Import
```typescript
import { QUICK_COLORS } from '@/constants/theme-colors';

const styles = StyleSheet.create({
  button: {
    backgroundColor: QUICK_COLORS.PRIMARY,        // ✅ Quick access
  }
});
```

### Method 3: Navigation Colors
```typescript
const styles = StyleSheet.create({
  activeTab: {
    color: theme.colors.navigation.active,        // ✅ Semantic naming
  },
  inactiveTab: {
    color: theme.colors.navigation.inactive,
  }
});
```

## 🏗️ Color Structure

### Primary Palette
- `primary[500]` - Main brand color
- `primary[600]` - Slightly darker
- `primary[700]` - Even darker
- Used for: Buttons, links, active states

### Semantic Colors
- `navigation.active` - Active navigation items
- `navigation.inactive` - Inactive navigation items  
- `text.primary` - Main text color
- `text.secondary` - Secondary text color
- `status.success` - Success states
- `status.error` - Error states

### Surface Colors
- `surface.primary` - Main backgrounds
- `surface.secondary` - Subtle backgrounds
- `card` - Card backgrounds

## 🌙 Light/Dark Theme Support

Both light and dark variants are automatically handled:

```typescript
// This automatically adapts to light/dark mode
const { theme, isDark } = useTheme();

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,  // White in light, dark in dark mode
    color: theme.colors.text.primary,         // Dark text in light, light text in dark
  }
});
```

## 🔧 Customization Examples

### Change to Red Theme
```typescript
export const THEME_COLORS = {
  primary: {
    500: '#ef4444',  // Red
    600: '#dc2626',
    700: '#b91c1c',
  },
  semantic: {
    navigation: {
      active: '#dc2626',  // Red for active states
    }
  }
}
```

### Change to Green Theme
```typescript
export const THEME_COLORS = {
  primary: {
    500: '#10b981',  // Green
    600: '#059669',
    700: '#047857',
  }
}
```

## 📝 Best Practices

1. **Always use theme context** for components that need to adapt to light/dark mode
2. **Use semantic colors** (`navigation.active`) instead of raw colors (`#2563eb`)
3. **Test in both light and dark modes** when making changes
4. **Use Quick Colors** for one-off styles that don't need theme adaptation
5. **Document color changes** when modifying the palette

## 🎨 Current Color Scheme

The app currently uses a **blue-based theme** inspired by the dashboard design:
- Primary: Blue (`#2563eb`)
- Accent: Sky Blue (`#0ea5e9`)
- Text: Slate Gray shades
- Status: Standard success/warning/error colors

## 🔄 Migration from Hardcoded Colors

If you find hardcoded colors in components:

```typescript
// ❌ Before
backgroundColor: '#8B5CF6',  // Purple hardcoded

// ✅ After  
backgroundColor: theme.colors.navigation.active,  // Uses theme
```

This ensures consistency and makes the app themeable! 