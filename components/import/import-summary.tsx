"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, ArrowRight, Upload, Loader2, CheckCircle2 } from "lucide-react"
import type { Periodo } from "@/types/schema"
import type { DatosExcelClase, ResultadoImportacion } from "@/types/importacion"
import { ImportResult } from "./import-result"

interface ImportSummaryProps {
  periodos: Periodo[]
  periodoSeleccionadoId: number | null
  selectedWeek: string
  file: File | null
  parsedData: DatosExcelClase[] | null
  instructorAnalysis: {
    total: number
    existing: number
    new: number
    instructors: any[]
  }
  disciplineAnalysis: {
    total: number
    existing: number
    new: number
    disciplines: Array<{
      name: string
      exists: boolean
      count: number
      mappedTo?: string
    }>
  }
  isImporting: boolean
  progress: number
  statusMessage: string
  resultado: ResultadoImportacion | null
  handleSubmit: (e: React.FormEvent) => Promise<void>
  setCurrentStep: (step: number) => void
  getNombrePeriodo: (periodo: Periodo) => string
  detailedLogging?: boolean
  detailedLogs?: Array<{
    type: "success" | "error" | "info"
    message: string
    details?: any
    timestamp: string
  }>
}

export function ImportSummary({
  periodos,
  periodoSeleccionadoId,
  selectedWeek,
  file,
  parsedData,
  instructorAnalysis,
  disciplineAnalysis,
  isImporting,
  progress,
  statusMessage,
  resultado,
  handleSubmit,
  setCurrentStep,
  getNombrePeriodo,
  detailedLogging = false,
  detailedLogs = [],
}: ImportSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border shadow-sm">
        <h3 className="text-lg font-medium text-primary mb-4">Resumen de Importación</h3>

        <div className="space-y-4">
          <div className="bg-background p-5 rounded-lg border shadow-sm">
            <h4 className="font-medium text-primary mb-3">Información General</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-sm font-medium text-muted-foreground">Periodo:</div>
              <div className="text-sm">
                {periodos.find((p) => p.id === periodoSeleccionadoId)
                  ? getNombrePeriodo(periodos.find((p) => p.id === periodoSeleccionadoId)!)
                  : "No seleccionado"}
              </div>
              <div className="text-sm font-medium text-muted-foreground">Semana:</div>
              <div className="text-sm">Semana {selectedWeek}</div>
              <div className="text-sm font-medium text-muted-foreground">Archivo:</div>
              <div className="text-sm">{file?.name}</div>
              <div className="text-sm font-medium text-muted-foreground">Total de registros:</div>
              <div className="text-sm">{parsedData?.length || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <h4 className="font-medium text-primary mb-3">Instructores</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm font-medium text-muted-foreground">Total de instructores:</div>
                <div className="text-sm">{instructorAnalysis.total}</div>
                <div className="text-sm font-medium text-muted-foreground">Instructores existentes:</div>
                <div className="text-sm text-green-600 font-medium">{instructorAnalysis.existing}</div>
                <div className="text-sm font-medium text-muted-foreground">Instructores nuevos:</div>
                <div className="text-sm text-blue-600 font-medium">{instructorAnalysis.new}</div>
              </div>
            </div>

            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <h4 className="font-medium text-primary mb-3">Disciplinas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm font-medium text-muted-foreground">Total de disciplinas:</div>
                <div className="text-sm">{disciplineAnalysis.total}</div>
                <div className="text-sm font-medium text-muted-foreground">Disciplinas existentes:</div>
                <div className="text-sm text-green-600 font-medium">{disciplineAnalysis.existing}</div>
                <div className="text-sm font-medium text-muted-foreground">Disciplinas nuevas:</div>
                <div className="text-sm text-blue-600 font-medium">{disciplineAnalysis.new}</div>
                <div className="text-sm font-medium text-muted-foreground">Disciplinas mapeadas:</div>
                <div className="text-sm text-purple-600 font-medium">
                  {disciplineAnalysis.disciplines.filter((d) => d.mappedTo).length}
                </div>
              </div>
            </div>
          </div>

          {disciplineAnalysis.disciplines.some((d) => d.mappedTo) && (
            <div className="bg-background p-5 rounded-lg border shadow-sm">
              <h4 className="font-medium text-primary mb-3">Mapeos de Disciplinas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {disciplineAnalysis.disciplines
                  .filter((d) => d.mappedTo)
                  .map((d, index) => (
                    <div key={index} className="text-sm flex items-center gap-2 bg-muted/20 p-2 rounded-md">
                      <span className="font-medium">{d.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary/60" />
                      <span className="text-primary">{d.mappedTo}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isImporting && (
        <div className="grid gap-2 bg-background p-5 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Procesando archivo...</Label>
            <span className="text-sm text-primary font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {isImporting && statusMessage && (
            <div className="mt-2 text-sm text-center font-medium text-primary">{statusMessage}</div>
          )}
        </div>
      )}

      {resultado && (
        <Alert className="bg-primary/10 text-primary border-primary/30 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          <AlertTitle>Importación completada</AlertTitle>
          <AlertDescription>
            Se importaron {resultado.registrosImportados} de {resultado.totalRegistros} registros.
          </AlertDescription>
        </Alert>
      )}

      {resultado && (
        <ImportResult resultado={resultado} detailedLogging={detailedLogging} detailedLogs={detailedLogs} />
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(3)} className="border-muted">
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isImporting || !!resultado}
          className={`${isImporting ? "bg-primary/80" : resultado ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"} transition-colors`}
        >
          {isImporting ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </div>
          ) : resultado ? (
            <div className="flex items-center">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Importación Completada
            </div>
          ) : (
            <div className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Confirmar Importación
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}

// Label component for the ImportSummary
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`text-sm font-medium ${className || ""}`}>{children}</div>
}
