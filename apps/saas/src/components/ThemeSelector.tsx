/**
 * ThemeSelector Component
 * UI component for selecting and previewing themes
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useThemeSelector } from '../hooks/useThemeSelector';
import { useTheme } from '../themes/ThemeProvider';
import { ThemePreset, Theme } from '../themes/themeTypes';
import { useContrastChecker } from '../hooks/useContrastChecker';
import {
  themePresets,
  getThemesByCategory,
} from '../themes/presets';

// ============================================================================
// Types
// ============================================================================

interface ThemeSelectorProps {
  shopId?: string;
  onClose?: () => void;
  showPreview?: boolean;
  enableCustomization?: boolean;
  onThemeChange?: (theme: Theme) => void;
}

interface ThemeCardProps {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

const ThemeCard: React.FC<ThemeCardProps> = ({ preset, isSelected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`
        relative group p-4 rounded-lg border-2 transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5
        ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 dark:border-gray-700'}
      `}
      style={{
        backgroundColor: preset.colors.surface,
        borderColor: isSelected ? preset.colors.primary : undefined,
      }}
    >
      {/* Preview colors */}
      <div className="flex gap-1 mb-3">
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: preset.colors.primary }}
        />
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: preset.colors.secondary }}
        />
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: preset.colors.success }}
        />
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: preset.colors.warning }}
        />
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: preset.colors.error }}
        />
      </div>
      
      {/* Theme info */}
      <h3
        className="font-semibold mb-1"
        style={{ color: preset.colors.text, fontFamily: preset.fonts.heading }}
      >
        {preset.name}
      </h3>
      <p
        className="text-sm"
        style={{ color: preset.colors.textSecondary, fontFamily: preset.fonts.body }}
      >
        {preset.description}
      </p>
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5"
          >
            <path
              d="M9 12l2 2 4-4"
              stroke={preset.colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </button>
  );
};

const ColorPalette: React.FC<{ colors: Theme['colors'] }> = ({ colors }) => {
  const colorNames: (keyof typeof colors)[] = [
    'primary',
    'primaryLight',
    'primaryDark',
    'secondary',
    'secondaryLight',
    'secondaryDark',
    'success',
    'warning',
    'error',
    'info',
  ];
  
  return (
    <div className="grid grid-cols-5 gap-2">
      {colorNames.map(name => (
        <div key={name} className="flex flex-col items-center">
          <div
            className="w-full h-10 rounded border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: colors[name] }}
          />
          <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            {name}
          </span>
          <span className="text-xs text-gray-500">
            {colors[name]}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  shopId,
  onClose,
  showPreview = true,
  enableCustomization = true,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'preview'>('presets');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const {
    state: selectorState,
    currentTheme,
    selectPreset,
    getPresetsByCategory,
    getAllPresets,
    previewTheme,
    clearPreview,
    toggleDarkMode,
  } = useThemeSelector({ shopId });
  
  const { theme: activeTheme } = useTheme();
  const { checkThemeAccessibility } = useContrastChecker({ level: 'AA' });
  
  // Compute filtered presets
  const filteredPresets = React.useMemo(() => {
    const allPresets = getAllPresets();
    if (filterCategory === 'all') return allPresets;
    return getPresetsByCategory(filterCategory as 'light' | 'dark' | 'custom');
  }, [filterCategory, getAllPresets, getPresetsByCategory]);
  
  // Handle preset selection
  const handlePresetSelect = useCallback(
    async (preset: ThemePreset) => {
      await selectPreset(preset);
      onThemeChange?.(preset as any);
    },
    [selectPreset, onThemeChange]
  );
  
  // Check accessibility
  const accessibilityReport = React.useMemo(() => {
    return checkThemeAccessibility(currentTheme.colors);
  }, [currentTheme.colors, checkThemeAccessibility]);
  
  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Theme Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your barber shop's visual identity
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Dark mode toggle */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${currentTheme.isDark 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }
            `}
          >
            {currentTheme.isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          
          {/* Accessibility status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            accessibilityReport.isAccessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {accessibilityReport.isAccessible ? '✓' : '⚠️'}
            <span className="text-sm font-medium">
              {accessibilityReport.isAccessible ? 'Accessible' : `${accessibilityReport.issues.length} issues`}
            </span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'presets'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Theme Presets
        </button>
        {enableCustomization && (
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'custom'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Customize
          </button>
        )}
        {showPreview && (
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Preview
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-6">
              {['all', 'light', 'dark', 'custom'].map(category => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Theme cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPresets.map(preset => (
                <ThemeCard
                  key={preset.id}
                  preset={preset}
                  isSelected={currentTheme.id === preset.presetKey}
                  onSelect={() => handlePresetSelect(preset)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Custom Tab */}
        {activeTab === 'custom' && enableCustomization && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Advanced customization options coming soon!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              This will include color picker, font selector, border radius slider, and more.
            </p>
          </div>
        )}
        
        {/* Preview Tab */}
        {activeTab === 'preview' && showPreview && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Theme Preview
            </h3>
            
            {/* Color palette */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                Color Palette
              </h4>
              <ColorPalette colors={currentTheme.colors} />
            </div>
            
            {/* Component preview */}
            <div className="space-y-4">
              {/* Button previews */}
              <div className="flex gap-4">
                <button
                  className="px-6 py-3 rounded-lg font-medium text-white"
                  style={{
                    backgroundColor: currentTheme.colors.primary,
                    borderRadius: currentTheme.borderRadius,
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-6 py-3 rounded-lg font-medium text-white"
                  style={{
                    backgroundColor: currentTheme.colors.secondary,
                    borderRadius: currentTheme.borderRadius,
                  }}
                >
                  Secondary Button
                </button>
              </div>
              
              {/* Card preview */}
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  borderRadius: currentTheme.borderRadius,
                }}
              >
                <h4
                  className="font-semibold mb-2"
                  style={{
                    color: currentTheme.colors.text,
                    fontFamily: currentTheme.fonts.heading,
                  }}
                >
                  Sample Card
                </h4>
                <p
                  className="text-sm"
                  style={{
                    color: currentTheme.colors.textSecondary,
                    fontFamily: currentTheme.fonts.body,
                  }}
                >
                  This is a sample card component styled with the current theme.
                  You can see how colors, fonts, and spacing work together.
                </p>
              </div>
            </div>
            
            {/* Accessibility issues */}
            {!accessibilityReport.isAccessible && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                  Accessibility Issues
                </h4>
                <ul className="space-y-2">
                  {accessibilityReport.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-800 dark:text-red-400">
                      <strong>{issue.name}:</strong> {issue.issue}
                      {issue.suggestion && (
                        <span className="ml-2">
                          (Try: {issue.suggestion})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Active: <span className="font-medium">{currentTheme.name}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default ThemeSelector;
