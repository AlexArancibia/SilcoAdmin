// Herramienta para monitorear el rendimiento de la aplicación
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Marcar el inicio de una operación
  startTiming(operation: string): void {
    this.metrics.set(`${operation}_start`, performance.now());
    console.log(`🚀 [Performance] Iniciando: ${operation}`);
  }

  // Marcar el final de una operación
  endTiming(operation: string): number {
    const startTime = this.metrics.get(`${operation}_start`);
    if (!startTime) {
      console.warn(`⚠️ [Performance] No se encontró tiempo de inicio para: ${operation}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics.set(`${operation}_duration`, duration);
    console.log(`✅ [Performance] Completado: ${operation} en ${duration.toFixed(2)}ms`);
    
    return duration;
  }

  // Medir una función asíncrona
  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(operation);
    try {
      const result = await fn();
      this.endTiming(operation);
      return result;
    } catch (error) {
      this.endTiming(operation);
      console.error(`❌ [Performance] Error en ${operation}:`, error);
      throw error;
    }
  }

  // Medir una función síncrona
  measure<T>(operation: string, fn: () => T): T {
    this.startTiming(operation);
    try {
      const result = fn();
      this.endTiming(operation);
      return result;
    } catch (error) {
      this.endTiming(operation);
      console.error(`❌ [Performance] Error en ${operation}:`, error);
      throw error;
    }
  }

  // Obtener métricas
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.metrics.entries()) {
      if (key.endsWith('_duration')) {
        result[key.replace('_duration', '')] = value;
      }
    }
    return result;
  }

  // Limpiar métricas
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Obtener resumen de rendimiento
  getPerformanceSummary(): {
    totalOperations: number;
    averageTime: number;
    slowestOperation: { name: string; time: number };
    fastestOperation: { name: string; time: number };
  } {
    const durations = this.getMetrics();
    const operations = Object.entries(durations);
    
    if (operations.length === 0) {
      return {
        totalOperations: 0,
        averageTime: 0,
        slowestOperation: { name: 'N/A', time: 0 },
        fastestOperation: { name: 'N/A', time: 0 }
      };
    }

    const times = operations.map(([, time]) => time);
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    
    const slowest = operations.reduce((max, [name, time]) => 
      time > max.time ? { name, time } : max, 
      { name: operations[0][0], time: operations[0][1] }
    );
    
    const fastest = operations.reduce((min, [name, time]) => 
      time < min.time ? { name, time } : min, 
      { name: operations[0][0], time: operations[0][1] }
    );

    return {
      totalOperations: operations.length,
      averageTime,
      slowestOperation: slowest,
      fastestOperation: fastest
    };
  }

  // Observar el rendimiento de la página
  observePagePerformance(): void {
    if (typeof window === 'undefined') return;

    // Observar métricas de navegación
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('📊 [Performance] Métricas de navegación:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            totalTime: navEntry.loadEventEnd - navEntry.fetchStart
          });
        }
      }
    });

    try {
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    } catch (error) {
      console.warn('No se pudo configurar el observador de navegación:', error);
    }

    // Observar métricas de recursos
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          console.log(`📦 [Performance] Recurso cargado: ${resourceEntry.name} en ${resourceEntry.duration.toFixed(2)}ms`);
        }
      }
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      console.warn('No se pudo configurar el observador de recursos:', error);
    }
  }

  // Limpiar observadores
  disconnect(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// Instancia singleton
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook para React
export function usePerformanceMonitor() {
  return performanceMonitor;
}
