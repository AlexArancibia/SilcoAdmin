# Ejemplos del Formato Peruano de Hora

## Descripción del Formato

El formato peruano de hora es común en archivos Excel exportados desde sistemas peruanos y tiene la siguiente estructura:

```
HH:MM:SS a. m. (hora peruana)
HH:MM:SS p. m. (hora peruana)
```

## Ejemplos de Entrada

### Formato Completo (con segundos)
- `7:00:00 a. m. (hora peruana)` → Se convierte a `07:00`
- `2:30:45 p. m. (hora peruana)` → Se convierte a `14:30`
- `12:00:00 a. m. (hora peruana)` → Se convierte a `00:00`
- `12:00:00 p. m. (hora peruana)` → Se convierte a `12:00`

### Formato Reducido (sin segundos)
- `7:00 a. m. (hora peruana)` → Se convierte a `07:00`
- `2:30 p. m. (hora peruana)` → Se convierte a `14:30`

## Proceso de Conversión

### 1. Limpieza del Texto
```javascript
// Entrada original
"7:00:00 a. m. (hora peruana)"

// Paso 1: Remover "(hora peruana)"
"7:00:00 a. m."

// Paso 2: Normalizar "a. m." a "AM"
"7:00:00 AM"

// Paso 3: Normalizar espacios
"7:00:00 AM"
```

### 2. Extracción de Componentes
```javascript
// Regex para extraer horas, minutos, segundos y periodo
const match = "7:00:00 AM".match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)

// Resultado:
// match[1] = "7" (horas)
// match[2] = "00" (minutos)
// match[3] = "00" (segundos)
// match[4] = "AM" (periodo)
```

### 3. Conversión a Formato 24 Horas
```javascript
let horas = 7
let minutos = 0

if (periodo === 'PM' && horas !== 12) {
  horas += 12
} else if (periodo === 'AM' && horas === 12) {
  horas = 0
}

// Resultado: horas = 7, minutos = 0
// Formato final: "07:00"
```

## Casos Especiales

### Medianoche (12:00 AM)
- Entrada: `12:00:00 a. m. (hora peruana)`
- Conversión: `12:00 AM` → `00:00`
- Resultado: `00:00`

### Mediodía (12:00 PM)
- Entrada: `12:00:00 p. m. (hora peruana)`
- Conversión: `12:00 PM` → `12:00`
- Resultado: `12:00`

### Horas PM (1:00 PM - 11:59 PM)
- Entrada: `1:00:00 p. m. (hora peruana)`
- Conversión: `1:00 PM` → `13:00`
- Resultado: `13:00`

## Implementación en el Código

### API de Generación de Tabla
```typescript
// En app/api/importar/generar-tabla/route.ts
if (horaStr.includes("a. m.") || horaStr.includes("p. m.") || horaStr.includes("(hora peruana)")) {
  // Limpiar texto adicional y convertir a formato estándar
  let horaLimpia = horaStr
    .replace(/\s*\(hora peruana\)/g, "")
    .replace(/\s*a\.\s*m\./g, " AM")
    .replace(/\s*p\.\s*m\./g, " PM")
    .replace(/\s+/g, " ")
    .trim()
  
  // Extraer y convertir componentes
  // ... lógica de conversión
}
```

### API de Procesamiento
```typescript
// En app/api/importar/procesar/route.ts
// Misma lógica de limpieza y conversión
// Se aplica la hora a la fecha antes de guardar en la base de datos
```

### Componente de Validación
```typescript
// En components/import/date-time-validator.tsx
// Validación en tiempo real del formato peruano
// Vista previa de la conversión
```

## Ventajas del Formato Peruano

### 1. Claridad
- Indica explícitamente que es hora peruana
- Evita confusiones de zona horaria
- Formato estándar en sistemas peruanos

### 2. Precisión
- Incluye segundos para mayor exactitud
- Formato AM/PM claro y legible
- Consistente en todo el archivo

### 3. Compatibilidad
- Se convierte automáticamente a formato 24h
- Compatible con sistemas internacionales
- Mantiene la precisión original

## Consideraciones de Implementación

### 1. Robustez
- Múltiples fallbacks para diferentes formatos
- Validación de rangos de horas y minutos
- Manejo de errores con logging detallado

### 2. Rendimiento
- Procesamiento eficiente con regex optimizados
- Conversión en tiempo real durante la edición
- Cache de conversiones para archivos grandes

### 3. Mantenibilidad
- Código centralizado y reutilizable
- Logging detallado para debugging
- Documentación clara de la lógica

## Pruebas Recomendadas

### Casos de Prueba Básicos
1. `7:00:00 a. m. (hora peruana)` → `07:00`
2. `2:30:45 p. m. (hora peruana)` → `14:30`
3. `12:00:00 a. m. (hora peruana)` → `00:00`
4. `12:00:00 p. m. (hora peruana)` → `12:00`

### Casos de Prueba Avanzados
1. `1:15:30 a. m. (hora peruana)` → `01:15`
2. `11:45:00 p. m. (hora peruana)` → `23:45`
3. `6:00:00 a. m. (hora peruana)` → `06:00`
4. `8:30:15 p. m. (hora peruana)` → `20:30`

### Casos de Error
1. `25:00:00 a. m. (hora peruana)` → Error (hora inválida)
2. `7:60:00 a. m. (hora peruana)` → Error (minutos inválidos)
3. `7:00:60 a. m. (hora peruana)` → Error (segundos inválidos)

## Conclusión

El soporte para el formato peruano de hora mejora significativamente la experiencia de importación para usuarios peruanos, manteniendo la compatibilidad con formatos internacionales estándar. La implementación es robusta, eficiente y fácil de mantener.
