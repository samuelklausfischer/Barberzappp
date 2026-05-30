/**
 * UI Components Index
 * 
 * Centralizado para facilitar imports de componentes UI.
 */

// Animated Card
export { AnimatedCard, type AnimatedCardProps, type CardVariant } from './AnimatedCard';
export { default as AnimatedCardDefault } from './AnimatedCard';

// Page Transition
export { 
  PageTransition, 
  usePageTransition,
  type PageTransitionProps 
} from './PageTransition';
export { default as PageTransitionDefault } from './PageTransition';

// Loading Skeleton
export { 
  LoadingSkeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonText,
  SkeletonButton,
  type LoadingSkeletonProps,
  type SkeletonVariant 
} from './LoadingSkeleton';
export { default as LoadingSkeletonDefault } from './LoadingSkeleton';

// Button Animated
export { 
  ButtonAnimated,
  type ButtonAnimatedProps,
  type ButtonVariant as ButtonAnimatedVariant,
  type ButtonSize as ButtonAnimatedSize 
} from './ButtonAnimated';
export { default as ButtonAnimatedDefault } from './ButtonAnimated';

// Tooltip
export { 
  Tooltip,
  InfoTooltip,
  HelpTooltip,
  type TooltipProps,
  type TooltipPosition 
} from './Tooltip';
export { default as TooltipDefault } from './Tooltip';

// Existing Button (keep for backward compatibility)
export { 
  Button, 
  IconRenderer,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type ButtonShape,
  type ButtonAnimation 
} from './Button';

// Badge (existing)
export { Badge, type BadgeProps } from './Badge';
