/**
 * Themed Component Utilities
 * Helper functions and wrapper components for applying themes
 */

import React, { forwardRef, type HTMLAttributes } from 'react';
import { useTheme } from './ThemeProvider';
import { Theme, ThemedComponentProps, ThemedStyles } from './themeTypes';

// ============================================================================
// Style Helpers
// ============================================================================

/**
 * Get themed styles for a component based on the current theme
 */
export function getThemedStyles(
  theme: Theme,
  component: 'button' | 'card' | 'input' | 'text' | 'link',
  variant: ThemedComponentProps['variant'] = 'primary'
): ThemedStyles {
  const styles: ThemedStyles = {
    fontFamily: theme.fonts.body,
    borderRadius: theme.borderRadius,
  };
  
  switch (component) {
    case 'button':
      styles.fontFamily = theme.fonts.body;
      
      if (variant === 'primary') {
        styles.backgroundColor = theme.colors.primary;
        styles.color = theme.colors.background;
        styles.borderColor = theme.colors.primary;
      } else if (variant === 'secondary') {
        styles.backgroundColor = theme.colors.secondary;
        styles.color = theme.colors.background;
        styles.borderColor = theme.colors.secondary;
      } else if (variant === 'outline') {
        styles.backgroundColor = 'transparent';
        styles.color = theme.colors.primary;
        styles.borderColor = theme.colors.primary;
      } else { // ghost
        styles.backgroundColor = 'transparent';
        styles.color = theme.colors.text;
        styles.borderColor = 'transparent';
      }
      break;
    
    case 'card':
      styles.backgroundColor = theme.colors.surface;
      styles.color = theme.colors.text;
      styles.borderColor = theme.colors.border;
      styles.padding = theme.spacing;
      break;
    
    case 'input':
      styles.backgroundColor = theme.colors.backgroundAlt;
      styles.color = theme.colors.text;
      styles.borderColor = theme.colors.border;
      styles.fontSize = '1rem';
      break;
    
    case 'text':
      styles.color = theme.colors.text;
      styles.fontFamily = theme.fonts.body;
      break;
    
    case 'link':
      styles.color = theme.colors.primary;
      styles.textDecoration = 'underline';
      break;
  }
  
  return styles;
}

/**
 * Apply theme classes to component props
 */
export function applyThemeClasses(
  themedClass: string,
  theme: Theme
): string {
  const classes = [themedClass];
  
  // Add theme ID as data attribute
  classes.push(`theme-${theme.id}`);
  
  // Add dark mode class if needed
  if (theme.isDark) {
    classes.push('dark');
  }
  
  return classes.join(' ');
}

/**
 * Get CSS variables for a theme
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // Color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    variables[`--color-${key}`] = value;
  });
  
  // Font variables
  variables['--font-heading'] = theme.fonts.heading;
  variables['--font-body'] = theme.fonts.body;
  variables['--font-mono'] = theme.fonts.mono;
  
  // UI variables
  variables['--border-radius'] = theme.borderRadius;
  variables['--spacing'] = theme.spacing;
  
  return variables;
}

/**
 * Generate Tailwind-like CSS classes from theme
 */
export function generateTailwindClasses(theme: Theme): Record<string, string> {
  return {
    'bg-primary': `background-color: ${theme.colors.primary}`,
    'bg-secondary': `background-color: ${theme.colors.secondary}`,
    'bg-background': `background-color: ${theme.colors.background}`,
    'bg-surface': `background-color: ${theme.colors.surface}`,
    'text-primary': `color: ${theme.colors.text}`,
    'text-secondary': `color: ${theme.colors.textSecondary}`,
    'border-primary': `border-color: ${theme.colors.border}`,
    'rounded': `border-radius: ${theme.borderRadius}`,
  };
}

// ============================================================================
// Themed Components
// ============================================================================

export interface ThemedButtonProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, 'variant'>,
    ThemedComponentProps {}

/**
 * ThemedButton - Button component with theme support
 */
export const ThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ variant = 'primary', size = 'md', disabled, className = '', style, children, ...props }, ref) => {
    const { theme } = useTheme();
    const styles = getThemedStyles(theme, 'button', variant);
    
    const sizeStyles = {
      xs: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
      sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
      md: { padding: '0.5rem 1rem', fontSize: '1rem' },
      lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
      xl: { padding: '1rem 2rem', fontSize: '1.25rem' },
    };
    
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200
          hover:opacity-90 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        style={{
          ...styles,
          ...sizeStyles[size],
          ...style,
          opacity: disabled ? 0.5 : undefined,
          cursor: disabled ? 'not-allowed' : undefined,
        }}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ThemedButton.displayName = 'ThemedButton';

export interface ThemedCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

/**
 * ThemedCard - Card component with theme support
 */
export const ThemedCard = forwardRef<HTMLDivElement, ThemedCardProps>(
  ({ variant = 'default', className = '', style, children, ...props }, ref) => {
    const { theme } = useTheme();
    const styles = getThemedStyles(theme, 'card');
    
    const variantStyles = {
      default: {},
      elevated: { boxShadow: `0 4px 6px -1px ${theme.colors.border}40` },
      outlined: { borderWidth: '2px' },
    };
    
    return (
      <div
        ref={ref}
        className={className}
        style={{
          ...styles,
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ThemedCard.displayName = 'ThemedCard';

export interface ThemedInputProps extends HTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

/**
 * ThemedInput - Input component with theme support
 */
export const ThemedInput = forwardRef<HTMLInputElement, ThemedInputProps>(
  ({ label, error, className = '', style, children, ...props }, ref) => {
    const { theme } = useTheme();
    const styles = getThemedStyles(theme, 'input');
    
    return (
      <div>
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: theme.colors.textSecondary }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg border transition-colors
            focus:outline-none focus:ring-2
            ${error ? 'border-red-500 ring-red-500' : ''}
            ${className}
          `}
          style={{
            ...styles,
            borderColor: error ? theme.colors.error : theme.colors.border,
            focusRingColor: error ? theme.colors.error : theme.colors.primary,
            ...style,
          }}
          {...props}
        />
      </div>
    );
  }
);

ThemedInput.displayName = 'ThemedInput';

export interface ThemedTextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small' | 'muted';
}

/**
 * ThemedText - Text component with theme support
 */
export const ThemedText = forwardRef<HTMLParagraphElement, ThemedTextProps>(
  ({ variant = 'body', className = '', style, children, ...props }, ref) => {
    const { theme } = useTheme();
    
    const variantStyles = {
      h1: { fontSize: '2.25rem', fontWeight: '700', fontFamily: theme.fonts.heading },
      h2: { fontSize: '1.875rem', fontWeight: '600', fontFamily: theme.fonts.heading },
      h3: { fontSize: '1.5rem', fontWeight: '600', fontFamily: theme.fonts.heading },
      h4: { fontSize: '1.25rem', fontWeight: '600', fontFamily: theme.fonts.heading },
      h5: { fontSize: '1.125rem', fontWeight: '500', fontFamily: theme.fonts.heading },
      h6: { fontSize: '1rem', fontWeight: '500', fontFamily: theme.fonts.heading },
      body: { fontSize: '1rem', fontFamily: theme.fonts.body },
      small: { fontSize: '0.875rem', fontFamily: theme.fonts.body },
      muted: { fontSize: '1rem', color: theme.colors.textMuted, fontFamily: theme.fonts.body },
    };
    
    const styles = getThemedStyles(theme, 'text');
    
    return (
      <p
        ref={ref}
        className={className}
        style={{
          ...variantStyles[variant],
          color: variant === 'muted' ? theme.colors.textMuted : styles.color,
          ...style,
        }}
        {...props}
      >
        {children}
      </p>
    );
  }
);

ThemedText.displayName = 'ThemedText';

export interface ThemedLinkProps extends HTMLAttributes<HTMLAnchorElement> {}

/**
 * ThemedLink - Link component with theme support
 */
export const ThemedLink = forwardRef<HTMLAnchorElement, ThemedLinkProps>(
  ({ className = '', style, children, ...props }, ref) => {
    const { theme } = useTheme();
    const styles = getThemedStyles(theme, 'link');
    
    return (
      <a
        ref={ref}
        className={`
          hover:underline hover:opacity-80 transition-all
          ${className}
        `}
        style={{
          ...styles,
          ...style,
        }}
        {...props}
      >
        {children}
      </a>
    );
  }
);

ThemedLink.displayName = 'ThemedLink';

// ============================================================================
// Higher-Order Components (HOCs)
// ============================================================================

/**
 * HOC to make any component theme-aware
 */
export function withTheme<P extends { theme?: Theme }>(
  Component: React.ComponentType<P>
) {
  return function ThemedComponent(props: Omit<P, 'theme'>) {
    const { theme } = useTheme();
    return <Component {...(props as P)} theme={theme} />;
  };
}

/**
 * HOC to inject themed styles
 */
export function withThemedStyles<P extends { style?: React.CSSProperties }>(
  Component: React.ComponentType<P>,
  styleGetter: (theme: Theme) => React.CSSProperties
) {
  return function StyledComponent(props: P) {
    const { theme } = useTheme();
    const themedStyles = styleGetter(theme);
    return <Component {...props} style={{ ...themedStyles, ...props.style }} />;
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get themed styles for a component
 */
export function useThemedStyle<T extends Record<string, any>>(
  styleGetter: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return styleGetter(theme);
}

/**
 * Hook to get a themed color
 */
export function useThemedColor(colorName: keyof Theme['colors']): string {
  const { theme } = useTheme();
  return theme.colors[colorName];
}

/**
 * Hook to get all theme CSS variables
 */
export function useThemeVariables(): Record<string, string> {
  const { theme } = useTheme();
  return getThemeCSSVariables(theme);
}

// ============================================================================
// Export All
// ============================================================================

export const themed = {
  Button: ThemedButton,
  Card: ThemedCard,
  Input: ThemedInput,
  Text: ThemedText,
  Link: ThemedLink,
};

export default themed;
