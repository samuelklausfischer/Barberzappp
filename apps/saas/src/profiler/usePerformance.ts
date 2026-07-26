/**
 * BarberZap - Performance Measurement Hooks
 * 
 * Coleção de hooks para medir performance em componentes React.
 * 
 * Hooks disponíveis:
 * - useMeasureRenderTime: Mede tempo de renderização
 * - useMeasureComponentRender: Mede ciclos de render completos
 * - useMeasureCallbackTime: Mede tempo de execução de callbacks
 * - useMeasureMutationTime: Mede tempo de mutations (React Query, etc)
 * - useMeasureLayout: Mede tempo de layout/reflow
 * - useMeasurePaint: Mede tempo de paint
 */

import { useRef, useCallback, useEffect, useState } from 'react';

// Metric types
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  details?: Record<string, unknown>;
}

interface RenderMetric extends PerformanceMetric {
  phase: 'mount' | 'update';
  component: string;
}

// ============================================
// useMeasureRenderTime
// ============================================

export interface RenderTimeMetrics {
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  lastRenderTime: number;
}

export function useMeasureRenderTime(componentName?: string): {
  metrics: RenderTimeMetrics;
  measureRender: (phase: 'mount' | 'update') => void;
  reset: () => void;
} {
  const metricsRef = useRef<{
    renders: PerformanceMetric[];
  }>({ renders: [] });
  
  const [metrics, setMetrics] = useState<RenderTimeMetrics>({
    count: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
    lastRenderTime: 0
  });
  
  const measureRender = useCallback((phase: 'mount' | 'update') => {
    const startTime = performance.now();
    
    // Marca antes do render
    performance.mark(`${componentName || 'Component'}_${phase}_start`);
    
    // Medir após o render completar
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performance.mark(`${componentName || 'Component'}_${phase}_end`);
      performance.measure(
        `${componentName || 'Component'}_${phase}`,
        `${componentName || 'Component'}_${phase}_start`,
        `${componentName || 'Component'}_${phase}_end`
      );
      
      metricsRef.current.renders.push({
        name: `${componentName || 'Component'}_${phase}`,
        duration,
        timestamp: Date.now(),
        details: { phase }
      });
      
      // Atualizar estatísticas
      const renders = metricsRef.current.renders;
      setMetrics({
        count: renders.length,
        totalDuration: renders.reduce((sum, r) => sum + r.duration, 0),
        avgDuration: renders.reduce((sum, r) => sum + r.duration, 0) / renders.length,
        maxDuration: Math.max(...renders.map(r => r.duration)),
        minDuration: Math.min(...renders.map(r => r.duration)),
        lastRenderTime: duration
      });
      
      // Log renders lentos
      if (duration > 16) {
        console.warn(
          `[Performance] Slow render in ${componentName || 'Component'} (${phase}): ${duration.toFixed(2)}ms`
        );
      }
    });
  }, [componentName]);
  
  const reset = useCallback(() => {
    metricsRef.current.renders = [];
    setMetrics({
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      lastRenderTime: 0
    });
  }, []);
  
  return { metrics, measureRender, reset };
}

// ============================================
// useMeasureComponentRender
// ============================================

export function useMeasureComponentRender(
  componentId: string,
  onSlowRender?: (duration: number) => void,
  slowThreshold: number = 16
) {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderDuration, setLastRenderDuration] = useState(0);
  const [slowRenderCount, setSlowRenderCount] = useState(0);
  
  useEffect(() => {
    const mountMark = `${componentId}_mount`;
    const measureName = `${componentId}_render`;
    
    performance.mark(mountMark);
    
    return () => {
      // Cleanup
      setRenderCount(0);
      setLastRenderDuration(0);
      setSlowRenderCount(0);
    };
  }, [componentId]);
  
  useEffect(() => {
    const startMark = `${componentId}_render_start`;
    const endMark = `${componentId}_render_end`;
    const measureName = `${componentId}_render`;
    
    performance.mark(startMark);
    
    return () => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const entries = performance.getEntriesByName(measureName, 'measure');
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        const duration = lastEntry.duration;
        
        setRenderCount(c => c + 1);
        setLastRenderDuration(duration);
        
        if (duration > slowThreshold) {
          setSlowRenderCount(c => c + 1);
          onSlowRender?.(duration);
        }
        
        // Log slow renders
        if (duration > 16) {
          console.warn(
            `[ComponentRender] ${componentId} rendered in ${duration.toFixed(2)}ms`
          );
        }
      }
      
      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
    };
  });
  
  return {
    renderCount,
    lastRenderDuration,
    slowRenderCount,
    slowRenderRate: renderCount > 0 ? slowRenderCount / renderCount : 0
  };
}

// ============================================
// useMeasureCallbackTime
// ============================================

export function useMeasureCallbackTime<T extends (...args: unknown[]) => ReturnType<T>>(
  callback: T,
  callbackName?: string,
  onSlowCallback?: (duration: number) => void,
  slowThreshold: number = 50
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  const [metrics, setMetrics] = useState<{
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    slowCount: number;
  }>({
    count: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: 0,
    slowCount: 0
  });
  
  const measuredCallback = useCallback((...args: Parameters<T>): ReturnType<T> => {
    const startTime = performance.now();
    const startMark = `${callbackName || 'Callback'}_${Date.now()}_start`;
    const endMark = `${callbackName || 'Callback'}_${Date.now()}_end`;
    
    performance.mark(startMark);
    
    try {
      const result = callbackRef.current(...args);
      
      performance.mark(endMark);
      performance.measure(
        `${callbackName || 'Callback'}`,
        startMark,
        endMark
      );
      
      const duration = performance.now() - startTime;
      
      setMetrics(prev => {
        const newCount = prev.count + 1;
        const newTotalDuration = prev.totalDuration + duration;
        const newSlowCount = duration > slowThreshold ? prev.slowCount + 1 : prev.slowCount;
        
        return {
          count: newCount,
          totalDuration: newTotalDuration,
          avgDuration: newTotalDuration / newCount,
          maxDuration: Math.max(prev.maxDuration, duration),
          slowCount: newSlowCount
        };
      });
      
      if (duration > slowThreshold) {
        console.warn(
          `[Callback] ${callbackName || 'Callback'} executed in ${duration.toFixed(2)}ms`
        );
        onSlowCallback?.(duration);
      }
      
      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      
      return result;
    } catch (error) {
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      throw error;
    }
  }, [callbackName, slowThreshold, onSlowCallback]);
  
  return measuredCallback as T;
}

// ============================================
// useMeasureMutationTime
// ============================================

export interface MutationMetrics {
  successCount: number;
  errorCount: number;
  totalDuration: number;
  avgDuration: number;
  lastDuration: number;
  maxDuration: number;
}

export function useMeasureMutationTime(
  mutationName?: string
): {
  measureMutation: <T>(mutation: () => Promise<T>) => Promise<T>;
  metrics: MutationMetrics;
  reset: () => void;
} {
  const metricsRef = useRef<MutationMetrics>({
    successCount: 0,
    errorCount: 0,
    totalDuration: 0,
    avgDuration: 0,
    lastDuration: 0,
    maxDuration: 0
  });
  
  const [metrics, setMetrics] = useState<MutationMetrics>({
    successCount: 0,
    errorCount: 0,
    totalDuration: 0,
    avgDuration: 0,
    lastDuration: 0,
    maxDuration: 0
  });
  
  const measureMutation = useCallback(async <T>(mutation: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await mutation();
      
      const duration = performance.now() - startTime;
      
      metricsRef.current.successCount++;
      metricsRef.current.totalDuration += duration;
      metricsRef.current.lastDuration = duration;
      metricsRef.current.avgDuration =
        metricsRef.current.totalDuration / metricsRef.current.successCount;
      metricsRef.current.maxDuration = Math.max(metricsRef.current.maxDuration, duration);
      
      setMetrics({ ...metricsRef.current });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      metricsRef.current.errorCount++;
      
      setMetrics({ ...metricsRef.current });
      
      throw error;
    }
  }, []);
  
  const reset = useCallback(() => {
    metricsRef.current = {
      successCount: 0,
      errorCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      lastDuration: 0,
      maxDuration: 0
    };
    setMetrics({ ...metricsRef.current });
  }, []);
  
  return { measureMutation, metrics, reset };
}

// ============================================
// useMeasureLayout
// ============================================

export function useMeasureLayout(componentName?: string) {
  const [layoutDuration, setLayoutDuration] = useState(0);
  const [layoutCount, setLayoutCount] = useState(0);
  
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        if (entry.entryType === 'layout-shift') {
          setLayoutCount(c => c + 1);
          
          // Layout shift é um evento, não tem duration
          // Medimos o tempo de reflow através de marks
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Layout Shift API não disponível em todos browsers
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  const measureLayout = useCallback(() => {
    const beforeMark = `${componentName || 'Component'}_layout_before`;
    const afterMark = `${componentName || 'Component'}_layout_after`;
    
    performance.mark(beforeMark);
    forceLayout();
    performance.mark(afterMark);
    
    performance.measure(
      `${componentName || 'Component'}_layout`,
      beforeMark,
      afterMark
    );
    
    const entries = performance.getEntriesByName(
      `${componentName || 'Component'}_layout`,
      'measure'
    );
    
    if (entries.length > 0) {
      const duration = entries[entries.length - 1].duration;
      setLayoutDuration(duration);
      
      if (duration > 16) {
        console.warn(
          `[Layout] ${componentName || 'Component'} took ${duration.toFixed(2)}ms for layout`
        );
      }
      
      // Cleanup
      performance.clearMarks(beforeMark);
      performance.clearMarks(afterMark);
    }
  }, [componentName]);
  
  return { layoutDuration, layoutCount, measureLayout };
}

// Helper para forçar layout
function forceLayout(): void {
  void document.body.offsetHeight; // Force reflow
}

// ============================================
// useMeasurePaint
// ============================================

export function useMeasurePaint(componentName?: string) {
  const [paintDuration, setPaintDuration] = useState(0);
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          const duration = entry.duration;
          setPaintDuration(duration);
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Paint API não disponível em todos browsers
    }
    
    // Medir FPS
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFps = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFps);
    };
    
    requestAnimationFrame(measureFps);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  const measurePaint = useCallback(() => {
    // Paint events são automáticos via PerformanceObserver
    // Esta função pode ser usada para adicionar marks customizadas
    performance.mark(`${componentName || 'Component'}_paint`);
  }, [componentName]);
  
  return { paintDuration, fps, measurePaint };
}

// ============================================
// usePerformanceSummary
// ============================================

export interface PerformanceSummary {
  component: string;
  renderCount: number;
  avgRenderTime: number;
  maxRenderTime: number;
  slowRenderCount: number;
  reRenderRate: number;
  fps?: number;
}

export function usePerformanceSummary(componentId: string) {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Buscar dados do ReactProfiler registry
      const profiles = (window as any).__profilerRegistry?.getProfile(componentId);
      
      if (profiles) {
        setSummary({
          component: componentId,
          renderCount: profiles.mountCount + profiles.updateCount,
          avgRenderTime: profiles.avgRenderTime,
          maxRenderTime: profiles.maxRenderTime,
          slowRenderCount: profiles.renders.filter((r: { actualDuration: number }) => r.actualDuration > 16).length,
          reRenderRate: profiles.updateCount / (profiles.mountCount + profiles.updateCount)
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [componentId]);
  
  return summary;
}

// Export tipos padrão
export type {
  PerformanceMetric,
  RenderMetric
};
