"use client";

import { PerformanceTest } from "@/components/debug/performance-test";
import { PerformanceDebugPanel } from "@/components/debug/performance-debug-panel";

export default function PerformanceDebugPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Debug de Rendimiento</h1>
          <p className="text-muted-foreground">
            Herramientas para diagnosticar y mejorar el rendimiento de la aplicación
          </p>
        </div>
      </div>

      <PerformanceTest />
      <PerformanceDebugPanel />
    </div>
  );
}
