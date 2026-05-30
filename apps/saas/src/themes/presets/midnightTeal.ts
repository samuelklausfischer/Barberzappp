/**
 * Midnight Teal Theme
 * Classic barbershop feel with modern touches
 */

import { ThemePreset } from '../themeTypes';

export const midnightTealPreset: ThemePreset = {
  id: 'preset-midnight-teal',
  presetKey: 'midnightTeal',
  name: 'Midnight Teal',
  description: 'Classic barbershop feel with modern touches',
  category: 'dark',
  sortOrder: 4,
  
  colors: {
    // Primary - Teal
    primary: '#14b8a6',
    primaryLight: '#2dd4bf',
    primaryDark: '#0d9488',
    
    // Secondary - Dark slate
    secondary: '#1e293b',
    secondaryLight: '#334155',
    secondaryDark: '#0f172a',
    
    // Background - Very dark blue/gray
    background: '#0f172a',
    backgroundAlt: '#1e293b',
    
    // Surface - Dark slate
    surface: '#1e2937',
    surfaceAlt: '#334155',
    
    // Text - Light gray
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    
    // Border - Slate
    border: '#334155',
    borderLight: '#475569',
    
    // Status colors (with teal accent)
    success: '#14b8a6',
    successLight: '#2dd4bf',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    error: '#ef4444',
    errorLight: '#f87171',
    info: '#0ea5e9',
    infoLight: '#38bdf8',
  },
  
  fonts: {
    heading: '"Oswald", "Arial Black", sans-serif',
    body: '"Open Sans", system-ui, sans-serif',
    mono: '"Space Mono", monospace',
  },
  
  borderRadius: '0.25rem',
  spacing: '1.25rem',
  accentEmoji: '🎩',
};

export const midnightTealTheme = {
  id: 'theme-midnight-teal',
  name: 'Midnight Teal',
  ...midnightTealPreset,
  isDark: true,
};
