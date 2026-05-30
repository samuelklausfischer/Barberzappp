/**
 * Advanced Theme Types for BarberZap
 * Supports multiple theme modes including light, dark, custom, and accessibility
 */

// ============================================================================
// Color Scales (10+ shades for each color)
// ============================================================================

export interface ColorScale {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Background and surface
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
}

// ============================================================================
// Font Configuration
// ============================================================================

export interface FontConfig {
  heading: string;      // H1-H6 fonts
  body: string;         // Paragraph, span, etc.
  mono: string;         // Code, data fields, etc.
}

// ============================================================================
// Spacing Configuration
// ============================================================================

export interface SpacingConfig {
  xs: string;    // 0.25rem
  sm: string;    // 0.5rem
  md: string;    // 1rem
  lg: string;    // 1.5rem
  xl: string;    // 2rem
  '2xl': string; // 3rem
  '3xl': string; // 4rem
}

// ============================================================================
// Theme Configuration
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  
  // Color scales with 20+ properties
  colors: ColorScale;
  
  // Font families
  fonts: FontConfig;
  
  // UI tokens
  borderRadius: string;
  spacing: string;
  
  // Branding
  accentEmoji?: string;
  logoUrl?: string;
  faviconUrl?: string;
  
  // Custom injection
  customCss?: string;
  
  // Meta
  isDark?: boolean;
  category?: 'light' | 'dark' | 'custom' | 'accessibility';
  presetKey?: string;
}

// ============================================================================
// Theme Preset
// ============================================================================

export interface ThemePreset {
  id: string;
  presetKey: string;
  name: string;
  description?: string;
  colors: ColorScale;
  fonts: FontConfig;
  borderRadius: string;
  spacing: string;
  accentEmoji?: string;
  category: 'light' | 'dark' | 'custom';
  sortOrder?: number;
}

// ============================================================================
// Shop Theme (Database Model)
// ============================================================================

export interface ShopTheme {
  id: string;
  shopId: string;
  themeName: string;
  colors: ColorScale;
  fonts: FontConfig;
  borderRadius: string;
  spacing: string;
  customCss?: string;
  logoUrl?: string;
  faviconUrl?: string;
  accentEmoji?: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Theme Context
// ============================================================================

export interface ThemeContextType {
  // Current theme
  theme: Theme;
  activeThemeId: string;
  isDark: boolean;
  
  // Theme management
  setActiveTheme: (themeId: string, theme?: Theme) => void;
  toggleDarkMode: () => void;
  resetToDefault: () => void;
  
  // Custom theme
  loadCustomTheme: (shopId: string) => Promise<Theme | null>;
  saveCustomTheme: (shopId: string, theme: Partial<Theme>) => Promise<void>;
  
  // Preview
  previewTheme: (theme: Theme) => void;
  clearPreview: () => void;
  
  // Available themes
  presets: ThemePreset[];
  isLoading: boolean;
}

// ============================================================================
// Theme Action Types
// ============================================================================

export type ThemeAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'PREVIEW_THEME'; payload: Theme }
  | { type: 'CLEAR_PREVIEW' }
  | { type: 'LOAD_THEME_START' }
  | { type: 'LOAD_THEME_SUCCESS'; payload: Theme }
  | { type: 'LOAD_THEME_ERROR'; payload: Error }
  | { type: 'RESET_THEME' };

// ============================================================================
// Custom Theme Input (for forms/updates)
// ============================================================================

export interface CustomThemeInput {
  themeName?: string;
  colors?: Partial<ColorScale>;
  fonts?: Partial<FontConfig>;
  borderRadius?: string;
  spacing?: string;
  accentEmoji?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

// ============================================================================
// Theme Validation
// ============================================================================

export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  level: 'fail' | 'AA' | 'AAA';
  suggestion?: string;
}

// ============================================================================
// Component Theme Props
// ============================================================================

export interface ThemedComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  theme?: Theme;
}

export interface ThemedStyles {
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  [key: string]: any;
}

// ============================================================================
// Theme CSS Variables
// ============================================================================

export type ThemeCSSVariableName =
  | `--color-${keyof ColorScale}`
  | `--font-${keyof FontConfig extends string ? keyof FontConfig : never}`
  | `--border-radius`
  | `--spacing`
  | `--accent-emoji`;

export interface ThemeCSSVariables {
  [K: string]: string;
}

// ============================================================================
// High Contrast Theme (Accessibility)
// ============================================================================

export interface HighContrastTheme extends Theme {
  category: 'accessibility';
  wcagLevel: 'AA' | 'AAA';
  enhancedFocus: boolean;
  reducedMotion?: boolean;
}

// ============================================================================
// Theme Export/Import
// ============================================================================

export interface ThemeExport {
  version: string;
  theme: Theme;
  exportedAt: string;
  shopId?: string;
}

export interface ThemeImport {
  theme: Theme;
  options?: {
    merge?: boolean;
    preserveAssets?: boolean;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isColorScale(value: any): value is ColorScale {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.primary === 'string' &&
    typeof value.secondary === 'string' &&
    typeof value.background === 'string' &&
    typeof value.surface === 'string' &&
    typeof value.text === 'string' &&
    typeof value.border === 'string'
  );
}

export function isFontConfig(value: any): value is FontConfig {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.heading === 'string' &&
    typeof value.body === 'string' &&
    typeof value.mono === 'string'
  );
}

export function isTheme(value: any): value is Theme {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isColorScale(value.colors) &&
    isFontConfig(value.fonts)
  );
}

// ============================================================================
// Utility Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'custom';
export type ThemeCategory = 'light' | 'dark' | 'custom' | 'accessibility';
export type ColorName = keyof ColorScale;
export type FontName = keyof FontConfig;

export type ThemeColor = {
  name: string;
  value: string;
  shade?: number;
};

export type ThemePalette = ThemeColor[];

export type ThemeGradient = {
  from: string;
  to: string;
  deg?: number;
};

export type ThemeShadow = {
  small: string;
  medium: string;
  large: string;
};

// ============================================================================
// Default values
// ============================================================================

export const DEFAULT_BORDER_RADIUS = '0.5rem';
export const DEFAULT_SPACING = '1rem';
export const DEFAULT_FONT_HEADING = 'Inter, system-ui, sans-serif';
export const DEFAULT_FONT_BODY = 'Inter, system-ui, sans-serif';
export const DEFAULT_FONT_MONO = 'JetBrains Mono, monospace';
export const DEFAULT_ACCENT_EMOJI = '💈';

export const THEME_STORAGE_KEY = 'barberzap_theme';
export const THEME_MODE_KEY = 'barberzap_theme_mode';
export const CUSTOM_THEME_KEY_PREFIX = 'barberzap_custom_theme_';
