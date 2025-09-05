import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '@/utils/performance-monitor';

interface UseOptimizedDataLoadingOptions {
  enabled?: boolean;
  cacheKey?: string;
  staleTime?: number; // tiempo en ms antes de que los datos se consideren obsoletos
  retryCount?: number;
  retryDelay?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, staleTime: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isStale = Date.now() - entry.timestamp > entry.staleTime;
    if (isStale) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const isStale = Date.now() - entry.timestamp > entry.staleTime;
    if (isStale) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const dataCache = new DataCache();

export function useOptimizedDataLoading<T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseOptimizedDataLoadingOptions = {}
) {
  const {
    enabled = true,
    cacheKey,
    staleTime = 5 * 60 * 1000, // 5 minutos por defecto
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null;

    // Verificar caché si existe
    if (cacheKey && dataCache.has(cacheKey)) {
      console.log(`📦 [Cache] Datos encontrados en caché para: ${cacheKey}`);
      return dataCache.get<T>(cacheKey);
    }

    try {
      const data = await performanceMonitor.measureAsync(
        `load-data-${cacheKey || 'unknown'}`, 
        loadFunction
      );

      // Guardar en caché si se especificó una clave
      if (cacheKey && data) {
        dataCache.set(cacheKey, data, staleTime);
        console.log(`💾 [Cache] Datos guardados en caché para: ${cacheKey}`);
      }

      retryCountRef.current = 0;
      return data;
    } catch (error) {
      console.error(`❌ [DataLoading] Error al cargar datos:`, error);
      
      // Reintentar si no se ha excedido el límite
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        console.log(`🔄 [DataLoading] Reintentando (${retryCountRef.current}/${retryCount})...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
        
        if (isMountedRef.current) {
          return loadData();
        }
      }
      
      throw error;
    }
  }, [loadFunction, enabled, cacheKey, staleTime, retryCount, retryDelay]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Limpiar caché cuando cambien las dependencias
  useEffect(() => {
    if (cacheKey) {
      dataCache.clear(cacheKey);
    }
  }, dependencies);

  return {
    loadData,
    clearCache: useCallback(() => {
      if (cacheKey) {
        dataCache.clear(cacheKey);
        console.log(`🗑️ [Cache] Caché limpiado para: ${cacheKey}`);
      }
    }, [cacheKey]),
    isCached: cacheKey ? dataCache.has(cacheKey) : false
  };
}

// Hook específico para cargar datos de forma paralela
export function useParallelDataLoading<T extends Record<string, any>>(
  loaders: { [K in keyof T]: () => Promise<T[K]> },
  options: UseOptimizedDataLoadingOptions = {}
) {
  const loadAllData = useCallback(async (): Promise<T | null> => {
    if (!options.enabled) return null;

    try {
      const results = await performanceMonitor.measureAsync(
        'load-all-data-parallel',
        async () => {
          const promises = Object.entries(loaders).map(async ([key, loader]) => {
            const data = await loader();
            return [key, data] as const;
          });

          const results = await Promise.all(promises);
          return Object.fromEntries(results) as T;
        }
      );

      return results;
    } catch (error) {
      console.error('❌ [ParallelDataLoading] Error al cargar datos en paralelo:', error);
      throw error;
    }
  }, [loaders, options.enabled]);

  return { loadAllData };
}
