/**
 * useThemeSelector Hook
 * Advanced theme selection and management hook for theme customization UI
 */

import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import {
  Theme,
  ThemePreset,
  CustomThemeInput,
  ThemeValidationResult,
} from '../themes/themeTypes';
import {
  themePresets,
  getPresetByKey,
  getThemesByCategory,
} from '../themes/presets';

export interface UseThemeSelectorOptions {
  shopId?: string;
  autoSave?: boolean;
  debounceMs?: number;
}

export interface ThemeSelectorState {
  // Current selection
  selectedPreset: ThemePreset | null;
  customTheme: Partial<Theme>;
  
  // Editing state
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  
  // Preview state
  isPreviewing: boolean;
  previewTheme: Theme | null;
  
  // Validation
  isValid: boolean;
  validationErrors: string[];
  
  // Loading
  isLoading: boolean;
  isSaving: boolean;
}

export function useThemeSelector(options: UseThemeSelectorOptions = {}) {
  const { shopId, autoSave = false, debounceMs = 500 } = options;
  
  // Get theme context
  const {
    theme: currentTheme,
    activeThemeId,
    setActiveTheme,
    loadCustomTheme: loadThemeFromProvider,
    saveCustomTheme: saveThemeToProvider,
    previewTheme: providerPreviewTheme,
    clearPreview: providerClearPreview,
  } = useTheme();
  
  // Local state
  const [state, setState] = useState<ThemeSelectorState>({
    selectedPreset: null,
    customTheme: {},
    isEditing: false,
    hasUnsavedChanges: false,
    isPreviewing: false,
    previewTheme: null,
    isValid: true,
    validationErrors: [],
    isLoading: false,
    isSaving: false,
  });
  
  // Debounced save timer
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // Helper Functions
  // ============================================================================
  
  const validateTheme = useCallback((theme: Partial<Theme>): ThemeValidationResult => {
    const errors: string[] = [];
    
    // Validate colors
    if (theme.colors) {
      const { primary, secondary, background, text } = theme.colors;
      
      if (!primary || !/^#[0-9A-Fa-f]{6}$/.test(primary)) {
        errors.push('Invalid primary color format. Use hex format (#RRGGBB)');
      }
      
      if (!secondary || !/^#[0-9A-Fa-f]{6}$/.test(secondary)) {
        errors.push('Invalid secondary color format. Use hex format (#RRGGBB)');
      }
      
      if (!background || !/^#[0-9A-Fa-f]{6}$/.test(background)) {
        errors.push('Invalid background color format. Use hex format (#RRGGBB)');
      }
      
      if (!text || !/^#[0-9A-Fa-f]{6}$/.test(text)) {
        errors.push('Invalid text color format. Use hex format (#RRGGBB)');
      }
    }
    
    // Validate fonts
    if (theme.fonts) {
      const { heading, body } = theme.fonts;
      
      if (!heading || typeof heading !== 'string') {
        errors.push('Heading font is required');
      }
      
      if (!body || typeof body !== 'string') {
        errors.push('Body font is required');
      }
    }
    
    // Validate borderRadius
    if (theme.borderRadius !== undefined && typeof theme.borderRadius !== 'string') {
      errors.push('Border radius must be a string (e.g., "0.5rem")');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }, []);
  
  // ============================================================================
  // Preset Selection
  // ============================================================================
  
  const selectPreset = useCallback(async (preset: ThemePreset) => {
    setState(prev => ({
      ...prev,
      selectedPreset: preset,
      customTheme: {},
      isEditing: false,
      hasUnsavedChanges: false,
      validationErrors: [],
    }));
    
    await setActiveTheme(preset.presetKey, preset as any);
  }, [setActiveTheme]);
  
  const getPresetsByCategory = useCallback((category: ThemePreset['category']) => {
    return getThemesByCategory(category);
  }, []);
  
  const getAllPresets = useCallback(() => {
    return themePresets;
  }, []);
  
  // ============================================================================
  // Custom Theme Editing
  // ============================================================================
  
  const startEditing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEditing: true,
      customTheme: { ...currentTheme },
    }));
  }, [currentTheme]);
  
  const stopEditing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEditing: false,
      customTheme: {},
    }));
  }, []);
  
  const updateCustomTheme = useCallback((updates: Partial<Theme>) => {
    setState(prev => {
      const newCustomTheme = { ...prev.customTheme, ...updates };
      
      // Validate
      const validation = validateTheme(newCustomTheme);
      
      return {
        ...prev,
        customTheme: newCustomTheme,
        hasUnsavedChanges: true,
        isValid: validation.isValid,
        validationErrors: validation.errors,
      };
    });
  }, [validateTheme]);
  
  const updateColor = useCallback((colorName: keyof Theme['colors'], value: string) => {
    updateCustomTheme({
      colors: { ...state.customTheme.colors, [colorName]: value },
    });
  }, [state.customTheme.colors, updateCustomTheme]);
  
  const resetCustomTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      customTheme: {},
      hasUnsavedChanges: false,
      isValid: true,
      validationErrors: [],
    }));
  }, []);
  
  // ============================================================================
  // Theme Preview
  // ============================================================================
  
  const previewTheme = useCallback((theme: Theme) => {
    setState(prev => ({
      ...prev,
      isPreviewing: true,
      previewTheme: theme,
    }));
    
    providerPreviewTheme(theme);
  }, [providerPreviewTheme]);
  
  const clearPreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewing: false,
      previewTheme: null,
    }));
    
    providerClearPreview();
  }, [providerClearPreview]);
  
  // ============================================================================
  // Theme Save/Load
  // ============================================================================
  
  const saveTheme = useCallback(async () => {
    if (!shopId) {
      throw new Error('shopId is required to save custom theme');
    }
    
    if (!state.isValid || state.validationErrors.length > 0) {
      throw new Error('Cannot save theme with validation errors');
    }
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      await saveThemeToProvider(shopId, state.customTheme);
      
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        isSaving: false,
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      throw error;
    }
  }, [shopId, state.customTheme, state.isValid, state.validationErrors, saveThemeToProvider]);
  
  const loadCustomTheme = useCallback(async (passedShopId?: string) => {
    const targetShopId = passedShopId || shopId;
    if (!targetShopId) {
      throw new Error('shopId is required to load custom theme');
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const theme = await loadThemeFromProvider(targetShopId);
      
      if (theme) {
        setState(prev => ({
          ...prev,
          customTheme: theme,
          selectedPreset: null,
          isLoading: false,
        }));
      }
      
      return theme;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [shopId, loadThemeFromProvider]);
  
  // ============================================================================
  // Auto-save with debouncing
  // ============================================================================
  
  useEffect(() => {
    if (autoSave && state.hasUnsavedChanges && shopId && Debounce) {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      
      const timer = setTimeout(async () => {
        try {
          await saveTheme();
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, debounceMs);
      
      setSaveTimer(timer);
    }
    
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
    };
  }, [autoSave, state.hasUnsavedChanges, shopId, debounceMs, saveTimer, saveTheme]);
  
  // ============================================================================
  // Dark Mode Toggle
  // ============================================================================
  
  const toggleDarkMode = useCallback(() => {
    const newIsDark = !currentTheme.isDark;
    const targetPresetKey = newIsDark ? 'defaultDark' : 'defaultLight';
    const targetPreset = getPresetByKey(targetPresetKey);
    
    if (targetPreset) {
      selectPreset(targetPreset);
    }
  }, [currentTheme.isDark, selectPreset]);
  
  // ============================================================================
  // Reset to Default
  // ============================================================================
  
  const resetToDefault = useCallback(() => {
    const defaultPreset = themePresets[0];
    if (defaultPreset) {
      selectPreset(defaultPreset);
    }
  }, [selectPreset]);
  
  // ============================================================================
  // Export/Import
  // ============================================================================
  
  const exportTheme = useCallback(() => {
    const exportData = {
      version: '1.0.0',
      theme: state.customTheme,
      exportedAt: new Date().toISOString(),
      shopId,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${shopId || 'custom'}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }, [state.customTheme, shopId]);
  
  const importTheme = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.theme) {
        setState(prev => ({
          ...prev,
          customTheme: data.theme,
          hasUnsavedChanges: true,
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);
  
  // ============================================================================
  // Return Value
  // ============================================================================
  
  return {
    // Current state
    state,
    currentTheme,
    activeThemeId,
    
    // Preset management
    selectPreset,
    getPresetsByCategory,
    getAllPresets,
    
    // Custom theme editing
    startEditing,
    stopEditing,
    updateCustomTheme,
    updateColor,
    resetCustomTheme,
    
    // Preview
    previewTheme,
    clearPreview,
    
    // Save/Load
    saveTheme,
    loadCustomTheme,
    
    // Actions
    toggleDarkMode,
    resetToDefault,
    
    // Export/Import
    exportTheme,
    importTheme,
    
    // Helpers
    validateTheme,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function Debounce(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
  return setTimeout(callback, delay);
}
