import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

/**
 * Simple Theme Provider for BarberZap
 * 
 * Provides theme context with dark/light mode toggle and localStorage persistence.
 * Uses Tailwind's dark mode class strategy.
 */

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'barberzap-theme-mode';
const DEFAULT_MODE: ThemeMode = 'dark';

// ============================================================================
// Apply Theme to DOM
// ============================================================================

function applyThemeToDOM(mode: ThemeMode, transitionDuration: number = 300) {
  const root = document.documentElement;
  
  // Add transition to body for smooth theme switching
  document.body.style.transition = `background-color ${transitionDuration}ms ease, color ${transitionDuration}ms ease`;
  
  // Remove both classes first
  root.classList.remove('dark', 'light');
  
  // Add the appropriate class
  root.classList.add(mode);
  
  // Set data attribute for CSS targeting
  root.setAttribute('data-theme', mode);
}

// ============================================================================
// Theme Provider Component
// ============================================================================

export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
  transitionDuration?: number;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = DEFAULT_MODE,
  storageKey = STORAGE_KEY,
  transitionDuration = 300,
}) => {
  // Initialize state from localStorage or default
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return defaultMode;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch (error) {
      console.error('Error reading theme from localStorage:', error);
    }

    return defaultMode;
  });

  // Apply theme to DOM whenever mode changes
  useEffect(() => {
    applyThemeToDOM(mode, transitionDuration);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, mode);
      } catch (error) {
        console.error('Error saving theme to localStorage:', error);
      }
    }
  }, [mode, storageKey, transitionDuration]);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Set theme function
  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  // Memoize context value
  const contextValue = useMemo<ThemeContextType>(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      isDark: mode === 'dark',
    }),
    [mode, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// useTheme Hook
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// ============================================================================
// Theme Toggle Button Component
// ============================================================================

export interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  ariaLabel = 'Toggle theme',
}) => {
  const { mode, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5 text-sm',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3 text-lg',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center
        rounded-xl
        border border-white/10
        bg-zinc-900/50
        text-zinc-400 hover:text-white
        transition-all duration-300
        hover:bg-white/5
        hover:border-white/20
        hover:shadow-lg
        active:scale-95
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={ariaLabel}
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? (
        // Sun icon for dark mode (click to switch to light)
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for light mode (click to switch to dark)
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

// ============================================================================
// withTheme HOC
// ============================================================================

export function withTheme<P extends object>(
  Component: React.ComponentType<P & { isDark: boolean; themeMode: ThemeMode }>
) {
  return function ThemedComponent(props: P) {
    const { mode, isDark } = useTheme();
    return <Component {...props} isDark={isDark} themeMode={mode} />;
  };
}

export default ThemeProvider;
