"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet } from "lucide-react"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import type { Periodo } from "@/types/schema"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { DataPreview } from "./data-preview"
import { FileUploader } from "./file-uploader"
import { InstructorValidation } from "./instructor-validation"
import { DisciplineValidation } from "./discipline-validation"
import { ImportSummary } from "./import-summary"
import { ProgressIndicator } from "./progress-indicator"
import { useExcelImport } from "@/hooks/use-excel-import"

// Import modularized components
 

export function ExcelImport() {
  const {
    file,
    setFile,
    parsedData,
    setParsedData,
    selectedWeek,
    setSelectedWeek,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    showAllColumns,
    setShowAllColumns,
    currentStep,
    setCurrentStep,
    isInitialLoading,
    isImporting,
    progress,
    resultado,
    error,
    statusMessage,
    instructorAnalysis,
    disciplineAnalysis,
    vsInstructors,
    periodoSeleccionadoId,
    setPeriodoSeleccionadoId,
    paginatedData,
    totalPages,
    handleFileChange,
    handlePrevPage,
    handleNextPage,
    handleRowsPerPageChange,
    toggleKeepVsInstructor,
    handleDisciplineMapping,
    handleSubmit,
    formatDateTime,
    formatTime,
    getMainColumns,
    getAdditionalColumns,
    detailedLogging,
    setDetailedLogging,
    detailedLogs,
  } = useExcelImport()

  // Obtener datos de los stores
  const { periodos, periodoActual, isLoading: isLoadingPeriodos } = usePeriodosStore()
  const { isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { isLoading: isLoadingInstructores } = useInstructoresStore()

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
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            periodos={periodos}
            isLoadingPeriodos={isLoadingPeriodos}
            isInitialLoading={isInitialLoading}
            error={error}
            getNombrePeriodo={getNombrePeriodo}
            setCurrentStep={setCurrentStep}
            detailedLogging={detailedLogging}
            setDetailedLogging={setDetailedLogging}
          >
            {parsedData && (
              <DataPreview
                parsedData={parsedData}
                paginatedData={paginatedData}
                showAllColumns={showAllColumns}
                setShowAllColumns={setShowAllColumns}
                currentPage={currentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                handlePrevPage={handlePrevPage}
                handleNextPage={handleNextPage}
                handleRowsPerPageChange={handleRowsPerPageChange}
                mainColumns={getMainColumns()}
                additionalColumns={getAdditionalColumns()}
                formatDateTime={formatDateTime}
                formatTime={formatTime}
              />
            )}
          </FileUploader>
        )
      case 2:
        return (
          <InstructorValidation
            instructorAnalysis={instructorAnalysis}
            vsInstructors={vsInstructors}
            toggleKeepVsInstructor={toggleKeepVsInstructor}
            isLoadingInstructores={isLoadingInstructores}
            setCurrentStep={setCurrentStep}
          />
        )
      case 3:
        return (
          <DisciplineValidation
            disciplineAnalysis={disciplineAnalysis}
            handleDisciplineMapping={handleDisciplineMapping}
            isLoadingDisciplinas={isLoadingDisciplinas}
            setCurrentStep={setCurrentStep}
          />
        )
      case 4:
        return (
          <ImportSummary
            periodos={periodos}
            periodoSeleccionadoId={periodoSeleccionadoId}
            selectedWeek={selectedWeek}
            file={file}
            parsedData={parsedData}
            instructorAnalysis={instructorAnalysis}
            disciplineAnalysis={disciplineAnalysis}
            isImporting={isImporting}
            progress={progress}
            statusMessage={statusMessage}
            resultado={resultado}
            handleSubmit={handleSubmit}
            setCurrentStep={setCurrentStep}
            getNombrePeriodo={getNombrePeriodo}
            detailedLogging={detailedLogging}
            detailedLogs={detailedLogs}
          />
        )
      default:
        return null
    }
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="bg-muted/20 border-b">
        <CardTitle className="text-primary flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Datos de Excel
        </CardTitle>
        <CardDescription>
          Sigue los pasos para importar datos de clases para el periodo y semana seleccionados.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ProgressIndicator currentStep={currentStep} />
        {renderStep()}
      </CardContent>
    </Card>
  )
}

function obtenerDiaSemana(fecha: Date): string {
  const diasSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"]
  return diasSemana[fecha.getDay()]
}
