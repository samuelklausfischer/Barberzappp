/**
 * BarberZap - React Performance Profiler Wrapper
 * 
 * Componente wrapper para profiling de renderização React.
 * Coleta métricas de tempo de render, análise de tree e hotspots de state change.
 * 
 * Usage:
 * ```tsx
 * import { Profiler } from '@/profiler/ReactProfiler';
 * 
 * <Profiler id="MyComponent" onRender={handleRender}>
 *   <MyComponent />
 * </Profiler>
 * ```
 * 
 * ou com callback automático:
 * ```tsx
 * import { withProfiler } from '@/profiler/ReactProfiler';
 * 
 * const ProfiledComponent = withProfiler(MyComponent);
 * ```
 */

import React, { Profiler as ReactProfiler, ProfilerOnRenderCallback } from 'react';

export interface RenderInfo {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<string> | null;
}

export interface ProfilerData {
  componentId: string;
  renders: RenderInfo[];
  totalRenderTime: number;
  avgRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  mountCount: number;
  updateCount: number;
  lastRendered: string;
}

// Registry global de dados de profiling
class ProfilerRegistry {
  private static instance: ProfilerRegistry;
  private profiles: Map<string, ProfilerData>;
  
  private constructor() {
    this.profiles = new Map();
  }
  
  static getInstance(): ProfilerRegistry {
    if (!ProfilerRegistry.instance) {
      ProfilerRegistry.instance = new ProfilerRegistry();
    }
    return ProfilerRegistry.instance;
  }
  
  recordRender(renderInfo: RenderInfo): void {
    const { id } = renderInfo;
    
    if (!this.profiles.has(id)) {
      this.profiles.set(id, {
        componentId: id,
        renders: [],
        totalRenderTime: 0,
        avgRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
        mountCount: 0,
        updateCount: 0,
        lastRendered: new Date().toISOString()
      });
    }
    
    const profile = this.profiles.get(id)!;
    
    // Atualizar contagem
    if (renderInfo.phase === 'mount') {
      profile.mountCount++;
    } else {
      profile.updateCount++;
    }
    
    // Adicionar render time
    profile.renders.push({ ...renderInfo });
    profile.totalRenderTime += renderInfo.actualDuration;
    
    // Atualizar estatísticas
    const renderCount = profile.renders.length;
    profile.avgRenderTime = profile.totalRenderTime / renderCount;
    profile.maxRenderTime = Math.max(profile.maxRenderTime, renderInfo.actualDuration);
    profile.minRenderTime = Math.min(profile.minRenderTime, renderInfo.actualDuration);
    profile.lastRendered = new Date().toISOString();
    
    // Manter apenas últimos 1000 renders
    if (profile.renders.length > 1000) {
      profile.renders = profile.renders.slice(-1000);
    }
  }
  
  getProfile(componentId: string): ProfilerData | undefined {
    return this.profiles.get(componentId);
  }
  
  getAllProfiles(): ProfilerData[] {
    return Array.from(this.profiles.values());
  }
  
  getSlowestRenders(limit: number = 20): Array<{ profile: ProfilerData; render: RenderInfo }> {
    const slowRenders: Array<{ profile: ProfilerData; render: RenderInfo }> = [];
    
    for (const profile of this.profiles.values()) {
      for (const render of profile.renders) {
        slowRenders.push({ profile, render });
      }
    }
    
    // Ordenar por duration desc
    slowRenders.sort((a, b) => b.render.actualDuration - a.render.actualDuration);
    
    return slowRenders.slice(0, limit);
  }
  
  getReRenderRate(componentId: string): number {
    const profile = this.profiles.get(componentId);
    if (!profile || profile.mountCount === 0) {
      return 0;
    }
    return profile.updateCount / (profile.mountCount + profile.updateCount);
  }
  
  getComponentsWithHighReRenderRate(threshold: number = 0.5): ProfilerData[] {
    return Array.from(this.profiles.values()).filter(
      profile => this.getReRenderRate(profile.componentId) > threshold
    );
  }
  
  clearProfile(componentId?: string): void {
    if (componentId) {
      this.profiles.delete(componentId);
    } else {
      this.profiles.clear();
    }
  }
}

// Export registry instance
export const profilerRegistry = ProfilerRegistry.getInstance();

// Callback padrão do Profiler
export const defaultOnRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions
) => {
  const renderInfo: RenderInfo = {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  };
  
  profilerRegistry.recordRender(renderInfo);
  
  // Log renders lentos (> 16ms = 1 frame)
  if (actualDuration > 16) {
    console.warn(
      `[Profiler] Slow render detected in ${id} (${phase}): ${actualDuration.toFixed(2)}ms`
    );
  }
};

// Componente Profiler wrapper
export interface ProfilerProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  onRender?: ProfilerOnRenderCallback;
}
export const Profiler: React.FC<ProfilerProps> = ({
  id,
  children,
  disabled = false,
  onRender = defaultOnRender
}) => {
  // Profiling enabled only in development or if explicitly enabled
  const isProfilingEnabled =
    process.env.NODE_ENV === 'development' ||
    localStorage.getItem('PROFILING_ENABLED') === 'true';
  
  if (disabled || !isProfilingEnabled) {
    return <>{children}</>;
  }
  
  return (
    <ReactProfiler id={id} onRender={onRender}>
      {children}
    </ReactProfiler>
  );
};

// HOC para automaticamente adicionar profiler
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    id?: string;
    disabled?: boolean;
    onRender?: ProfilerOnRenderCallback;
  } = {}
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const profilerId = options.id || Component.displayName || Component.name || 'Anonymous';
    
    return (
      <Profiler
        id={profilerId}
        disabled={options.disabled}
        onRender={options.onRender}
      >
        <Component {...props} ref={ref} />
      </Profiler>
    );
  });
  
  WrappedComponent.displayName = `Profiler(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook para acessar dados de profiling
export function useProfilerData(componentId: string) {
  const [data, setData] = React.useState<ProfilerData | undefined>(undefined);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setData(profilerRegistry.getProfile(componentId));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [componentId]);
  
  return data;
}

// Hook para obtodos os profiles
export function useAllProfilerData() {
  const [data, setData] = React.useState<ProfilerData[]>([]);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setData(profilerRegistry.getAllProfiles());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return data;
}

// Hook para obter re-render rate
export function useReRenderRate(componentId: string): number {
  const [rate, setRate] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRate(profilerRegistry.getReRenderRate(componentId));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [componentId]);
  
  return rate;
}

// Exportar tipos
export type { ProfilerOnRenderCallback };

export default Profiler;
