/**
 * useContrastChecker Hook
 * WCAG 2.1 compliant color contrast checking for accessibility
 */

import { useCallback, useMemo } from 'react';
import { ContrastResult } from '../themes/themeTypes';

export interface ContrastCheckerOptions {
  level?: 'AA' | 'AAA';
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
}

export function useContrastChecker(options: ContrastCheckerOptions = {}) {
  const {
    level = 'AA',
    fontSize = 16,
    fontWeight = 'normal',
  } = options;
  
  // ============================================================================
  // Color Conversion Functions
  // ============================================================================
  
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } | null => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return { r, g, b };
    }
    
    // Handle 6-digit hex
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return { r, g, b };
    }
    
    return null;
  }, []);
  
  const rgbToLuminance = useCallback((r: number, g: number, b: number): number => {
    // Convert RGB to sRGB values (0-1)
    const sR = r / 255;
    const sG = g / 255;
    const sB = b / 255;
    
    // Apply gamma correction
    const rLinear = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
    const gLinear = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
    const bLinear = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
    
    // Calculate luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }, []);
  
  // ============================================================================
  // Contrast Ratio Calculation
  // ============================================================================
  
  const getContrastRatio = useCallback((foreground: string, background: string): number => {
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);
    
    if (!fgRgb || !bgRgb) {
      return 0;
    }
    
    const fgLuminance = rgbToLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLuminance = rgbToLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }, [hexToRgb, rgbToLuminance]);
  
  // ============================================================================
  // WCAG Compliance Checking
  // ============================================================================
  
  const checkContrastRatio = useCallback(
    (foreground: string, background: string, options?: ContrastCheckerOptions): ContrastResult => {
      const opts = { ...options, level: options?.level || level };
      
      const ratio = getContrastRatio(foreground, background);
      
      // WCAG 2.1 requirements
      const isLargeText = (opts.fontSize || fontSize) >= 18 || 
                         (opts.fontSize || fontSize) >= 14 && 
                         (opts.fontWeight || fontWeight) === 'bold';
      
      // AA requirements
      const passesAA = isLargeText ? ratio >= 3 : ratio >= 4.5;
      
      // AAA requirements
      const passesAAA = isLargeText ? ratio >= 4.5 : ratio >= 7;
      
      // Determine level
      let resultLevel: ContrastResult['level'] = 'fail';
      if (passesAAA) {
        resultLevel = 'AAA';
      } else if (passesAA) {
        resultLevel = 'AA';
      }
      
      return {
        ratio: Math.round(ratio * 100) / 100,
        passesAA,
        passesAAA,
        level: resultLevel,
      };
    },
    [getContrastRatio, level, fontSize, fontWeight]
  );
  
  // ============================================================================
  // Color Suggestions for Better Contrast
  // ============================================================================
  
  const suggestColor = useCallback(
    (baseColor: string, targetColor: string, options?: ContrastCheckerOptions): string | null => {
      const targetRatio = options?.level === 'AAA' ? 7 : 4.5;
      
      // Try lightening or darkening the base color
      const baseRgb = hexToRgb(baseColor);
      const targetRgb = hexToRgb(targetColor);
      
      if (!baseRgb || !targetRgb) {
        return null;
      }
      
      const targetLuminance = rgbToLuminance(targetRgb.r, targetRgb.g, targetRgb.b);
      
      // Determine if we need lighter or darker
      const needsLighter = targetLuminance < 0.5;
      
      // Binary search for optimal shade
      let low = needsLighter ? 0.5 : 0;
      let high = needsLighter ? 1 : 0.5;
      let bestColor = baseColor;
      
      for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        
        // Adjust base color towards white or black
        let newR, newG, newB;
        
        if (needsLighter) {
          newR = Math.round(baseRgb.r + (255 - baseRgb.r) * mid);
          newG = Math.round(baseRgb.g + (255 - baseRgb.g) * mid);
          newB = Math.round(baseRgb.b + (255 - baseRgb.b) * mid);
        } else {
          newR = Math.round(baseRgb.r * (1 - mid));
          newG = Math.round(baseRgb.g * (1 - mid));
          newB = Math.round(baseRgb.b * (1 - mid));
        }
        
        const newHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        
        const contrast = getContrastRatio(newHex, targetColor);
        
        if (contrast >= targetRatio) {
          bestColor = newHex;
          if (needsLighter) {
            high = mid; // Try less adjustment
          } else {
            low = mid; // Try less darkening
          }
        } else {
          if (needsLighter) {
            low = mid; // Need more lightening
          } else {
            high = mid; // Need more darkening
          }
        }
      }
      
      // Verify the suggestion
      const finalContrast = getContrastRatio(bestColor, targetColor);
      if (finalContrast < targetRatio) {
        // Fallback to black or white
        return needsLighter ? '#ffffff' : '#000000';
      }
      
      return bestColor;
    },
    [hexToRgb, rgbToLuminance, getContrastRatio]
  );
  
  // ============================================================================
  // Batch Contrast Checking
  // ============================================================================
  
  const checkMultipleContrasts = useCallback(
    (pairs: Array<{ foreground: string; background: string }>): ContrastResult[] => {
      return pairs.map(pair => checkContrastRatio(pair.foreground, pair.background));
    },
    [checkContrastRatio]
  );
  
  // ============================================================================
  // Theme Accessibility Report
  // ============================================================================
  
  const checkThemeAccessibility = useCallback(
    (colors: Record<string, string>): {
      isAccessible: boolean;
      results: Array<{ name: string; foreground: string; background: string; result: ContrastResult }>;
      issues: Array<{ name: string; issue: string; suggestion?: string }>;
    } => {
      const results: Array<{ name: string; foreground: string; background: string; result: ContrastResult }> = [];
      const issues: Array<{ name: string; issue: string; suggestion?: string }> = [];
      
      // Define critical color pairs to check
      const pairs: Array<{ name: string; foreground: string; background: string }> = [
        { name: 'Primary on Background', foreground: colors.primary, background: colors.background },
        { name: 'Secondary on Background', foreground: colors.secondary, background: colors.background },
        { name: 'Text on Background', foreground: colors.text, background: colors.background },
        { name: 'Text Secondary on Background', foreground: colors.textSecondary || colors.text, background: colors.background },
        { name: 'Text on Surface', foreground: colors.text, background: colors.surface || colors.background },
        { name: 'Success on Background', foreground: colors.success, background: colors.background },
        { name: 'Warning on Background', foreground: colors.warning, background: colors.background },
        { name: 'Error on Background', foreground: colors.error, background: colors.background },
      ];
      
      for (const pair of pairs) {
        const result = checkContrastRatio(pair.foreground, pair.background);
        results.push({ ...pair, result });
        
        if (result.level === 'fail') {
          const suggestion = suggestColor(pair.foreground, pair.background);
          issues.push({
            name: pair.name,
            issue: `Contrast ratio ${result.ratio}:1 does not meet ${level} standards`,
            suggestion,
          });
        }
      }
      
      return {
        isAccessible: issues.length === 0,
        results,
        issues,
      };
    },
    [checkContrastRatio, suggestColor, level]
  );
  
  // ============================================================================
  // Color Analysis
  // ============================================================================
  
  const analyzeColor = useCallback((color: string): {
    isDark: boolean;
    isLight: boolean;
    brightness: number;
    hex: string;
    rgb: string;
  } => {
    const rgb = hexToRgb(color);
    
    if (!rgb) {
      return {
        isDark: false,
        isLight: false,
        brightness: 0,
        hex: color,
        rgb: '',
      };
    }
    
    // Calculate perceived brightness (human vision)
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    return {
      isDark: brightness < 128,
      isLight: brightness >= 128,
      brightness: Math.round(brightness),
      hex: color,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    };
  }, [hexToRgb]);
  
  // ============================================================================
  // Return Value
  // ============================================================================
  
  return {
    // Main functions
    checkContrastRatio,
    suggestColor,
    
    // Batch checking
    checkMultipleContrasts,
    checkThemeAccessibility,
    
    // Color analysis
    analyzeColor,
    getContrastRatio,
    hexToRgb,
    rgbToLuminance,
    
    // Utilities
    isLargeText: fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold'),
  };
}

// ============================================================================
// Utility Functions (for non-hook usage)
// ============================================================================

export function checkContrast(
  foreground: string,
  background: string,
  options?: ContrastCheckerOptions
): ContrastResult {
  const { checkContrastRatio } = useContrastChecker(options);
  return checkContrastRatio(foreground, background, options);
}

export function getAccessibleColor(
  baseColor: string,
  targetColor: string,
  level: 'AA' | 'AAA' = 'AA'
): string {
  const { suggestColor } = useContrastChecker({ level });
  return suggestColor(baseColor, targetColor) || baseColor;
}

export function isAccessiblePair(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const result = checkContrast(foreground, background, { level });
  return level === 'AAA' ? result.passesAAA : result.passesAA;
}
