#!/usr/bin/env node

/**
 * Script de testing de rendimiento para la aplicación SilcoAdmin
 * 
 * Uso:
 * node scripts/performance-test.js
 * node scripts/performance-test.js --url http://localhost:3000
 * node scripts/performance-test.js --iterations 10
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuración por defecto
const DEFAULT_CONFIG = {
  url: 'http://localhost:3000',
  iterations: 5,
  timeout: 30000,
  viewport: { width: 1920, height: 1080 },
  outputDir: './performance-reports'
};

// Parsear argumentos de línea de comandos
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'iterations') {
      config[key] = parseInt(value);
    } else if (key === 'timeout') {
      config[key] = parseInt(value);
    } else if (key === 'viewport') {
      const [width, height] = value.split('x').map(Number);
      config[key] = { width, height };
    } else {
      config[key] = value;
    }
  }
  
  return config;
}

// Crear directorio de reportes si no existe
function ensureOutputDir(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

// Ejecutar test de rendimiento en una página
async function testPagePerformance(browser, config, pageName, url) {
  console.log(`\n🔍 Testing: ${pageName}`);
  console.log(`📍 URL: ${url}`);
  
  const page = await browser.newPage();
  
  try {
    // Configurar viewport
    await page.setViewport(config.viewport);
    
    // Habilitar métricas de rendimiento
    await page.evaluateOnNewDocument(() => {
      // Limpiar métricas existentes
      if (window.performance && window.performance.clearMarks) {
        window.performance.clearMarks();
        window.performance.clearMeasures();
      }
    });
    
    // Navegar a la página y medir tiempo de carga
    const startTime = Date.now();
    const response = await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: config.timeout 
    });
    const loadTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Esperar a que la página esté completamente cargada
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Obtener métricas de rendimiento del navegador
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        // Métricas de navegación
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
        
        // Métricas de pintura
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        
        // Métricas de memoria (si están disponibles)
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        
        // Recursos cargados
        resources: performance.getEntriesByType('resource').map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize || 0
        }))
      };
    });
    
    // Obtener métricas de la consola (si hay un panel de debug)
    const consoleMetrics = await page.evaluate(() => {
      // Buscar el panel de debug de rendimiento
      const debugPanel = document.querySelector('[data-testid="performance-debug-panel"]');
      if (debugPanel) {
        // Intentar extraer métricas del panel
        const metricsText = debugPanel.textContent;
        // Aquí podrías parsear las métricas específicas de tu panel
        return { debugPanelFound: true, content: metricsText };
      }
      return { debugPanelFound: false };
    });
    
    const result = {
      pageName,
      url,
      loadTime,
      performanceMetrics,
      consoleMetrics,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log(`✅ ${pageName}: ${loadTime}ms`);
    console.log(`   - DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   - Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`   - First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
    console.log(`   - First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ ${pageName}: ${error.message}`);
    return {
      pageName,
      url,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    };
  } finally {
    await page.close();
  }
}

// Ejecutar suite completa de tests
async function runPerformanceTests(config) {
  console.log('🚀 Iniciando tests de rendimiento...');
  console.log(`📊 Configuración:`, config);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  const pages = [
    { name: 'Dashboard', url: `${config.url}/` },
    { name: 'Brandeos', url: `${config.url}/brandeos` },
    { name: 'Instructores', url: `${config.url}/instructores` },
    { name: 'Pagos', url: `${config.url}/pagos` },
    { name: 'Configuración', url: `${config.url}/configuracion` }
  ];
  
  try {
    for (let i = 0; i < config.iterations; i++) {
      console.log(`\n🔄 Iteración ${i + 1}/${config.iterations}`);
      
      for (const page of pages) {
        const result = await testPagePerformance(browser, config, page.name, page.url);
        results.push(result);
        
        // Pequeña pausa entre páginas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Generar reporte
    const report = generateReport(results, config);
    await saveReport(report, config.outputDir);
    
    console.log('\n📊 Resumen de resultados:');
    console.log(`   - Total de tests: ${results.length}`);
    console.log(`   - Tests exitosos: ${results.filter(r => r.success).length}`);
    console.log(`   - Tests fallidos: ${results.filter(r => !r.success).length}`);
    console.log(`   - Tiempo promedio: ${report.summary.averageLoadTime.toFixed(2)}ms`);
    console.log(`   - Página más lenta: ${report.summary.slowestPage} (${report.summary.slowestTime}ms)`);
    console.log(`   - Página más rápida: ${report.summary.fastestPage} (${report.summary.fastestTime}ms)`);
    
  } finally {
    await browser.close();
  }
}

// Generar reporte de resultados
function generateReport(results, config) {
  const successfulResults = results.filter(r => r.success);
  
  // Calcular estadísticas por página
  const pageStats = {};
  successfulResults.forEach(result => {
    if (!pageStats[result.pageName]) {
      pageStats[result.pageName] = [];
    }
    pageStats[result.pageName].push(result.loadTime);
  });
  
  // Calcular promedios
  const pageAverages = {};
  Object.entries(pageStats).forEach(([pageName, times]) => {
    pageAverages[pageName] = times.reduce((sum, time) => sum + time, 0) / times.length;
  });
  
  // Encontrar página más lenta y más rápida
  const sortedPages = Object.entries(pageAverages).sort((a, b) => b[1] - a[1]);
  const slowestPage = sortedPages[0];
  const fastestPage = sortedPages[sortedPages.length - 1];
  
  return {
    config,
    summary: {
      totalTests: results.length,
      successfulTests: successfulResults.length,
      failedTests: results.filter(r => !r.success).length,
      averageLoadTime: successfulResults.reduce((sum, r) => sum + r.loadTime, 0) / successfulResults.length,
      slowestPage: slowestPage ? slowestPage[0] : 'N/A',
      slowestTime: slowestPage ? slowestPage[1] : 0,
      fastestPage: fastestPage ? fastestPage[0] : 'N/A',
      fastestTime: fastestPage ? fastestPage[1] : 0
    },
    pageAverages,
    results,
    timestamp: new Date().toISOString()
  };
}

// Guardar reporte en archivo
async function saveReport(report, outputDir) {
  ensureOutputDir(outputDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-report-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);
  
  await fs.promises.writeFile(filepath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Reporte guardado en: ${filepath}`);
}

// Función principal
async function main() {
  try {
    const config = parseArgs();
    await runPerformanceTests(config);
    console.log('\n🎉 Tests de rendimiento completados exitosamente!');
  } catch (error) {
    console.error('\n💥 Error durante la ejecución de tests:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { runPerformanceTests, testPagePerformance };
