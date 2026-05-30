import React, { useState, useEffect, useRef, Children } from 'react';

/**
 * PageTransition Component
 * 
 * Wrapper component that provides fade-in with slide-up animation for page content.
 * Supports staggered animation for multiple children.
 */

export interface PageTransitionProps {
  /**
   * Content to animate
   */
  children: React.ReactNode;
  
  /**
   * Animation duration in seconds
   * @default 0.4
   */
  duration?: number;
  
  /**
   * Delay between staggered children (ms)
   * @default 100
   */
  staggerDelay?: number;
  
  /**
   * Slide-up distance
   * @default 20
   */
  slideDistance?: number;
  
  /**
   * Enable stagger animation for children
   * @default true
   */
  stagger?: boolean;
  
  /**
   * Reduce motion for accessibility
   */
  reducedMotion?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
}

/**
 * StaggeredChild component for individual children
 */
interface StaggeredChildProps {
  children: React.ReactNode;
  index: number;
  duration: number;
  delay: number;
  slideDistance: number;
  reducedMotion?: boolean;
}

const StaggeredChild: React.FC<StaggeredChildProps> = ({
  children,
  index,
  duration,
  delay,
  slideDistance,
  reducedMotion = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * delay);

    return () => clearTimeout(timer);
  }, [index, delay]);

  const transitionStyle = reducedMotion
    ? { opacity: isVisible ? 1 : 0 }
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : `translateY(${slideDistance}px)`,
      };

  return (
    <div
      ref={ref}
      style={{
        transition: `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
        ...transitionStyle,
      }}
    >
      {children}
    </div>
  );
};

/**
 * PageTransition Component
 * 
 * Provides smooth fade-in and slide-up animations for page content.
 * Automatically applies staggered animations to direct children.
 * 
 * @example
 * ```tsx
 * <PageTransition>
 *   <div>First child (animates first)</div>
 *   <div>Second child (animates 100ms later)</div>
 *   <div>Third child (animates 200ms later)</div>
 * </PageTransition>
 * 
 * <PageTransition stagger={false}>
 *   <div>All content animates together</div>
 * </PageTransition>
 * 
 * <PageTransition duration={0.6} staggerDelay={150}>
 *   <div>Slower animation with more delay</div>
 * </PageTransition>
 * ```
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  duration = 0.4,
  staggerDelay = 100,
  slideDistance = 20,
  stagger = true,
  reducedMotion = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsVisible(true);
    } else {
      setIsVisible(true);
    }
  }, []);

  const transitionStyle = reducedMotion
    ? { opacity: isVisible ? 1 : 0 }
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : `translateY(${slideDistance}px)`,
      };

  // Convert children to array if stagger is enabled
  const childrenArray = Children.toArray(children);

  if (stagger && childrenArray.length > 1) {
    return (
      <div className={className}>
        {childrenArray.map((child, index) => (
          <StaggeredChild
            key={index}
            index={index}
            duration={duration}
            delay={staggerDelay}
            slideDistance={slideDistance}
            reducedMotion={reducedMotion}
          >
            {child}
          </StaggeredChild>
        ))}
      </div>
    );
  }

  // Non-staggered animation
  return (
    <div
      className={className}
      style={{
        transition: `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
        ...transitionStyle,
      }}
    >
      {children}
    </div>
  );
};

// Export hooks for programmatic control
export const usePageTransition = (options: {
  duration?: number;
  slideDistance?: number;
  reducedMotion?: boolean;
} = {}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const startTransition = async (callback: () => void) => {
    setIsTransitioning(true);
    setIsVisible(false);

    await new Promise(resolve => setTimeout(resolve, (options.duration || 0.4) * 1000));

    callback();
    setIsVisible(true);

    await new Promise(resolve => setTimeout(resolve, (options.duration || 0.4) * 1000));
    setIsTransitioning(false);
  };

  return {
    isTransitioning,
    isVisible,
    startTransition,
  };
};

export default PageTransition;
