"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { performanceMonitor } from "@/utils/performance-monitor";
import { RefreshCw, Trash2, Download } from "lucide-react";

export function PerformanceDebugPanel() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    // Actualizar métricas cada segundo
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Actualizar inmediatamente

    return () => clearInterval(interval);
  }, []);

  const summary = performanceMonitor.getPerformanceSummary();

  const exportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      summary,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          📊 Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Performance Monitor</CardTitle>
              <CardDescription className="text-xs">
                Monitoreo de rendimiento en tiempo real
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMetrics(performanceMonitor.getMetrics())}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={exportMetrics}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => performanceMonitor.clearMetrics()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Resumen */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Resumen</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Operaciones:</span>
                <Badge variant="secondary">{summary.totalOperations}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Promedio:</span>
                <Badge variant="outline">{summary.averageTime.toFixed(1)}ms</Badge>
              </div>
            </div>
          </div>

          {/* Operación más lenta */}
          {summary.slowestOperation.name !== 'N/A' && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground">Más Lenta</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="truncate">{summary.slowestOperation.name}</span>
                <Badge variant="destructive">{summary.slowestOperation.time.toFixed(1)}ms</Badge>
              </div>
            </div>
          )}

          {/* Operación más rápida */}
          {summary.fastestOperation.name !== 'N/A' && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground">Más Rápida</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="truncate">{summary.fastestOperation.name}</span>
                <Badge variant="default">{summary.fastestOperation.time.toFixed(1)}ms</Badge>
              </div>
            </div>
          )}

          {/* Métricas detalladas */}
          {Object.keys(metrics).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Detalles</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(metrics).map(([operation, time]) => (
                  <div key={operation} className="flex justify-between items-center text-xs">
                    <span className="truncate flex-1">{operation}</span>
                    <Badge 
                      variant={time > 1000 ? "destructive" : time > 500 ? "secondary" : "outline"}
                      className="ml-2"
                    >
                      {time.toFixed(1)}ms
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información del sistema */}
          <div className="space-y-1 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              <div>URL: {window.location.pathname}</div>
              <div>Memoria: {performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB` : 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
