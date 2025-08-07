# Sistema de Importación de Excel con APIs del Backend

## Descripción

Este nuevo sistema de importación de Excel utiliza APIs del backend para procesar archivos de manera más eficiente y escalable. El proceso se divide en dos pasos principales:

1. **Análisis del archivo**: Se analiza el contenido del Excel y se devuelve información sobre instructores, disciplinas y semanas encontradas.
2. **Procesamiento de la importación**: Se crean las clases, instructores y configuraciones basándose en las configuraciones del usuario.

## Características Principales

### ✅ Nuevas Funcionalidades

- **Campo Semana**: Permite mapear semanas del Excel a semanas del periodo
- **Soporte para hasta 4 instructores en VS**: Maneja clases con múltiples instructores
- **Proceso en 2 pasos**: Análisis primero, luego creación
- **APIs del backend**: Procesamiento más eficiente y escalable
- **Tipos actualizados**: Usa los tipos más recientes del sistema

### 📊 Columnas Aceptadas

#### Columnas Obligatorias
- `Instructor` - Nombre del instructor
- `Disciplina` - Nombre de la disciplina/clase  
- `Día` - Fecha de la clase

#### Columnas Opcionales
- `ID_clase` - Identificador único de la clase
- `Hora` - Hora de la clase (formato: HH:MM)
- `Estudio` - Nombre del estudio
- `Salon` - Nombre del salón
- `País` - País (por defecto: "México")
- `Ciudad` - Ciudad (por defecto: "Ciudad de México")
- `Semana` - **NUEVO**: Número de semana para mapeo
- `Reservas Totales` - Número total de reservas
- `Lugares` - Capacidad del salón
- `Listas de Espera` - Número de personas en lista de espera
- `Cortesias` - Número de cortesías
- `Reservas Pagadas` - Número de reservas pagadas
- `Texto espcial` - Texto especial o notas adicionales
- `Es cover` - Indica si es una clase de cover

#### Columnas de Plataformas
- `Fitpass Bloqueadas (bot)`
- `Fitpass Fantasmas`
- `Fitpass Reserved`
- `Gympass Late Cancel`
- `Gympass Pagadas`
- `Classpass Late Cancel`
- `Classpass Pagadas`
- `Ecosinvisibles`
- `PR Bloqueadas`

## APIs del Backend

### 1. Análisis del Archivo
**Endpoint**: `POST /api/importar/analizar`

**Parámetros**:
- `file`: Archivo Excel (.xlsx o .xls)

**Respuesta**:
```typescript
{
  totalRegistros: number
  semanasEncontradas: number[]
  instructoresEncontrados: string[]
  disciplinasEncontradas: string[]
  instructoresVS: InstructorVS[]
  instructorAnalysis: InstructorAnalysis
  disciplineAnalysis: DisciplineAnalysis
  errores: ErrorImportacion[]
}
```

### 2. Procesamiento de Importación
**Endpoint**: `POST /api/importar/procesar`

**Parámetros**:
- `file`: Archivo Excel (.xlsx o .xls)
- `configuracion`: JSON con la configuración de importación

**Configuración**:
```typescript
{
  periodoId: number
  mapeoSemanas: MapeoSemanas[]
  mapeoDisciplinas: Record<string, string>
  instructoresVS: InstructorVS[]
  instructoresCreados: string[]
}
```

**Respuesta**:
```typescript
{
  totalRegistros: number
  registrosImportados: number
  registrosConError: number
  errores: ErrorImportacion[]
  clasesCreadas: number
  clasesEliminadas?: number
  instructoresCreados?: number
}
```

## Uso del Hook

### Hook: `useExcelImportAPI`

```typescript
import { useExcelImportAPI } from "@/hooks/use-excel-import-api"

const {
  // State
  file,
  currentStep,
  isAnalyzing,
  isImporting,
  resultadoAnalisis,
  resultadoImportacion,
  error,
  
  // Configuraciones
  mapeoSemanas,
  mapeoDisciplinas,
  instructoresVS,
  instructoresCreados,
  
  // Actions
  handleFileChange,
  analizarArchivo,
  procesarImportacion,
  actualizarMapeoSemanas,
  actualizarMapeoDisciplinas,
  toggleInstructorVS,
  toggleInstructorCreado,
  validarConfiguracion,
  resetState
} = useExcelImportAPI()
```

### Flujo de Uso

1. **Seleccionar archivo y periodo**
2. **Analizar archivo** → Obtiene información del Excel
3. **Configurar mapeos**:
   - Mapeo de semanas (Excel → Periodo)
   - Mapeo de disciplinas (Excel → Sistema)
   - Configurar instructores VS
   - Seleccionar instructores a crear
4. **Procesar importación** → Crea clases e instructores
5. **Ver resultados** → Resumen de la importación

## Componente de Ejemplo

```typescript
import { ExcelImportAPI } from "@/components/import/excel-import-api"

export default function ImportPage() {
  return (
    <div className="container mx-auto py-6">
      <ExcelImportAPI />
    </div>
  )
}
```

## Mapeo de Semanas

Un periodo tiene exactamente 4 semanas obligatorias (1-4). El sistema muestra las 4 semanas del periodo y permite mapear cada una a una semana específica del Excel. Solo se procesan las semanas del Excel que estén mapeadas.

```typescript
// Ejemplo: Semana 1 del Periodo → Semana 15 del Excel
{
  semanaPeriodo: 1,
  semanaExcel: 15
}

// Ejemplo: Semana 2 del Periodo → Semana 16 del Excel  
{
  semanaPeriodo: 2,
  semanaExcel: 16
}

// Ejemplo: Semana 3 del Periodo → Semana 17 del Excel
{
  semanaPeriodo: 3,
  semanaExcel: 17
}

// Ejemplo: Semana 4 del Periodo → Semana 18 del Excel
{
  semanaPeriodo: 4,
  semanaExcel: 18
}

// Las semanas del periodo que no estén mapeadas no procesarán datos
// Las semanas del Excel que no estén mapeadas se descartan automáticamente
```

## Instructores VS (Hasta 4)

El sistema ahora soporta hasta 4 instructores en una clase VS:

```typescript
// Ejemplo: "Instructor1 vs Instructor2 vs Instructor3 vs Instructor4"
{
  originalName: "Instructor1 vs Instructor2 vs Instructor3 vs Instructor4",
  instructores: ["Instructor1", "Instructor2", "Instructor3", "Instructor4"],
  count: 1,
  keepInstructores: [true, true, false, true] // Solo se crean 3 clases
}
```

## Ventajas del Nuevo Sistema

### 🚀 Rendimiento
- Procesamiento en el backend (más rápido)
- Menos carga en el navegador
- Mejor manejo de archivos grandes

### 🔧 Flexibilidad
- Mapeo de semanas personalizable
- Configuración granular de instructores VS
- Validaciones en tiempo real

### 📈 Escalabilidad
- APIs reutilizables
- Fácil integración con otros sistemas
- Logs detallados del proceso

### 🛡️ Robustez
- Manejo de errores mejorado
- Validaciones del lado del servidor
- Transacciones de base de datos

## Migración desde el Sistema Anterior

Para migrar desde el hook anterior (`use-excel-import`):

1. **Reemplazar el hook**:
   ```typescript
   // Antes
   import { useExcelImport } from "@/hooks/use-excel-import"
   
   // Ahora
   import { useExcelImportAPI } from "@/hooks/use-excel-import-api"
   ```

2. **Actualizar el flujo**:
   - El proceso ahora es en 2 pasos
   - Se requiere configuración antes de la importación
   - Los resultados se muestran de manera diferente

3. **Actualizar tipos**:
   - Usar los tipos actualizados de `@/types/importacion`
   - El campo `Semana` es ahora obligatorio en el Excel

## Consideraciones Importantes

### Archivo Excel
- Debe incluir la columna `Semana`
- Formato de fecha: DD/MM/YYYY o YYYY-MM-DD
- Formato de hora: HH:MM
- Nombres de instructores y disciplinas se normalizan automáticamente

### Configuración
- El mapeo de semanas es obligatorio
- Los instructores VS deben configurarse antes de la importación
- Las disciplinas nuevas deben mapearse a disciplinas existentes

### Errores
- Los errores se muestran por fila
- Se pueden reintentar importaciones fallidas
- Los logs detallados están disponibles en la consola del servidor 