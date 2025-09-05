"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { performanceMonitor } from "@/utils/performance-monitor";
import { useBrandeoStore } from "@/store/useBrandeoStore";
import { useInstructoresStore } from "@/store/useInstructoresStore";
import { usePeriodosStore } from "@/store/usePeriodosStore";
import { Play, Square, Download, Trash2 } from "lucide-react";

interface TestResult {
  testName: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

export function PerformanceTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testPageSize, setTestPageSize] = useState(10);
  const [testIterations, setTestIterations] = useState(5);

  const { fetchBrandeos } = useBrandeoStore();
  const { fetchInstructores } = useInstructoresStore();
  const { fetchPeriodos } = usePeriodosStore();

  const runSingleTest = async (testName: string, testFn: () => Promise<any>): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      return {
        testName,
        duration,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: Date.now()
      };
    }
  };

  const runPerformanceTests = async () => {
    setIsRunning(true);
    setResults([]);
    performanceMonitor.clearMetrics();

    const tests: Array<{ name: string; fn: () => Promise<any> }> = [
      {
        name: `Cargar Brandeos (${testPageSize} items)`,
        fn: () => fetchBrandeos({ page: 1, limit: testPageSize })
      },
      {
        name: 'Cargar Instructores',
        fn: () => fetchInstructores()
      },
      {
        name: 'Cargar Periodos',
        fn: () => fetchPeriodos()
      },
      {
        name: 'Búsqueda de Brandeos',
        fn: () => fetchBrandeos({ page: 1, limit: testPageSize, busqueda: 'test' })
      },
      {
        name: 'Filtro por Periodo',
        fn: () => fetchBrandeos({ page: 1, limit: testPageSize, periodoId: 1 })
      }
    ];

    const newResults: TestResult[] = [];

    for (let i = 0; i < testIterations; i++) {
      console.log(`🔄 Ejecutando iteración ${i + 1}/${testIterations}`);
      
      for (const test of tests) {
        const result = await runSingleTest(`${test.name} (Iteración ${i + 1})`, test.fn);
        newResults.push(result);
        setResults([...newResults]);
        
        // Pequeña pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsRunning(false);
  };

  const runStressTest = async () => {
    setIsRunning(true);
    setResults([]);
    performanceMonitor.clearMetrics();

    const stressTests = [
      { name: 'Carga masiva de Brandeos (100 items)', fn: () => fetchBrandeos({ page: 1, limit: 100 }) },
      { name: 'Carga masiva de Brandeos (500 items)', fn: () => fetchBrandeos({ page: 1, limit: 500 }) },
      { name: 'Búsqueda compleja', fn: () => fetchBrandeos({ page: 1, limit: 50, busqueda: 'instructor' }) },
    ];

    const newResults: TestResult[] = [];

    for (const test of stressTests) {
      const result = await runSingleTest(test.name, test.fn);
      newResults.push(result);
      setResults([...newResults]);
    }

    setIsRunning(false);
  };

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      testConfig: {
        pageSize: testPageSize,
        iterations: testIterations
      },
      results,
      summary: {
        totalTests: results.length,
        successfulTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length,
        averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        slowestTest: results.reduce((max, r) => r.duration > max.duration ? r : max, results[0] || { duration: 0 }),
        fastestTest: results.reduce((min, r) => r.duration < min.duration ? r : min, results[0] || { duration: 0 })
      },
      performanceMetrics: performanceMonitor.getMetrics()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearResults = () => {
    setResults([]);
    performanceMonitor.clearMetrics();
  };

  const getAverageDuration = (testName: string) => {
    const testResults = results.filter(r => r.testName.includes(testName));
    if (testResults.length === 0) return 0;
    return testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;
  };

  const getSuccessRate = (testName: string) => {
    const testResults = results.filter(r => r.testName.includes(testName));
    if (testResults.length === 0) return 0;
    const successful = testResults.filter(r => r.success).length;
    return (successful / testResults.length) * 100;
  };

  const uniqueTestNames = [...new Set(results.map(r => r.testName.split(' (Iteración')[0]))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Test Suite</CardTitle>
          <CardDescription>
            Herramientas para probar el rendimiento de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pageSize">Tamaño de página para tests</Label>
              <Input
                id="pageSize"
                type="number"
                value={testPageSize}
                onChange={(e) => setTestPageSize(parseInt(e.target.value) || 10)}
                min="1"
                max="1000"
              />
            </div>
            <div>
              <Label htmlFor="iterations">Número de iteraciones</Label>
              <Input
                id="iterations"
                type="number"
                value={testIterations}
                onChange={(e) => setTestIterations(parseInt(e.target.value) || 5)}
                min="1"
                max="20"
              />
            </div>
          </div>

          {/* Botones de control */}
          <div className="flex space-x-2">
            <Button
              onClick={runPerformanceTests}
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Square className="mr-2 h-4 w-4 animate-pulse" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Ejecutar Tests
                </>
              )}
            </Button>
            <Button
              onClick={runStressTest}
              disabled={isRunning}
              variant="outline"
            >
              Stress Test
            </Button>
            <Button
              onClick={exportResults}
              disabled={results.length === 0}
              variant="outline"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={clearResults}
              disabled={results.length === 0}
              variant="outline"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Tests</CardTitle>
            <CardDescription>
              {results.length} tests ejecutados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Resumen por tipo de test */}
              {uniqueTestNames.map(testName => (
                <div key={testName} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{testName}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Promedio:</span>
                      <span className="ml-2 font-mono">
                        {getAverageDuration(testName).toFixed(0)}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Éxito:</span>
                      <span className="ml-2 font-mono">
                        {getSuccessRate(testName).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ejecuciones:</span>
                      <span className="ml-2 font-mono">
                        {results.filter(r => r.testName.includes(testName)).length}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Lista detallada */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="font-semibold">Detalles de Ejecución</h4>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded text-sm ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <span className="flex-1">{result.testName}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{result.duration}ms</span>
                      {result.success ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600" title={result.error}>✗</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
