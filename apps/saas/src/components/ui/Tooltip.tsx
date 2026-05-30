import React, { useState, useRef, useEffect, type ReactNode } from 'react';

/**
 * Tooltip Component
 * 
 * Hover-triggered tooltip with fade in/out animations.
 * Supports dark mode, configurable positions, and delays.
 */

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /**
   * Content to display as tooltip
   */
  content: ReactNode;
  
  /**
   * Tooltip position relative to trigger
   * @default 'top'
   */
  position?: TooltipPosition;
  
  /**
   * Delay before showing tooltip (ms)
   * @default 200
   */
  delay?: number;
  
  /**
   * Delay before hiding tooltip (ms)
   * @default 100
   */
  hideDelay?: number;
  
  /**
   * Maximum width of tooltip
   * @default '200px'
   */
  maxWidth?: string;
  
  /**
   * Custom className for tooltip content
   */
  className?: string;
  
  /**
   * Arrow indicator
   * @default true
   */
  showArrow?: boolean;
  
  /**
   * Dark mode override
   */
  darkMode?: boolean;
  
  /**
   * Element that triggers tooltip
   */
  children: React.ReactElement;
}

/**
 * Tooltip Component
 * 
 * @example
 * ```tsx
 * <Tooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 * 
 * <Tooltip content="Positioned to the right" position="right">
 *   <span>Hover me</span>
 * </Tooltip>
 * 
 * <Tooltip 
 *   content="Longer tooltip text" 
 *   maxWidth="300px"
 *   delay={500}
 * >
 *   <button>Custom settings</button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 200,
  hideDelay = 100,
  maxWidth = '200px',
  className = '',
  showArrow = true,
  darkMode,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Detect dark mode from document
  const isDarkMode = darkMode !== undefined 
    ? darkMode 
    : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Position-specific styles
  const positionStyles: Record<TooltipPosition, Record<string, string>> = {
    top: {
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    bottom: {
      top: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    left: {
      right: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    right: {
      left: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
  };

  const arrowStyles: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-zinc-900 border-b-zinc-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-zinc-900 border-t-zinc-800',
    left: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-zinc-900 border-l-zinc-800',
    right: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-zinc-900 border-r-zinc-800',
  };

  // Show tooltip with delay
  const handleMouseEnter = () => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, delay);

    // Store timer ID for cleanup
    (triggerRef.current as any)._tooltipTimer = timer;
  };

  // Hide tooltip with delay
  const handleMouseLeave = () => {
    // Clear show timer
    const existingTimer = (triggerRef.current as any)?._tooltipTimer;
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Start hide animation
    setIsAnimating(false);

    // Actually hide after fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 200); // Fixed fade out duration

    (triggerRef.current as any)._tooltipHideTimer = timer;
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      const showTimer = (triggerRef.current as any)?._tooltipTimer;
      const hideTimer = (triggerRef.current as any)?._tooltipHideTimer;
      
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  // Clone child to add event handlers
  const triggerElement = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    'aria-describedby': isVisible ? 'tooltip-content' : undefined,
  });

  return (
    <div className="relative inline-block">
      {triggerElement}
      
      {/* Tooltip */}
      {isVisible && (
        <>
          {/* Tooltip content */}
          <div
            ref={tooltipRef}
            className={`
              absolute z-50
              px-3 py-2
              text-xs
              font-medium
              rounded-lg
              text-white
              whitespace-normal
              break-words
              ${isDarkMode 
                ? 'bg-zinc-900/95 border border-white/10 backdrop-blur-sm shadow-xl' 
                : 'bg-white/95 border border-zinc-200 text-zinc-900 shadow-lg backdrop-blur-sm'
              }
              transition-opacity
              duration-200
              ${isAnimating ? 'opacity-100' : 'opacity-0'}
              ${className}
            `}
            style={{
              ...positionStyles[position],
              maxWidth,
            }}
            id="tooltip-content"
            role="tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {content}
          </div>

          {/* Arrow indicator */}
          {showArrow && (
            <div
              className={`
                absolute w-0 h-0
                border-[6px]
                ${isDarkMode 
                  ? 'border-b-zinc-900' 
                  : 'border-t-white'
                }
                transition-opacity
                duration-200
                ${isAnimating ? 'opacity-100' : 'opacity-0'}
                ${arrowStyles[position]}
              `}
            />
          )}
        </>
      )}
    </div>
  );
};

// Preset tooltip components for common use cases
export const InfoTooltip: React.FC<{ 
  content: ReactNode; 
  className?: string; 
  position?: TooltipPosition 
}> = ({ content, className, position = 'top' }) => (
  <Tooltip content={content} position={position} className={className}>
    <span className="material-symbols-outlined text-zinc-400 hover:text-white cursor-help text-sm">
      info
    </span>
  </Tooltip>
);

export const HelpTooltip: React.FC<{ 
  content: ReactNode; 
  className?: string; 
  position?: TooltipPosition 
}> = ({ content, className, position = 'top' }) => (
  <Tooltip content={content} position={position} className={className}>
    <span className="material-symbols-outlined text-zinc-400 hover:text-white cursor-help text-sm">
      help
    </span>
  </Tooltip>
);

export default Tooltip;
