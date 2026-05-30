/**
 * Theme Presets Registry
 * All available theme presets in one place
 */

import { ThemePreset, Theme } from '../themeTypes';
import { defaultLightPreset, defaultLightTheme } from './defaultLight';
import { defaultDarkPreset, defaultDarkTheme } from './defaultDark';
import { amberBluePreset, amberBlueTheme } from './amberBlue';
import { midnightTealPreset, midnightTealTheme } from './midnightTeal';
import { roseGoldPreset, roseGoldTheme } from './roseGold';
import { oceanBluePreset, oceanBlueTheme } from './oceanBlue';
import { highContrastPreset, highContrastTheme } from './highContrast';

// Presets list
export const themePresets: ThemePreset[] = [
  defaultLightPreset,
  defaultDarkPreset,
  amberBluePreset,
  midnightTealPreset,
  roseGoldPreset,
  oceanBluePreset,
  highContrastPreset,
];

// Full themes with IDs
export const themes: Theme[] = [
  defaultLightTheme,
  defaultDarkTheme,
  amberBlueTheme,
  midnightTealTheme,
  roseGoldTheme,
  oceanBlueTheme,
  highContrastTheme,
];

// Helper functions
export function getPresetByKey(key: string): ThemePreset | undefined {
  return themePresets.find(preset => preset.presetKey === key);
}

export function getThemeById(id: string): Theme | undefined {
  return themes.find(theme => theme.id === id);
}

export function getThemesByCategory(category: ThemePreset['category']): ThemePreset[] {
  return themePresets.filter(preset => preset.category === category);
}

export function getDefaultLightTheme(): Theme {
  return defaultLightTheme;
}

export function getDefaultDarkTheme(): Theme {
  return defaultDarkTheme;
}

// Preset keys for easy reference
export const PresetKeys = {
  DEFAULT_LIGHT: 'defaultLight',
  DEFAULT_DARK: 'defaultDark',
  AMBER_BLUE: 'amberBlue',
  MIDNIGHT_TEAL: 'midnightTeal',
  ROSE_GOLD: 'roseGold',
  OCEAN_BLUE: 'oceanBlue',
  HIGH_CONTRAST: 'highContrast',
} as const;

export type PresetKey = typeof PresetKeys[keyof typeof PresetKeys];
