/**
 * High Contrast Theme
 * Maximum accessibility and readability (WCAG AAA compliant)
 */

import { ThemePreset } from '../themeTypes';

export const highContrastPreset: ThemePreset = {
  id: 'preset-high-contrast',
  presetKey: 'highContrast',
  name: 'High Contrast',
  description: 'Maximum accessibility and readability (WCAG AAA)',
  category: 'custom',
  sortOrder: 7,
  
  colors: {
    // Primary - Pure black
    primary: '#000000',
    primaryLight: '#1a1a1a',
    primaryDark: '#000000',
    
    // Secondary - Pure blue
    secondary: '#0000ff',
    secondaryLight: '#0000ff',
    secondaryDark: '#00008b',
    
    // Background - Pure white
    background: '#ffffff',
    backgroundAlt: '#ffffff',
    
    // Surface - White
    surface: '#ffffff',
    surfaceAlt: '#ffffff',
    
    // Text - Pure black
    text: '#000000',
    textSecondary: '#000000',
    textMuted: '#333333',
    
    // Border - Pure black
    border: '#000000',
    borderLight: '#cccccc',
    
    // Status colors - High contrast
    success: '#000000',
    successLight: '#00cc00',
    warning: '#000000',
    warningLight: '#ffcc00',
    error: '#000000',
    errorLight: '#ff0000',
    info: '#000000',
    infoLight: '#0066ff',
  },
  
  fonts: {
    heading: 'Arial, Helvetica, sans-serif',
    body: 'Arial, Helvetica, sans-serif',
    mono: '"Courier New", monospace',
  },
  
  borderRadius: '0rem',
  spacing: '1rem',
  accentEmoji: '♿',
};

export const highContrastTheme = {
  id: 'theme-high-contrast',
  name: 'High Contrast',
  ...highContrastPreset,
  isDark: false,
  wcagLevel: 'AAA' as const,
  enhancedFocus: true,
} as any;
