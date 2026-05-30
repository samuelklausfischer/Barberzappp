/**
 * Theme Index
 * 
 * Centralized exports for theme-related functionality.
 */

// Theme Config
export {
  colorPalettes,
  backgroundColors,
  gradients,
  spacingScale,
  borderRadius,
  shadows,
  typography,
  animations,
  tailwindConfig,
  defaultTheme,
} from './themeConfig';
export { default as themeConfig } from './themeConfig';

// Simple Theme Provider (new)
export {
  ThemeProvider,
  useTheme,
  ThemeToggle,
  withTheme,
  type ThemeProviderProps,
  type ThemeContextType,
  type ThemeToggleProps,
  type ThemeMode,
} from './ThemeProviderSimple';
export { default as ThemeProviderSimple } from './ThemeProviderSimple';

// Existing Theme (complex)
export { ThemeProvider as ThemeProviderComplex, useTheme as useThemeComplex } from './ThemeProvider';

// Types
export type { Theme, ThemePreset, ThemeAction } from './themeTypes';
