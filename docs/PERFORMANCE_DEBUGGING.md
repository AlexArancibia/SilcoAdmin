# Guía de Debugging de Rendimiento

Esta guía te ayudará a diagnosticar y solucionar problemas de rendimiento en la aplicación SilcoAdmin.

## 🚀 Herramientas Disponibles

### 1. Panel de Debug en Tiempo Real

El panel de debug aparece automáticamente en la esquina inferior derecha de cada página. Incluye:

- **Métricas en tiempo real**: Tiempo de carga de operaciones
- **Resumen de rendimiento**: Operaciones más lentas y rápidas
- **Información del sistema**: Memoria utilizada, URL actual
- **Exportación de datos**: Descargar métricas en formato JSON

### 2. Página de Testing de Rendimiento

Navega a `/debug/performance` para acceder a la suite completa de testing:

- **Tests automatizados**: Ejecutar baterías de pruebas de rendimiento
- **Stress testing**: Probar la aplicación bajo carga
- **Configuración personalizable**: Ajustar parámetros de testing
- **Reportes detallados**: Exportar resultados para análisis

### 3. Script de Testing Automatizado

Ejecuta tests de rendimiento desde la línea de comandos:

```bash
# Test básico
npm run test:performance

# Test para CI/CD
npm run test:performance:ci

# Test personalizado
node scripts/performance-test.js --url http://localhost:3000 --iterations 10
```

## 🔍 Cómo Diagnosticar Problemas

### Paso 1: Identificar la Página Lenta

1. Abre la página que está tardando
2. Observa el panel de debug en la esquina inferior derecha
3. Revisa las métricas de tiempo de carga
4. Identifica qué operación está tomando más tiempo

### Paso 2: Analizar las Métricas

**Métricas importantes a revisar:**

- **load-brandeos**: Tiempo de carga de la lista de brandeos
- **load-instructores**: Tiempo de carga de instructores
- **load-periodos**: Tiempo de carga de períodos
- **search-brandeos**: Tiempo de búsqueda

**Tiempos de referencia:**
- ✅ **< 500ms**: Excelente
- ⚠️ **500ms - 1000ms**: Aceptable
- ❌ **> 1000ms**: Necesita optimización

### Paso 3: Ejecutar Tests de Rendimiento

1. Ve a `/debug/performance`
2. Configura los parámetros de testing:
   - **Tamaño de página**: Número de elementos a cargar
   - **Iteraciones**: Número de veces a ejecutar cada test
3. Ejecuta los tests
4. Revisa los resultados y estadísticas

### Paso 4: Analizar Reportes

Los reportes incluyen:

- **Tiempo promedio** por operación
- **Tasa de éxito** de cada test
- **Página más lenta** vs **más rápida**
- **Métricas detalladas** de cada ejecución

## 🛠️ Soluciones Comunes

### Problema: Carga lenta de datos

**Síntomas:**
- Tiempo de carga > 1000ms
- Spinner de carga visible por mucho tiempo

**Soluciones:**
1. **Verificar caché**: Los datos se cachean automáticamente por 5 minutos
2. **Optimizar consultas**: Revisar las consultas de base de datos
3. **Implementar paginación**: Cargar menos datos por página
4. **Usar loading states**: Mejorar la experiencia de usuario

### Problema: Múltiples llamadas API

**Síntomas:**
- Múltiples requests simultáneos en Network tab
- Tiempo total de carga alto

**Soluciones:**
1. **Cargar datos en paralelo**: Usar `Promise.all()`
2. **Implementar caché**: Evitar llamadas duplicadas
3. **Lazy loading**: Cargar datos solo cuando se necesiten

### Problema: Re-renders innecesarios

**Síntomas:**
- Componentes se re-renderizan frecuentemente
- Performance degradada en la UI

**Soluciones:**
1. **Usar useCallback**: Para funciones que se pasan como props
2. **Usar useMemo**: Para cálculos costosos
3. **Optimizar dependencias**: En useEffect y otros hooks

## 📊 Interpretando las Métricas

### Métricas del Navegador

- **DOM Content Loaded**: Tiempo hasta que el DOM está listo
- **Load Complete**: Tiempo hasta que todos los recursos están cargados
- **First Paint**: Tiempo hasta el primer pixel pintado
- **First Contentful Paint**: Tiempo hasta que se muestra contenido

### Métricas de la Aplicación

- **load-brandeos**: Carga de la lista principal
- **load-instructores**: Carga de datos de instructores
- **load-periodos**: Carga de períodos
- **search-brandeos**: Operaciones de búsqueda

### Métricas de Memoria

- **usedJSHeapSize**: Memoria JavaScript utilizada
- **totalJSHeapSize**: Memoria JavaScript total asignada
- **jsHeapSizeLimit**: Límite de memoria JavaScript

## 🚨 Alertas de Rendimiento

El sistema automáticamente detecta:

- **Operaciones > 2000ms**: Marcadas como críticas
- **Operaciones > 1000ms**: Marcadas como lentas
- **Errores de carga**: Fallos en las operaciones
- **Uso excesivo de memoria**: > 100MB

## 📈 Mejores Prácticas

### Para Desarrolladores

1. **Monitorear continuamente**: Usar el panel de debug durante desarrollo
2. **Testear regularmente**: Ejecutar tests de rendimiento antes de deploy
3. **Optimizar gradualmente**: Mejorar una métrica a la vez
4. **Documentar cambios**: Registrar optimizaciones realizadas

### Para Testing

1. **Tests en diferentes dispositivos**: Móvil, tablet, desktop
2. **Tests con diferentes datos**: Pocos vs muchos registros
3. **Tests de red lenta**: Simular conexiones lentas
4. **Tests de carga**: Múltiples usuarios simultáneos

## 🔧 Configuración Avanzada

### Personalizar Caché

```typescript
// En useOptimizedDataLoading
const { loadData } = useOptimizedDataLoading(
  fetchFunction,
  dependencies,
  {
    cacheKey: 'brandeos-data',
    staleTime: 10 * 60 * 1000, // 10 minutos
    retryCount: 3,
    retryDelay: 1000
  }
);
```

### Personalizar Métricas

```typescript
// Medir operación personalizada
performanceMonitor.measureAsync('mi-operacion', async () => {
  // Tu código aquí
});
```

### Configurar Tests

```bash
# Test con configuración personalizada
node scripts/performance-test.js \
  --url http://localhost:3000 \
  --iterations 10 \
  --timeout 30000 \
  --viewport 1920x1080
```

## 📞 Soporte

Si encuentras problemas o necesitas ayuda:

1. **Revisa los logs**: En la consola del navegador
2. **Exporta métricas**: Usa el botón de descarga en el panel de debug
3. **Ejecuta tests**: Usa la página de testing de rendimiento
4. **Documenta el problema**: Incluye métricas y pasos para reproducir

---

**Nota**: Estas herramientas están diseñadas para ayudarte a identificar y solucionar problemas de rendimiento. Úsalas regularmente para mantener una aplicación rápida y eficiente.
