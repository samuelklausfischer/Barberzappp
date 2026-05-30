/**
 * Default Light Theme
 * Clean, minimalist design with fresh colors
 */

import { ThemePreset } from '../themeTypes';

export const defaultLightPreset: ThemePreset = {
  id: 'preset-default-light',
  presetKey: 'defaultLight',
  name: 'Default Light',
  description: 'Clean and minimalist light theme',
  category: 'light',
  sortOrder: 1,
  
  colors: {
    // Primary - Blue
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    
    // Secondary - Indigo
    secondary: '#6366f1',
    secondaryLight: '#818cf8',
    secondaryDark: '#4f46e5',
    
    // Background
    background: '#ffffff',
    backgroundAlt: '#f3f4f6',
    
    // Surface
    surface: '#ffffff',
    surfaceAlt: '#f9fafb',
    
    // Text
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    
    // Border
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    
    // Status
    success: '#10b981',
    successLight: '#34d399',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    error: '#ef4444',
    errorLight: '#f87171',
    info: '#3b82f6',
    infoLight: '#60a5fa',
  },
  
  fonts: {
    heading: 'Inter, system-ui, -apple-system, sans-serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, "Fira Code", monospace',
  },
  
  borderRadius: '0.5rem',
  spacing: '1rem',
  accentEmoji: '🌟',
};

export const defaultLightTheme = {
  id: 'theme-default-light',
  name: 'Default Light',
  ...defaultLightPreset,
  isDark: false,
};
