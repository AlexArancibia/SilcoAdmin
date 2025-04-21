"use client"

import type React from "react"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileSpreadsheet, AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import type { Periodo } from "@/types/schema"
import { Switch } from "@/components/ui/switch"

interface FileUploaderProps {
  file: File | null
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  periodoSeleccionadoId: number | null
  setPeriodoSeleccionadoId: (id: number | null) => void
  selectedWeek: string
  setSelectedWeek: (week: string) => void
  periodos: Periodo[]
  isLoadingPeriodos: boolean
  isInitialLoading: boolean
  error: string | null
  getNombrePeriodo: (periodo: Periodo) => string
  setCurrentStep: (step: number) => void
  children: ReactNode
  detailedLogging: boolean
  setDetailedLogging: (value: boolean) => void
}

export function FileUploader({
  file,
  handleFileChange,
  periodoSeleccionadoId,
  setPeriodoSeleccionadoId,
  selectedWeek,
  setSelectedWeek,
  periodos,
  isLoadingPeriodos,
  isInitialLoading,
  error,
  getNombrePeriodo,
  setCurrentStep,
  children,
  detailedLogging,
  setDetailedLogging,
}: FileUploaderProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="periodo" className="text-sm font-medium mb-1.5 block">
            Periodo
          </Label>
          <Select
            value={periodoSeleccionadoId?.toString() || ""}
            onValueChange={(value) => setPeriodoSeleccionadoId(value ? Number.parseInt(value) : null)}
            disabled={isLoadingPeriodos}
          >
            <SelectTrigger id="periodo" className="w-full bg-background border-muted">
              <SelectValue placeholder={isLoadingPeriodos ? "Cargando periodos..." : "Seleccionar periodo"} />
            </SelectTrigger>
            <SelectContent>
              {periodos.length === 0 && !isLoadingPeriodos ? (
                <div className="p-2 text-center text-sm text-muted-foreground">No hay periodos disponibles</div>
              ) : (
                periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    {getNombrePeriodo(periodo)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="semana" className="text-sm font-medium mb-1.5 block">
            Semana
          </Label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger id="semana" className="w-full bg-background border-muted">
              <SelectValue placeholder="Seleccionar semana" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Semana 1</SelectItem>
              <SelectItem value="2">Semana 2</SelectItem>
              <SelectItem value="3">Semana 3</SelectItem>
              <SelectItem value="4">Semana 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        <Label htmlFor="file" className="text-sm font-medium">
          Archivo Excel
        </Label>
        <div className="flex items-center gap-4">
          <Input id="file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
          <div className="grid w-full gap-2">
            <Label
              htmlFor="file"
              className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/5 px-4 py-5 text-center transition-colors hover:bg-muted/10"
            >
              <FileSpreadsheet className="h-10 w-10 text-primary/60" />
              <div className="mt-3 text-base font-medium text-primary">
                {file ? file.name : "Arrastra y suelta o haz clic para subir"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Solo archivos Excel (.xlsx, .xls)</div>
            </Label>
          </div>
        </div>
      </div>

      {/* Add the detailed logging switch */}
      <div className="flex items-center space-x-2 mt-4 bg-muted/10 p-3 rounded-md border">
        <Switch id="detailed-logging" checked={detailedLogging} onCheckedChange={setDetailedLogging} />
        <Label htmlFor="detailed-logging" className="cursor-pointer">
          Registro detallado
        </Label>
        <div className="text-xs text-muted-foreground ml-2">
          Muestra información detallada de cada clase creada y cada error
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isInitialLoading && (
        <div className="flex items-center justify-center p-6 bg-muted/10 rounded-lg border border-muted">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="font-medium">Cargando datos necesarios...</span>
        </div>
      )}

      {children}

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!file || !periodoSeleccionadoId || !selectedWeek || isInitialLoading}
          className="bg-primary hover:bg-primary/90 transition-colors"
        >
          Continuar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
