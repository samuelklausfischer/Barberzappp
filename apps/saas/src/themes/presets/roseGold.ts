/**
 * Rose Gold Theme
 * Modern and luxurious feel
 */

import { ThemePreset } from '../themeTypes';

export const roseGoldPreset: ThemePreset = {
  id: 'preset-rose-gold',
  presetKey: 'roseGold',
  name: 'Rose Gold',
  description: 'Modern and luxurious feel',
  category: 'light',
  sortOrder: 5,
  
  colors: {
    // Primary - Rose
    primary: '#e11d48',
    primaryLight: '#f43f5e',
    primaryDark: '#be123c',
    
    // Secondary - Purple
    secondary: '#764af1',
    secondaryLight: '#8b5cf6',
    secondaryDark: '#6d28d9',
    
    // Background - Soft rose tint
    background: '#fff1f2',
    backgroundAlt: '#ffe4e6',
    
    // Surface - White
    surface: '#ffffff',
    surfaceAlt: '#fff1f2',
    
    // Text - Stone/earth tones
    text: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#a8a29e',
    
    // Border - Soft rose
    border: '#fecdd3',
    borderLight: '#fda4af',
    
    // Status colors with rose accents
    success: '#059669',
    successLight: '#10b981',
    warning: '#d97706',
    warningLight: '#f59e0b',
    error: '#dc2626',
    errorLight: '#ef4444',
    info: '#0891b2',
    infoLight: '#06b6d4',
  },
  
  fonts: {
    heading: '"DM Sans", system-ui, sans-serif',
    body: '"DM Sans", system-ui, sans-serif',
    mono: '"IBM Plex Mono", monospace',
  },
  
  borderRadius: '1rem',
  spacing: '1.25rem',
  accentEmoji: '🌸',
};

export const roseGoldTheme = {
  id: 'theme-rose-gold',
  name: 'Rose Gold',
  ...roseGoldPreset,
  isDark: false,
};
