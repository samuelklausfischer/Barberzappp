/**
 * ThemeProvider Component
 * Provides theme context to the entire application with SSR support
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { Theme, ThemeContextType, ThemeAction } from './themeTypes';
import { themes, themePresets, getPresetByKey, getThemeById } from './presets';
import {
  THEME_STORAGE_KEY,
  THEME_MODE_KEY,
  CUSTOM_THEME_KEY_PREFIX,
  DEFAULT_ACCENT_EMOJI,
} from './themeTypes';

// ============================================================================
// Types
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  shopId?: string;
  ssrTheme?: Theme;
  storageKey?: string;
}

interface ThemeState {
  theme: Theme;
  activeThemeId: string;
  isDark: boolean;
  isPreview: boolean;
  previousTheme?: Theme;
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Theme Helpers
// ============================================================================

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  
  // Apply colors as CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply fonts as CSS variables
  root.style.setProperty('--font-heading', theme.fonts.heading);
  root.style.setProperty('--font-body', theme.fonts.body);
  root.style.setProperty('--font-mono', theme.fonts.mono);
  
  // Apply UI tokens
  root.style.setProperty('--border-radius', theme.borderRadius);
  root.style.setProperty('--spacing', theme.spacing);
  
  // Apply accent emoji
  root.style.setProperty('--accent-emoji', theme.accentEmoji || DEFAULT_ACCENT_EMOJI);
  
  // Apply theme ID attribute
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', theme.isDark ? 'dark' : 'light');
  
  // Toggle body class for dark mode
  if (theme.isDark) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  
  // Inject custom CSS if present
  let customStyleElement = document.getElementById('barberzap-custom-css');
  if (theme.customCss) {
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'barberzap-custom-css';
      document.head.appendChild(customStyleElement);
    }
    customStyleElement.textContent = theme.customCss;
  } else if (customStyleElement) {
    customStyleElement.remove();
  }
}

// ============================================================================
// ThemeReducer
// ============================================================================

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
        activeThemeId: action.payload.id,
        isDark: action.payload.isDark || false,
        isPreview: false,
      };
    
    case 'SET_DARK_MODE':
      return {
        ...state,
        isDark: action.payload,
      };
    
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        isDark: !state.isDark,
      };
    
    case 'PREVIEW_THEME':
      return {
        ...state,
        previousTheme: state.theme,
        theme: action.payload,
        isPreview: true,
      };
    
    case 'CLEAR_PREVIEW':
      return state.previousTheme
        ? {
            ...state,
            theme: state.previousTheme,
            isPreview: false,
            previousTheme: undefined,
          }
        : state;
    
    case 'RESET_THEME':
      const defaultTheme = themes[0];
      return {
        ...state,
        theme: defaultTheme,
        activeThemeId: defaultTheme.id,
        isDark: false,
        isPreview: false,
      };
    
    default:
      return state;
  }
}

// ============================================================================
// ThemeProvider Component
// ============================================================================

export function ThemeProvider({
  children,
  defaultTheme = 'theme-default-light',
  shopId,
  ssrTheme,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  // Initial state
  const [state, setState] = useState<ThemeState>(() => {
    if (ssrTheme) {
      return {
        theme: ssrTheme,
        activeThemeId: ssrTheme.id,
        isDark: ssrTheme.isDark || false,
        isPreview: false,
      };
    }
    
    const initialTheme = themes.find(t => t.id === defaultTheme) || themes[0];
    return {
      theme: initialTheme,
      activeThemeId: initialTheme.id,
      isDark: initialTheme.isDark || false,
      isPreview: false,
    };
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [presets, setPresets] = useState<ThemePreset[]>(themePresets);
  
  // Apply theme to DOM on render
  useEffect(() => {
    applyThemeToDOM(state.theme);
  }, [state.theme]);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedThemeId = localStorage.getItem(storageKey);
      const savedMode = localStorage.getItem(THEME_MODE_KEY);
      
      if (savedThemeId) {
        const savedTheme = getThemeById(savedThemeId);
        if (savedTheme) {
          setState(prev => ({
            ...prev,
            theme: savedTheme,
            activeThemeId: savedTheme.id,
            isDark: savedMode === 'dark' || savedTheme.isDark || false,
          }));
        }
      }
      
      // Load shop custom theme if shopId is provided
      if (shopId) {
        loadCustomTheme(shopId);
      }
    } catch (error) {
      console.error('Error loading theme from storage:', error);
    }
  }, [storageKey, shopId]);
  
  // ============================================================================
  // Theme Actions
  // ============================================================================
  
  const setActiveTheme = useCallback((themeId: string, theme?: Theme) => {
    const targetTheme = theme || getThemeById(themeId) || getPresetByKey(themeId);
    
    if (targetTheme) {
      setState(prev => ({
        ...prev,
        theme: {
          ...targetTheme,
          id: targetTheme.id || themeId,
        } as Theme,
        activeThemeId: themeId,
        isDark: targetTheme.isDark || false,
      }));
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, themeId);
          localStorage.setItem(THEME_MODE_KEY, String(targetTheme.isDark || false));
        } catch (error) {
          console.error('Error saving theme to storage:', error);
        }
      }
    }
  }, [storageKey]);
  
  const toggleDarkMode = useCallback(() => {
    setState(prev => {
      const newIsDark = !prev.isDark;
      const newThemeId = newIsDark 
        ? 'theme-default-dark' 
        : 'theme-default-light';
      
      const targetTheme = getThemeById(newThemeId);
      
      if (targetTheme) {
        return {
          ...prev,
          theme: targetTheme,
          activeThemeId: newThemeId,
          isDark: newIsDark,
        };
      }
      
      return { ...prev, isDark: newIsDark };
    });
  }, []);
  
  const resetToDefault = useCallback(() => {
    setState(prev => {
      const defaultTheme = themes[0];
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(THEME_MODE_KEY);
          
          // Also remove custom theme for this shop
          if (shopId) {
            localStorage.removeItem(`${CUSTOM_THEME_KEY_PREFIX}${shopId}`);
          }
        } catch (error) {
          console.error('Error resetting theme:', error);
        }
      }
      
      return {
        ...prev,
        theme: defaultTheme,
        activeThemeId: defaultTheme.id,
        isDark: defaultTheme.isDark || false,
        isPreview: false,
      };
    });
  }, [storageKey, shopId]);
  
  const previewTheme = useCallback((theme: Theme) => {
    setState(prev => ({
      ...prev,
      previousTheme: prev.theme,
      theme,
      isPreview: true,
    }));
  }, []);
  
  const clearPreview = useCallback(() => {
    setState(prev => {
      if (prev.previousTheme) {
        return {
          ...prev,
          theme: prev.previousTheme,
          isPreview: false,
          previousTheme: undefined,
        };
      }
      return prev;
    });
  }, []);
  
  const loadCustomTheme = useCallback(async (shopId: string): Promise<Theme | null> => {
    setIsLoading(true);
    
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      
      // Try localStorage first
      const cachedKey = `${CUSTOM_THEME_KEY_PREFIX}${shopId}`;
      const cachedTheme = localStorage.getItem(cachedKey);
      
      if (cachedTheme) {
        const theme = JSON.parse(cachedTheme) as Theme;
        setState(prev => ({
          ...prev,
          theme,
          activeThemeId: theme.id,
          isDark: theme.isDark || false,
        }));
        return theme;
      }
      
      // If not cached, try API
      // This would typically come from an API endpoint
      // const response = await fetch(`/api/themes/shop/${shopId}`);
      // if (response.ok) {
      //   const shopTheme = await response.json();
      //   const theme: Theme = {
      //     id: `custom-${shopId}`,
      //     name: shopTheme.theme_name,
      //     ...shopTheme,
      //   };
      //   setState(prev => ({
      //     ...prev,
      //     theme,
      //     activeThemeId: theme.id,
      //     isDark: theme.isDark || false,
      //   }));
      //   localStorage.setItem(cachedKey, JSON.stringify(theme));
      //   return theme;
      // }
      
      return null;
    } catch (error) {
      console.error('Error loading custom theme:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const saveCustomTheme = useCallback(async (
    shopId: string,
    theme: Partial<Theme>
  ): Promise<void> => {
    try {
      // Save to localStorage
      const cachedKey = `${CUSTOM_THEME_KEY_PREFIX}${shopId}`;
      const fullTheme: Theme = {
        ...state.theme,
        ...theme,
        id: `custom-${shopId}`,
        name: theme.name || 'Custom Theme',
      };
      
      localStorage.setItem(cachedKey, JSON.stringify(fullTheme));
      
      // Update current state
      setState(prev => ({
        ...prev,
        theme: fullTheme,
        activeThemeId: fullTheme.id,
      }));
      
      // TODO: Save to API
      // await fetch(`/api/themes/shop/${shopId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(theme),
      // });
    } catch (error) {
      console.error('Error saving custom theme:', error);
      throw error;
    }
  }, [state.theme]);
  
  // ============================================================================
  // Context Value
  // ============================================================================
  
  const contextValue: ThemeContextType = useMemo(
    () => ({
      theme: state.theme,
      activeThemeId: state.activeThemeId,
      isDark: state.isDark,
      setActiveTheme,
      toggleDarkMode,
      resetToDefault,
      loadCustomTheme,
      saveCustomTheme,
      previewTheme,
      clearPreview,
      presets,
      isLoading,
    }),
    [
      state.theme,
      state.activeThemeId,
      state.isDark,
      setActiveTheme,
      toggleDarkMode,
      resetToDefault,
      loadCustomTheme,
      saveCustomTheme,
      previewTheme,
      clearPreview,
      presets,
      isLoading,
    ]
  );
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

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
// withTheme HOC (optional, for class components)
// ============================================================================

export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) {
  return function ThemedComponent(props: P) {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
}
