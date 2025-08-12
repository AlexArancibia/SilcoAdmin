"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet } from "lucide-react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import type { Periodo } from "@/types/schema"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { FileUploader } from "./file-uploader"
import { ClassesEditableTable } from "./classes-editable-table"
import { ImportSummary } from "./import-summary"
import { ImportResult } from "./import-result"
import { useExcelImportAPI } from "@/hooks/use-excel-import-api"

export function ExcelImport() {
  const {
    file,
    setFile,
    currentStep,
    setCurrentStep,
    isGenerating,
    isImporting,
    resultadoImportacion,
    error,
    periodoSeleccionadoId,
    setPeriodoSeleccionadoId,
    
    // Configuraciones
    semanaInicial,
    setSemanaInicial,
    mapeoDisciplinas,
    instructoresCreados,
    tablaClases,
    
    // Stores
    periodos,
    disciplinas,
    instructores,
    isLoadingPeriodos,
    isLoadingDisciplinas,
    isLoadingInstructores,
    
    // Actions
    handleFileChange,
    generarTablaClases,
    procesarImportacion,
    actualizarMapeoDisciplinas,
    toggleInstructorCreado,
    validarConfiguracion,
    resetState,
    // Funciones de edición
    editarClase,
    toggleEliminarClase
  } = useExcelImportAPI()

  // Función para obtener el nombre del periodo
  const getNombrePeriodo = (periodo: Periodo): string => {
    return `Periodo ${periodo.numero} - ${periodo.año}`
  }

  // Renderizar el paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FileUploader
            file={file}
            handleFileChange={handleFileChange}
            periodoSeleccionadoId={periodoSeleccionadoId}
            setPeriodoSeleccionadoId={setPeriodoSeleccionadoId}
            semanaInicial={semanaInicial}
            setSemanaInicial={setSemanaInicial}
            periodos={periodos}
            isLoadingPeriodos={isLoadingPeriodos}
            error={error}
            getNombrePeriodo={getNombrePeriodo}
            onGenerarTabla={generarTablaClases}
            isGenerating={isGenerating}
          />
        )
      
      case 2:
        return (
          <div className="space-y-6">
            {tablaClases && (
              <>
                <ClassesEditableTable
                  tablaClases={tablaClases}
                  disciplinas={disciplinas}
                  instructores={instructores}
                  onEditClase={editarClase}
                  onToggleEliminar={toggleEliminarClase}
                />
                
                <ImportSummary
                  tablaClases={tablaClases}
                  onProcesar={procesarImportacion}
                  isProcessing={isImporting}
                  periodoInfo={periodos.find(p => p.id === periodoSeleccionadoId)}
                />
              </>
            )}
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Importación Completada</CardTitle>
                <CardDescription>
                  La importación se ha procesado exitosamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      resetState()
                      setCurrentStep(1)
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Importar Otro Archivo
                  </button>
                </div>
              </CardContent>
            </Card>
            
            {resultadoImportacion && (
              <ImportResult resultado={resultadoImportacion} />
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Importar Clases desde Excel
          </CardTitle>
          <CardDescription>
            Importa clases desde un archivo Excel con mapeo automático de semanas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  )
}
