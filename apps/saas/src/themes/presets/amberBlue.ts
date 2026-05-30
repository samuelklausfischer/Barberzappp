/**
 * Amber & Blue Theme
 * Professional and trustworthy color scheme
 */

import { ThemePreset } from '../themeTypes';

export const amberBluePreset: ThemePreset = {
  id: 'preset-amber-blue',
  presetKey: 'amberBlue',
  name: 'Amber & Blue',
  description: 'Professional and trustworthy color scheme',
  category: 'light',
  sortOrder: 3,
  
  colors: {
    // Primary - Amber/Gold
    primary: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
    
    // Secondary - Blue
    secondary: '#3b82f6',
    secondaryLight: '#60a5fa',
    secondaryDark: '#2563eb',
    
    // Background - Warm cream
    background: '#fef3c7',
    backgroundAlt: '#fdf6e3',
    
    // Surface - White
    surface: '#ffffff',
    surfaceAlt: '#fef3c7',
    
    // Text - Deep indigo
    text: '#1e1b4b',
    textSecondary: '#4338ca',
    textMuted: '#6366f1',
    
    // Border - Warm gold
    border: '#fcd34d',
    borderLight: '#fde68a',
    
    // Status
    success: '#059669',
    successLight: '#10b981',
    warning: '#d97706',
    warningLight: '#f59e0b',
    error: '#dc2626',
    errorLight: '#ef4444',
    info: '#3b82f6',
    infoLight: '#60a5fa',
  },
  
  fonts: {
    heading: '"Playfair Display", Georgia, serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
    mono: '"Fira Code", monospace',
  },
  
  borderRadius: '0.375rem',
  spacing: '1rem',
  accentEmoji: '✂️',
};

export const amberBlueTheme = {
  id: 'theme-amber-blue',
  name: 'Amber & Blue',
  ...amberBluePreset,
  isDark: false,
};
