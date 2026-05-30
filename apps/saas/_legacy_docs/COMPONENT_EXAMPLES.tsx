/**
 * Component Examples - UI Enhancements
 * 
 * This file demonstrates all the new UI components in action.
 * Can be used as a reference or copied into a demo page.
 */

import React, { useState } from 'react';
import { 
  AnimatedCard, 
  PageTransition, 
  LoadingSkeleton, 
  ButtonAnimated,
  Tooltip,
  InfoTooltip,
  HelpTooltip
} from '@/components/ui';
import { 
  ThemeProvider, 
  useTheme, 
  ThemeToggle 
} from '@/themes/ThemeProviderSimple';

// ============================================================================
// Example 1: Animated Cards
// ============================================================================

function AnimatedCardsExample() {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Animated Card Variants</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Default Card */}
        <AnimatedCard variant="default" hoverable>
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-2xl">star</span>
            <h3 className="font-bold">Default Card</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Standard card with subtle border and hover lift effect
          </p>
        </AnimatedCard>

        {/* Gold Card */}
        <AnimatedCard variant="gold" glow hoverable>
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-2xl text-[#f4c025]">diamond</span>
            <h3 className="font-bold">Gold Card</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Premium card with golden gradient and glow effect
          </p>
        </AnimatedCard>

        {/* Gradient Card */}
        <AnimatedCard variant="gradient" hoverable>
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            <h3 className="font-bold">Gradient Card</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Card with background gradient overlay
          </p>
        </AnimatedCard>
      </div>
    </section>
  );
}

// ============================================================================
// Example 2: Button Variants
// ============================================================================

function ButtonVariantsExample() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleAsyncAction = async () => {
    setLoading(true);
    setSuccess(false);
    setError(false);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    // Random success/error for demo
    Math.random() > 0.3 ? setSuccess(true) : setError(true);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold mb-6">Button Animated Variants</h2>
      
      {/* Button Variants */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <ButtonAnimated variant="primary">Primary</ButtonAnimated>
          <ButtonAnimated variant="secondary">Secondary</ButtonAnimated>
          <ButtonAnimated variant="danger">Danger</ButtonAnimated>
          <ButtonAnimated variant="success">Success</ButtonAnimated>
          <ButtonAnimated variant="ghost">Ghost</ButtonAnimated>
        </div>

        {/* Button Sizes */}
        <div className="flex flex-wrap items-center gap-3">
          <ButtonAnimated size="xs">Extra Small</ButtonAnimated>
          <ButtonAnimated size="sm">Small</ButtonAnimated>
          <ButtonAnimated size="md">Medium</ButtonAnimated>
          <ButtonAnimated size="lg">Large</ButtonAnimated>
          <ButtonAnimated size="xl">Extra Large</ButtonAnimated>
        </div>

        {/* With Icons */}
        <div className="flex flex-wrap gap-3">
          <ButtonAnimated icon="add">Add New</ButtonAnimated>
          <ButtonAnimated variant="secondary" icon="edit">Edit</ButtonAnimated>
          <ButtonAnimated variant="danger" icon="delete">Delete</ButtonAnimated>
          <ButtonAnimated variant="success" icon="check">Confirm</ButtonAnimated>
        </div>

        {/* States */}
        <div className="flex flex-wrap gap-3">
          <ButtonAnimated 
            loading={loading}
            success={success}
            error={error}
            onClick={handleAsyncAction}
          >
            {loading ? 'Loading...' : success ? 'Success!' : error ? 'Try Again' : 'Click Me'}
          </ButtonAnimated>
          
          <ButtonAnimated disabled>Disabled</ButtonAnimated>
          
          <ButtonAnimated fullWidth>Full Width</ButtonAnimated>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Example 3: Page Transitions
// ============================================================================

function PageTransitionExample() {
  const [content, setContent] = useState('list');

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Page Transitions</h2>
        <div className="flex gap-2">
          <ButtonAnimated 
            size="sm" 
            variant={content === 'list' ? 'primary' : 'ghost'}
            onClick={() => setContent('list')}
          >
            List
          </ButtonAnimated>
          <ButtonAnimated 
            size="sm" 
            variant={content === 'grid' ? 'primary' : 'ghost'}
            onClick={() => setContent('grid')}
          >
            Grid
          </ButtonAnimated>
        </div>
      </div>

      <PageTransition stagger staggerDelay={100} key={content}>
        {content === 'list' ? (
          <div className="space-y-3">
            {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map((item, i) => (
              <AnimatedCard key={i} variant="default" delay={i * 100}>
                {item} - Animated in sequence
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <AnimatedCard key={i} variant="gold" delay={i * 100} hoverable>
                Card {i + 1}
              </AnimatedCard>
            ))}
          </div>
        )}
      </PageTransition>
    </section>
  );
}

// ============================================================================
// Example 4: Loading Skeletons
// ============================================================================

function LoadingSkeletonExample() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<string[]>([]);

  const handleRefresh = () => {
    setLoading(true);
    setData([]);
    
    setTimeout(() => {
      setData(['Card 1', 'Card 2', 'Card 3']);
      setLoading(false);
    }, 2000);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Loading Skeletons</h2>
        <ButtonAnimated size="sm" onClick={handleRefresh}>
          Refresh
        </ButtonAnimated>
      </div>

      {/* Basic Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-3">Text Variants</h3>
          <div className="space-y-2">
            <LoadingSkeleton variant="text" width="100%" />
            <LoadingSkeleton variant="text" width="80%" />
            <LoadingSkeleton variant="text" lines={3} />
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-3">Shape Variants</h3>
          <div className="flex gap-3 items-center">
            <LoadingSkeleton variant="circular" width="40px" height="40px" />
            <LoadingSkeleton variant="rectangular" width="60px" height="40px" />
            <LoadingSkeleton variant="rounded" width="80px" height="40px" />
          </div>
        </div>
      </div>

      {/* Preset Skeletons */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 mb-3">Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton variant="rounded" height="120px" />
          <LoadingSkeleton variant="rounded" height="120px" />
          <LoadingSkeleton variant="rounded" height="120px" />
        </div>
      </div>

      {/* Real-world Example */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 mb-3">Real Example</h3>
        <PageTransition>
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton variant="rounded" height="100px" />
              <LoadingSkeleton variant="rounded" height="100px" />
              <LoadingSkeleton variant="rounded" height="100px" />
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((item, i) => (
                <AnimatedCard key={i} variant="default" delay={i * 100}>
                  {item} - Loaded data
                </AnimatedCard>
              ))}
            </div>
          )}
        </PageTransition>
      </div>
    </section>
  );
}

// ============================================================================
// Example 5: Tooltips
// ============================================================================

function TooltipExample() {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Tooltips</h2>
      
      {/* Basic Tooltip */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <span>Hover these:</span>
          
          <Tooltip content="Top tooltip" position="top">
            <ButtonAnimated size="sm" variant="ghost">Top</ButtonAnimated>
          </Tooltip>
          
          <Tooltip content="Bottom tooltip" position="bottom">
            <ButtonAnimated size="sm" variant="ghost">Bottom</ButtonAnimated>
          </Tooltip>
          
          <Tooltip content="Left tooltip" position="left">
            <ButtonAnimated size="sm" variant="ghost">Left</ButtonAnimated>
          </Tooltip>
          
          <Tooltip content="Right tooltip" position="right">
            <ButtonAnimated size="sm" variant="ghost">Right</ButtonAnimated>
          </Tooltip>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <span>On icons:</span>
          
          <InfoTooltip content="This is important information" />
          <HelpTooltip content="Need assistance with this?" />
          
          <Tooltip content="Settings icon">
            <span className="material-symbols-outlined cursor-pointer text-zinc-400 hover:text-white">
              settings
            </span>
          </Tooltip>
          
          <Tooltip content="Delete action" position="top">
            <span className="material-symbols-outlined cursor-pointer text-zinc-400 hover:text-red-500">
              delete
            </span>
          </Tooltip>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <span>Custom delay:</span>
          
          <Tooltip content="Fast tooltip (50ms)" delay={50}>
            <ButtonAnimated size="sm" variant="ghost">Fast</ButtonAnimated>
          </Tooltip>
          
          <Tooltip content="Slow tooltip (500ms)" delay={500}>
            <ButtonAnimated size="sm" variant="ghost">Slow</ButtonAnimated>
          </Tooltip>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Example 6: Theme Provider
// ============================================================================

function ThemeExample() {
  const { mode, isDark, toggleTheme, setTheme } = useTheme();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Theme Provider</h2>
        <ThemeToggle size="lg" />
      </div>

      <AnimatedCard variant="default" glow>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Current Mode:</span>
            <span className="font-bold text-[#f4c025]">{mode}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Is Dark Mode:</span>
            <span className="font-bold">{isDark ? 'Yes' : 'No'}</span>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <ButtonAnimated size="sm" onClick={toggleTheme}>
              Toggle
            </ButtonAnimated>
            <ButtonAnimated size="sm" variant="secondary" onClick={() => setTheme('dark')}>
              Dark
            </ButtonAnimated>
            <ButtonAnimated size="sm" variant="secondary" onClick={() => setTheme('light')}>
              Light
            </ButtonAnimated>
          </div>
        </div>
      </AnimatedCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedCard variant="gold" hoverable>
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">42</p>
            <p className="text-sm text-zinc-400">Agendamentos</p>
          </div>
        </AnimatedCard>
        
        <AnimatedCard variant="default" hoverable>
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">R$ 1.500</p>
            <p className="text-sm text-zinc-400">Faturamento</p>
          </div>
        </AnimatedCard>
        
        <AnimatedCard variant="default" hoverable>
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">156</p>
            <p className="text-sm text-zinc-400">Clientes</p>
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
}

// ============================================================================
// Main Demo Page
// ============================================================================

export default function UIEnhancementsDemo() {
  return (
    <ThemeProvider defaultMode="dark">
      <div className="min-h-screen bg-[#09090b] p-8">
        <PageTransition>
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <header className="text-center py-8">
              <h1 className="text-4xl font-bold mb-4 text-[#f4c025]">
                BarberZap UI Enhancements
              </h1>
              <p className="text-zinc-400 text-lg">
                Modern, animated components with dark/light theme support
              </p>
            </header>

            {/* All Examples */}
            <AnimatedCardsExample />
            <hr className="border-white/10" />
            <ButtonVariantsExample />
            <hr className="border-white/10" />
            <PageTransitionExample />
            <hr className="border-white/10" />
            <LoadingSkeletonExample />
            <hr className="border-white/10" />
            <TooltipExample />
            <hr className="border-white/10" />
            <ThemeExample />

            {/* Footer */}
            <footer className="text-center py-8 text-zinc-500">
              <p>UI Enhancements Demo - All components working correctly ✨</p>
            </footer>
          </div>
        </PageTransition>
      </div>
    </ThemeProvider>
  );
}
