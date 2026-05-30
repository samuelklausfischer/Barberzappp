/**
 * Ocean Blue Theme
 * Fresh and calming coastal vibes
 */

import { ThemePreset } from '../themeTypes';

export const oceanBluePreset: ThemePreset = {
  id: 'preset-ocean-blue',
  presetKey: 'oceanBlue',
  name: 'Ocean Blue',
  description: 'Fresh and calming coastal vibes',
  category: 'light',
  sortOrder: 6,
  
  colors: {
    // Primary - Sky blue
    primary: '#0284c7',
    primaryLight: '#0ea5e9',
    primaryDark: '#0369a1',
    
    // Secondary - Cyan
    secondary: '#06b6d4',
    secondaryLight: '#22d3ee',
    secondaryDark: '#0891b2',
    
    // Background - Light sky
    background: '#f0f9ff',
    backgroundAlt: '#e0f2fe',
    
    // Surface - White
    surface: '#ffffff',
    surfaceAlt: '#f0f9ff',
    
    // Text - Deep ocean blue
    text: '#0c4a6e',
    textSecondary: '#0369a1',
    textMuted: '#7dd3fc',
    
    // Border - Light blue
    border: '#bae6fd',
    borderLight: '#e0f2fe',
    
    // Status colors with ocean tones
    success: '#059669',
    successLight: '#10b981',
    warning: '#d97706',
    warningLight: '#f59e0b',
    error: '#dc2626',
    errorLight: '#ef4444',
    info: '#0284c7',
    infoLight: '#0ea5e9',
  },
  
  fonts: {
    heading: 'Poppins, system-ui, sans-serif',
    body: 'Poppins, system-ui, sans-serif',
    mono: '"PT Mono", monospace',
  },
  
  borderRadius: '0.75rem',
  spacing: '1rem',
  accentEmoji: '🌊',
};

export const oceanBlueTheme = {
  id: 'theme-ocean-blue',
  name: 'Ocean Blue',
  ...oceanBluePreset,
  isDark: false,
};
