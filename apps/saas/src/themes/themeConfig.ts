/**
 * Theme Configuration for BarberZap
 * 
 * Centralized theme configuration with colors, spacing, shadows, and Tailwind config extensions.
 */

// ============================================================================
// Color Palettes
// ============================================================================

export const colorPalettes = {
  // Primary brand colors
  primary: {
    DEFAULT: '#f4c025',
    50: '#fffcf2',
    100: '#fff6d8',
    200: '#ffeab1',
    300: '#ffdd8a',
    400: '#ffd163',
    500: '#f4c025',
    600: '#d9a419',
    700: '#b89116',
    800: '#997616',
    900: '#7c6214',
    950: '#42330b',
  },

  // Secondary/Action colors
  secondary: {
    DEFAULT: '#ffffff',
    50: '#fefefe',
    100: '#fdfdfd',
    200: '#fcfcfc',
    300: '#fbfbfb',
    400: '#fafafa',
    500: '#ffffff',
    600: '#f5f5f5',
    700: '#e5e5e5',
    800: '#d4d4d4',
    900: '#a3a3a3',
    950: '#525252',
  },

  // Success colors
  success: {
    DEFAULT: '#22c55e',
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Warning/Info colors
  warning: {
    DEFAULT: '#eab308',
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },

  // Error/Danger colors
  error: {
    DEFAULT: '#ef4444',
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
};

// ============================================================================
// Dark Mode Backgrounds
// ============================================================================

export const backgroundColors = {
  dark: {
    primary: '#09090b',    // zinc-950
    secondary: '#18181b',  // zinc-900
    tertiary: '#27272a',   // zinc-800
    card: '#18181b',       // zinc-900
    overlay: 'rgba(9, 9, 11, 0.8)',
  },
  light: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    card: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },
};

// ============================================================================
// Gradients
// ============================================================================

export const gradients = {
  // Background gradients
  background: {
    dark: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #000000 100%)',
    light: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #f3f4f6 100%)',
  },

  // Card gradients
  card: {
    gold: 'linear-gradient(135deg, rgba(244, 192, 37, 0.1) 0%, rgba(244, 192, 37, 0.05) 50%, transparent 100%)',
    default: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
  },

  // Button gradients
  button: {
    primary: 'linear-gradient(135deg, #f4c025 0%, #d9a419 100%)',
    secondary: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },

  // Overlay gradients
  overlay: {
    dark: 'linear-gradient(180deg, transparent 0%, rgba(9, 9, 11, 0.8) 100%)',
    light: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.8) 100%)',
  },
};

// ============================================================================
// Spacing Scale
// ============================================================================

export const spacingScale = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
  '5xl': '8rem',   // 128px
};

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
};

// ============================================================================
// Custom Shadows
// ============================================================================

export const shadows = {
  // Subtle shadows for depth
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  // Default card shadow
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  // Elevated element shadow
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Large card shadow
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Modal/popup shadow
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Inner shadow for depth
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Glow effects
  glow: {
    primary: '0 0 20px rgba(244, 192, 37, 0.3)',
    gold: '0 0 30px rgba(244, 192, 37, 0.4)',
    error: '0 0 20px rgba(239, 68, 68, 0.3)',
    success: '0 0 20px rgba(34, 197, 94, 0.3)',
  },
  
  // Colored shadows
  colored: {
    primary: '0 4px 15px rgba(244, 192, 37, 0.3)',
    red: '0 4px 15px rgba(239, 68, 68, 0.3)',
    green: '0 4px 15px rgba(34, 197, 94, 0.3)',
  },
};

// ============================================================================
// Typography
// ============================================================================

export const typography = {
  fontFamily: {
    heading: 'Manrope, system-ui, sans-serif',
    body: 'Manrope, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
  },
  
  fontWeight: {
    light: '200',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// ============================================================================
// Animation Durations
// ============================================================================

export const animations = {
  duration: {
    fast: '150ms',
    base: '300ms',
    slow: '500ms',
    slower: '700ms',
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// ============================================================================
// Tailwind Config Extension
// ============================================================================

export const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: colorPalettes.primary,
        success: colorPalettes.success,
        warning: colorPalettes.warning,
        error: colorPalettes.error,
      },
      spacing: spacingScale,
      borderRadius: borderRadius,
      boxShadow: {
        ...shadows,
        'glow-primary': shadows.glow.primary,
        'glow-gold': shadows.glow.gold,
        'glow-error': shadows.glow.error,
        'shadow-primary': shadows.colored.primary,
        'shadow-red': shadows.colored.red,
        'shadow-green': shadows.colored.green,
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      transitionDuration: animations.duration,
      transitionTimingFunction: animations.easing,
      backgroundImage: {
        'gradient-dark': gradients.background.dark,
        'gradient-gold': gradients.card.gold,
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite linear',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'none',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
    },
  },
};

// ============================================================================
// Theme Defaults
// ============================================================================

export const defaultTheme = {
  mode: 'dark',
  colors: colorPalettes.primary,
  background: backgroundColors.dark,
  spacing: spacingScale,
  borderRadius: borderRadius.xl,
  shadow: shadows.md,
  transition: {
    duration: animations.duration.base,
    easing: animations.easing.default,
  },
};

export default {
  colors: colorPalettes,
  backgrounds: backgroundColors,
  gradients,
  spacing: spacingScale,
  borderRadius,
  shadows,
  typography,
  animations,
  tailwindConfig,
  defaultTheme,
};
