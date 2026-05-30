/**
 * Default Dark Theme
 * Elegant dark mode for night use
 */

import { ThemePreset } from '../themeTypes';

export const defaultDarkPreset: ThemePreset = {
  id: 'preset-default-dark',
  presetKey: 'defaultDark',
  name: 'Default Dark',
  description: 'Elegant dark mode for night use',
  category: 'dark',
  sortOrder: 2,
  
  colors: {
    // Primary - Blue (lighter for dark background)
    primary: '#60a5fa',
    primaryLight: '#93c5fd',
    primaryDark: '#3b82f6',
    
    // Secondary - Indigo (lighter for contrast)
    secondary: '#818cf8',
    secondaryLight: '#a5b4fc',
    secondaryDark: '#6366f1',
    
    // Background - Dark gray/blue
    background: '#111827',
    backgroundAlt: '#1f2937',
    
    // Surface - Slightly lighter
    surface: '#1f2937',
    surfaceAlt: '#374151',
    
    // Text - Light for contrast
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    
    // Border - Medium gray
    border: '#374151',
    borderLight: '#4b5563',
    
    // Status colors adjusted for dark mode
    success: '#34d399',
    successLight: '#6ee7b7',
    warning: '#fbbf24',
    warningLight: '#fcd34d',
    error: '#f87171',
    errorLight: '#fca5a5',
    info: '#60a5fa',
    infoLight: '#93c5fd',
  },
  
  fonts: {
    heading: 'Inter, system-ui, -apple-system, sans-serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, "Fira Code", monospace',
  },
  
  borderRadius: '0.5rem',
  spacing: '1rem',
  accentEmoji: '🌙',
};

export const defaultDarkTheme = {
  id: 'theme-default-dark',
  name: 'Default Dark',
  ...defaultDarkPreset,
  isDark: true,
};
