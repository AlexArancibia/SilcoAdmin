# 🧮 Guía Completa del Proceso de Cálculo de Pagos

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Flujo del Proceso](#flujo-del-proceso)
3. [Cálculo de Categorías](#cálculo-de-categorías)
4. [Cálculo de Pagos por Clase](#cálculo-de-pagos-por-clase)
5. [Bonos y Penalizaciones](#bonos-y-penalizaciones)
6. [Cálculo Final](#cálculo-final)
7. [Logs y Debugging](#logs-y-debugging)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Descripción General

El sistema de cálculo de pagos es un proceso automatizado que:
- Calcula el pago base por cada clase según la categoría del instructor
- Determina automáticamente la categoría del instructor basándose en métricas reales
- Aplica bonos por actividades adicionales (covers, brandeos, theme rides, workshops)
- Calcula penalizaciones por incumplimientos
- Genera el pago final con retenciones y reajustes

---

## 🔄 Flujo del Proceso

### 1. Inicialización
```
🚀 Iniciando proceso de cálculo de pagos
📋 Body recibido: { periodoId: X, manualCategorias: [...] }
🎯 Procesando periodo ID: X
```

### 2. Limpieza de Datos
```
🗑️ Eliminando pagos con monto 0...
✅ Eliminados X pagos con monto 0
```

### 3. Carga de Catálogos
```
📚 Cargando catálogos de disciplinas...
✅ Cargadas X disciplinas: ID1:Nombre1, ID2:Nombre2, ...
📐 Cargando fórmulas...
✅ Cargadas X fórmulas para el periodo X
```

### 4. Carga de Instructores
```
👥 Cargando instructores activos con clases...
👤 Instructor X - Nombre: X clases, X penalizaciones, X categorías, X covers
```

---

## 🏆 Cálculo de Categorías

### Proceso Automático
**IMPORTANTE**: Las categorías se recalculan **SIEMPRE** en cada proceso de pago, sin importar si ya existen.

#### 1. Cálculo de Métricas por Disciplina
```typescript
const metricasDisciplina = calcularMetricasDisciplina(clasesDisciplina, disciplinaId, sicloId);
```

**Métricas calculadas:**
- **Ocupación promedio**: `(totalReservas / totalLugares) * 100`
- **Total clases**: Número de clases en la disciplina
- **Locales únicos**: Conteo de estudios únicos donde dictó clases
- **Dobleteos**: Clases consecutivas en el mismo día (solo Síclo)
- **Horarios no prime**: Clases en horarios no estelares

#### 2. Logs de Métricas
```
🔍 DEBUG: Datos de clases para Síclo:
   - Total clases: 28
   - Muestra de estudios: Reducto, San Isidro, Primavera, Estancia
   - Muestra de ciudades: Lima, Lima, Lima, Lima

🔍 DEBUG: calcularMetricasDisciplina para disciplina 1:
   - Total clases: 28
   - Estudios encontrados: Reducto, San Isidro, Primavera, Estancia, ...
   - Estudios únicos: 4
   - Ocupación: 53.69%
```

#### 3. Determinación de Categoría
```typescript
categoriaInstructor = determinarCategoria(formula, metricasCompletas);
```

**Orden de evaluación:**
1. **EMBAJADOR_SENIOR** (categoría más alta)
2. **EMBAJADOR** (categoría intermedia)
3. **EMBAJADOR_JUNIOR** (categoría baja)
4. **INSTRUCTOR** (categoría por defecto)

#### 4. Logs de Categoría
```
🔍 Evaluando EMBAJADOR...
🔍 Requisitos EMBAJADOR: {...}
🔍 Métricas vs Requisitos:
   - Ocupación: 53.69% >= 60% = false
   - Clases por semana: 7 >= 6 = true
   - Locales en Lima: 4 >= 3 = true
   - Dobleteos: 3 >= 0 = true
   - Horarios no prime: 3 >= 0 = true
   - Participación eventos: true || !true = true
   - Cumple lineamientos: true || !true = true
🎭 Categoría recalculada: EMBAJADOR
```

#### 5. Guardado/Actualización de Categoría
```
✅ Categoría actualizada en BD: ID X
// o
✅ Nueva categoría creada en BD: ID X
```

---

## 💰 Cálculo de Pagos por Clase

### 1. Procesamiento de Cada Clase
```
📅 CLASE ID: 950587 - Fecha: 7/13/2025 07:00
📊 Reservas: 24/54 (44%)
🏠 Full House por cover: NO
⚖️ Versus: NO
```

### 2. Verificaciones Especiales

#### Full House por Covers
```
🏠 Aplicando FULL HOUSE por cover: Reservas 24 -> 54 (100% ocupación)
```

#### Clases Versus
```
⚖️ Clase VERSUS detectada (3 instructores)
   Reservas originales: 24
   Lugares originales: 54
   Nota: El cálculo se hará con las reservas originales y luego se dividirá entre 3 instructores
```

### 3. Cálculo del Pago
```
🧮 Ejecutando cálculo de pago...
📊 Datos finales para cálculo:
   - Reservas: 24
   - Lugares: 54
   - Categoría: EMBAJADOR
   - Fórmula ID: 28

✅ Resultado del cálculo: 45.50
📝 Detalle: Base 40.00 + Bono ocupación 5.50
```

### 4. Aplicación de Versus
```
⚖️ Dividiendo por VERSUS: 45.50 / 3 = 15.17
```

---

## 🎁 Bonos y Penalizaciones

### 1. Covers como Reemplazo
```
💰 Covers con bono: 2 x S/.80 = S/.160
🏠 Covers con full house: 1 (clases IDs: 950587)
```

### 2. Brandeos
```
🏆 Brandeos: 3 x S/.5 = S/.15
```

### 3. Theme Rides
```
⚡ Theme Rides: 2 x S/.30 = S/.60
```

### 4. Workshops
```
🎓 Workshops: 1 workshop = S/.50.00
```

### 5. Clases Versus
```
⚖️ Clases versus: 5 x S/.30 = S/.150
```

### 6. Penalizaciones
```
⚠️ Calculando penalizaciones...
📊 Penalizaciones calculadas:
   - Descuento: 5%
   - Detalle: {...}
```

---

## 🧮 Cálculo Final

### 1. Montos Base
```
💰 Monto base (clases): 1,250.00
💰 Reajuste: 0.00
💰 Total bonos: 435.00 (Bono: 0.00, Cover: 160.00, Brandeo: 15.00, Theme Ride: 60.00, Workshop: 50.00, Versus: 150.00)
```

### 2. Penalizaciones
```
💰 Base para penalización (monto base + reajuste + bonos): 1,715.00
💰 Descuento penalización: 5% = 85.75
```

### 3. Cálculo Final
```
💰 Monto final: 1,629.25
💰 Retención (8%): 130.34
💰 Pago final: 1,498.91
```

---

## 📝 Logs y Debugging

### 1. Logs de Categoría
Los logs muestran el proceso completo de cálculo de categorías:
```
🔍 DEBUG: determinarCategoria llamada con: {formulaId: X, metricas: {...}, requisitos: {...}}
🔍 Evaluando EMBAJADOR...
🔍 Requisitos EMBAJADOR: {...}
🔍 Métricas vs Requisitos: {...}
✅ Cumple requisitos para EMBAJADOR
```

### 2. Logs de Métricas
```
🔍 DEBUG: calcularMetricasDisciplina para disciplina X:
   - Total clases: X
   - Estudios encontrados: Estudio1, Estudio2, ...
   - Estudios únicos: X
   - Ocupación: XX.XX%
```

### 3. Logs de Pago
```
💰 PAGO POR CLASE [ID]: Disciplina - Fecha Hora
   Monto: XX.XX | Categoría: EMBAJADOR
   Reservas: X/Y (XX% ocupación)
   Versus: Sí (X instructores)
   FULL HOUSE por cover: Sí
   Detalle: Base XX.XX + Bono ocupación XX.XX
```

---

## 🔧 Troubleshooting

### Problema: Categoría no se recalcula
**Síntoma**: Los logs muestran "Categoría existente en BD: INSTRUCTOR"
**Solución**: Verificar que el código esté usando la versión actualizada que siempre recalcula

### Problema: Locales en Lima = 0
**Síntoma**: `📊 Métricas calculadas: ... locales 0, ...`
**Causa**: Campo `estudio` vacío o nulo en las clases
**Solución**: Verificar datos de las clases en la BD

### Problema: Categoría incorrecta asignada
**Síntoma**: Instructor cumple requisitos pero se asigna categoría menor
**Solución**: Revisar logs de `determinarCategoria` para ver qué requisito no se cumple

### Problema: Pagos no reflejan nueva categoría
**Síntoma**: Categoría se actualiza pero pagos siguen siendo los mismos
**Causa**: Variable `categoriaInstructor` no se está usando en el cálculo
**Solución**: Verificar que se use `categoriaInstructor` en `calcularPago()`

---

## 📊 Ejemplo Completo de Logs

```
🚀 Iniciando proceso de cálculo de pagos
📋 Body recibido: {"periodoId":123,"manualCategorias":[]}
🎯 Procesando periodo ID: 123

📚 Cargando catálogos de disciplinas...
✅ Cargadas 5 disciplinas: 1:Síclo, 2:Barre, 3:Yoga, 4:Ejercito, 5:Spinning

📐 Cargando fórmulas...
✅ Cargadas 3 fórmulas para el periodo 123

👥 Cargando instructores activos con clases...
👤 Instructor 12 - Daniel R: 38 clases, 0 penalizaciones, 2 categorías, 0 covers

🔄 PROCESANDO INSTRUCTOR: 12 - Daniel R
📊 RESUMEN INICIAL DEL INSTRUCTOR:
📝 Total de clases: 38
⚠️ Penalizaciones: 0
🔄 Covers como reemplazo: 0
🏆 Brandeos: 0
⚡ Theme Rides: 0
🎓 Workshops: 0

📊 Clases agrupadas por disciplina:
- Síclo (ID: 1): 28 clases
- Ejercito (ID: 4): 10 clases

📚 PROCESANDO DISCIPLINA ID: 1
📋 Clases en esta disciplina: 28
✅ Disciplina encontrada: Síclo
📐 Fórmula encontrada para Síclo: ID 28

🔄 Recalculando categoría automáticamente para Síclo...
🔍 DEBUG: Datos de clases para Síclo:
   - Total clases: 28
   - Muestra de estudios: Reducto, San Isidro, Primavera, Estancia
   - Muestra de ciudades: Lima, Lima, Lima, Lima

🔍 DEBUG: calcularMetricasDisciplina para disciplina 1:
   - Total clases: 28
   - Estudios encontrados: Reducto, San Isidro, Primavera, Estancia, ...
   - Estudios únicos: 4
   - Ocupación: 53.69%

📊 Métricas calculadas para Síclo: ocupación 53.69%, clases 28, locales 4, dobleteos 3, horarios no prime 3, participación eventos: true, cumple lineamientos: true

🔍 DEBUG: determinarCategoria llamada con: {formulaId: 28, metricas: {...}, requisitos: {...}}
🔍 Evaluando EMBAJADOR...
🔍 Requisitos EMBAJADOR: {...}
🔍 Métricas vs Requisitos:
   - Ocupación: 53.69% >= 60% = false
   - Clases por semana: 7 >= 6 = true
   - Locales en Lima: 4 >= 3 = true
   - Dobleteos: 3 >= 0 = true
   - Horarios no prime: 3 >= 0 = true
   - Participación eventos: true || !true = true
   - Cumple lineamientos: true || !true = true

🎭 Categoría recalculada: EMBAJADOR
✅ Categoría actualizada en BD: ID 456

🔄 Procesando 28 clases de Síclo...

📅 CLASE ID: 950587 - Fecha: 7/13/2025 07:00
📊 Reservas: 24/54 (44%)
🏠 Full House por cover: NO
⚖️ Versus: NO
🧮 Ejecutando cálculo de pago...
📊 Datos finales para cálculo:
   - Reservas: 24
   - Lugares: 54
   - Categoría: EMBAJADOR
   - Fórmula ID: 28

✅ Resultado del cálculo: 45.50
📝 Detalle: Base 40.00 + Bono ocupación 5.50

💰 PAGO POR CLASE [950587]: Síclo - 7/13/2025 07:00
   Monto: 45.50 | Categoría: EMBAJADOR
   Reservas: 24/54 (44% ocupación)
   Detalle: Base 40.00 + Bono ocupación 5.50

📈 Monto acumulado: 45.50

[... continúa para todas las clases ...]

💰 Monto total por clases: 1,250.00

🧮 CALCULANDO MÉTRICAS GENERALES para instructor 12...
📊 Métricas generales calculadas:
   - Total clases: 38
   - Total reservas: 1,200
   - Total lugares: 2,000
   - Ocupación promedio: 60.00%
   - Dobleteos: 3
   - Horarios no prime: 3
   - Clases por semana: 9.50

⚠️ Calculando penalizaciones...
📊 Penalizaciones calculadas:
   - Descuento: 0%
   - Detalle: {...}

💰 Cálculos finales:
   - Monto base (clases): 1,250.00
   - Reajuste: 0.00
   - Total bonos: 0.00
   - Base para penalización: 1,250.00
   - Descuento penalización: 0% = 0.00
   - Monto final: 1,250.00
   - Retención (8%): 100.00
   - Pago final: 1,150.00

💾 Preparando datos para guardar...
📋 Detalles del instructor preparados: 38 clases procesadas

🔄 Actualizando pago existente ID: 462...
✅ Pago actualizado para Daniel R (ID: 12)

🔄 RECALCULANDO TODAS LAS CATEGORÍAS PARA CONSISTENCIA...
👤 Recalculando categorías para instructor 12 - Daniel R
📊 Disciplinas únicas del instructor: 2 (IDs: 1, 4)
📚 Procesando disciplina: Síclo
📊 Métricas para Síclo: ocupación 53.69%, clases 28, locales 4, dobleteos 3, horarios no prime 3
🎭 Categoría calculada: EMBAJADOR
✅ Categoría de Síclo ya está actualizada: EMBAJADOR

📚 Procesando disciplina: Ejercito
⏭️ Saltando disciplina Ejercito (sin categorización visual)

🎉 PROCESO COMPLETADO EXITOSAMENTE
📊 RESUMEN GENERAL DEL PROCESO:
👥 Total instructores procesados: 1
📅 Periodo procesado: 123
⏰ Fecha y hora: 1/8/2025, 10:30:00 AM
🎯 Estado: Completado exitosamente
📈 Total de pagos procesados: 1
💰 Periodo de cálculo: 123
📅 Fecha de ejecución: 1/8/2025
⏰ Hora de ejecución: 10:30:00 AM
```

---

## 🎯 Resumen del Proceso

1. **Inicialización**: Carga de catálogos y instructores
2. **Cálculo de Categorías**: Recalcula automáticamente todas las categorías
3. **Procesamiento de Clases**: Calcula pago por cada clase usando la nueva categoría
4. **Aplicación de Bonos**: Suma bonos por actividades adicionales
5. **Cálculo de Penalizaciones**: Aplica descuentos por incumplimientos
6. **Cálculo Final**: Genera el pago final con retenciones
7. **Recálculo de Consistencia**: Asegura que todas las categorías estén actualizadas
8. **Guardado**: Actualiza pagos e instructores en la BD

**Resultado**: Sistema completamente automatizado que recalcula categorías y pagos en cada ejecución, garantizando consistencia y precisión.

