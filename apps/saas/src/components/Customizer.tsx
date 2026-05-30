/**
 * Customizer Component
 * Live theme customizer with real-time preview and color tools
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useThemeSelector } from '../hooks/useThemeSelector';
import { useTheme } from '../themes/ThemeProvider';
import { useContrastChecker } from '../hooks/useContrastChecker';
import { Theme, ColorName } from '../themes/themeTypes';

// ============================================================================
// Types
// ============================================================================

interface CustomizerProps {
  shopId?: string;
  onSave?: (theme: Partial<Theme>) => Promise<void>;
  onCancel?: () => void;
}

interface ColorPickerProps {
  label: string;
  colorName: ColorName;
  value: string;
  onChange: (name: ColorName, value: string) => void;
  checkContrast?: (foreground: string, background: string) => any;
}

// ============================================================================
// Sub-components
// ============================================================================

const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  colorName,
  value,
  onChange,
  checkContrast,
}) => {
  const [showHslSliders, setShowHslSliders] = useState(false);
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });
  
  // Parse hex to HSL
  useEffect(() => {
    const r = parseInt(value.slice(1, 3), 16) / 255;
    const g = parseInt(value.slice(3, 5), 16) / 255;
    const b = parseInt(value.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number, l: number = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        default: h = ((r - g) / d + 4) / 6;
      }
    }
    
    setHsl({
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    });
  }, [value]);
  
  // HSL to Hex
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color);
    };
    
    return `#${f(0).toString(16).padStart(2, '0')}${f(8).toString(16).padStart(2, '0')}${f(4).toString(16).padStart(2, '0')}`;
  };
  
  const handleHslChange = useCallback((key: 'h' | 's' | 'l', newValue: number) => {
    const newHsl = { ...hsl, [key]: newValue };
    setHsl(newHsl);
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    onChange(colorName, hex);
  }, [hsl, colorName, onChange]);
  
  const checkContrastWith = () => {
    if (!checkContrast) return null;
    return checkContrast(value, '#ffffff');
  };
  
  const contrastResult = checkContrastWith();
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        <button
          onClick={() => setShowHslSliders(!showHslSliders)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {showHslSliders ? 'Simple' : 'Advanced'}
        </button>
      </div>
      
      <div className="flex gap-3 items-center">
        {/* Color swatch */}
        <div className="flex-shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(colorName, e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-0"
          />
        </div>
        
        {/* Hex input */}
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const hex = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                onChange(colorName, hex);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        
        {/* Contrast indicator */}
        {contrastResult && (
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            contrastResult.passesAA ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {contrastResult.ratio.toFixed(2)}:1
          </div>
        )}
      </div>
      
      {/* HSL Sliders */}
      {showHslSliders && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Hue: {hsl.h}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={hsl.h}
              onChange={(e) => handleHslChange('h', parseInt(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, ${hslToHex(0, hsl.s, hsl.l)}, ${hslToHex(60, hsl.s, hsl.l)}, ${hslToHex(120, hsl.s, hsl.l)}, ${hslToHex(180, hsl.s, hsl.l)}, ${hslToHex(240, hsl.s, hsl.l)}, ${hslToHex(300, hsl.s, hsl.l)}, ${hslToHex(360, hsl.s, hsl.l)})`,
              }}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Saturation: {hsl.s}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={hsl.s}
              onChange={(e) => handleHslChange('s', parseInt(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, ${hslToHex(hsl.h, 0, hsl.l)}, ${hslToHex(hsl.h, 100, hsl.l)})`,
              }}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Lightness: {hsl.l}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={hsl.l}
              onChange={(e) => handleHslChange('l', parseInt(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #000000, ${hslToHex(hsl.h, hsl.s, 50)}, #ffffff)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const Customizer: React.FC<CustomizerProps> = ({
  shopId,
  onSave,
  onCancel,
}) => {
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'spacing' | 'css'>('colors');
  const [hasChanges, setHasChanges] = useState(false);
  
  const {
    state: selectorState,
    currentTheme,
    updateCustomTheme,
    updateColor,
    saveTheme,
    resetCustomTheme,
    exportTheme,
  } = useThemeSelector({ shopId, autoSave: false });
  
  const { theme: activeTheme } = useTheme();
  const { checkContrastRatio, checkThemeAccessibility } = useContrastChecker({ level: 'AA' });
  
  // Check accessibility in real-time
  const accessibilityReport = useMemo(() => {
    if (!currentTheme?.colors) return null;
    return checkThemeAccessibility(currentTheme.colors);
  }, [currentTheme?.colors, checkThemeAccessibility]);
  
  // Handle color change
  const handleColorChange = useCallback((colorName: ColorName, value: string) => {
    updateColor(colorName, value);
    setHasChanges(true);
  }, [updateColor]);
  
  // Handle save
  const handleSave = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(selectorState.customTheme);
      } else {
        await saveTheme();
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save theme:', error);
      alert('Failed to save theme. Please try again.');
    }
  }, [onSave, selectorState.customTheme, saveTheme]);
  
  // Handle reset
  const handleReset = useCallback(() => {
    resetCustomTheme();
    setHasChanges(false);
  }, [resetCustomTheme]);
  
  // Handle export
  const handleExport = useCallback(() => {
    exportTheme();
  }, [exportTheme]);
  
  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Theme Customizer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize colors, fonts, and more
            </p>
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Save Changes
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Export
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'colors', label: 'Colors', icon: '🎨' },
          { id: 'typography', label: 'Typography', icon: '𝐀' },
          { id: 'spacing', label: 'Spacing', icon: '📐' },
          { id: 'css', label: 'Custom CSS', icon: '💻' },
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`
              flex-1 px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2
              ${activeSection === section.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Colors section */}
        {activeSection === 'colors' && (
          <div>
            {/* Accessibility summary */}
            {accessibilityReport && (
              <div className={`mb-6 p-4 rounded-lg ${
                accessibilityReport.isAccessible
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {accessibilityReport.isAccessible ? '✅' : '⚠️'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {accessibilityReport.isAccessible ? 'WCAG AA Compliant' : 'Accessibility Issues Found'}
                    </h3>
                    {!accessibilityReport.isAccessible && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {accessibilityReport.issues.length} issue(s) need attention
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Color groups */}
            <div className="space-y-6">
              {/* Primary colors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Primary Colors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorPicker
                    label="Primary"
                    colorName="primary"
                    value={currentTheme.colors.primary}
                    onChange={handleColorChange}
                    checkContrast={checkContrastRatio}
                  />
                  <ColorPicker
                    label="Primary Light"
                    colorName="primaryLight"
                    value={currentTheme.colors.primaryLight}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Primary Dark"
                    colorName="primaryDark"
                    value={currentTheme.colors.primaryDark}
                    onChange={handleColorChange}
                  />
                </div>
              </div>
              
              {/* Secondary colors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Secondary Colors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorPicker
                    label="Secondary"
                    colorName="secondary"
                    value={currentTheme.colors.secondary}
                    onChange={handleColorChange}
                    checkContrast={checkContrastRatio}
                  />
                  <ColorPicker
                    label="Secondary Light"
                    colorName="secondaryLight"
                    value={currentTheme.colors.secondaryLight}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Secondary Dark"
                    colorName="secondaryDark"
                    value={currentTheme.colors.secondaryDark}
                    onChange={handleColorChange}
                  />
                </div>
              </div>
              
              {/* Background & Surface */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Background & Surface
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ColorPicker
                    label="Background"
                    colorName="background"
                    value={currentTheme.colors.background}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Background Alt"
                    colorName="backgroundAlt"
                    value={currentTheme.colors.backgroundAlt}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Surface"
                    colorName="surface"
                    value={currentTheme.colors.surface}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Surface Alt"
                    colorName="surfaceAlt"
                    value={currentTheme.colors.surfaceAlt}
                    onChange={handleColorChange}
                  />
                </div>
              </div>
              
              {/* Text colors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Text Colors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorPicker
                    label="Text"
                    colorName="text"
                    value={currentTheme.colors.text}
                    onChange={handleColorChange}
                    checkContrast={(fg) => checkContrastRatio(fg, currentTheme.colors.background)}
                  />
                  <ColorPicker
                    label="Text Secondary"
                    colorName="textSecondary"
                    value={currentTheme.colors.textSecondary}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Text Muted"
                    colorName="textMuted"
                    value={currentTheme.colors.textMuted}
                    onChange={handleColorChange}
                  />
                </div>
              </div>
              
              {/* Status colors */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Status Colors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ColorPicker
                    label="Success"
                    colorName="success"
                    value={currentTheme.colors.success}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Warning"
                    colorName="warning"
                    value={currentTheme.colors.warning}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Error"
                    colorName="error"
                    value={currentTheme.colors.error}
                    onChange={handleColorChange}
                  />
                  <ColorPicker
                    label="Info"
                    colorName="info"
                    value={currentTheme.colors.info}
                    onChange={handleColorChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Typography section */}
        {activeSection === 'typography' && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Typography customization coming soon!
            </p>
          </div>
        )}
        
        {/* Spacing section */}
        {activeSection === 'spacing' && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Spacing customization coming soon!
            </p>
          </div>
        )}
        
        {/* Custom CSS section */}
        {activeSection === 'css' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Custom CSS
            </h3>
            <textarea
              className="w-full h-64 p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="/* Add your custom CSS here */"
              onChange={(e) => updateCustomTheme({ customCss: e.target.value })}
            >
              {currentTheme.customCss || ''}
            </textarea>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Custom CSS will be injected into the page head. Avoid conflicting with theme variables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customizer;
