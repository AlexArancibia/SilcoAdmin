"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import type { Periodo } from "@/types/schema"

interface FileUploaderProps {
  file: File | null
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  periodoSeleccionadoId: number | null
  setPeriodoSeleccionadoId: (id: number | null) => void
  semanaInicial: number
  setSemanaInicial: (semana: number) => void
  periodos: Periodo[]
  isLoadingPeriodos: boolean
  error: string | null
  getNombrePeriodo: (periodo: Periodo) => string
  onGenerarTabla: () => void
  isGenerating: boolean
}

export function FileUploader({
  file,
  handleFileChange,
  periodoSeleccionadoId,
  setPeriodoSeleccionadoId,
  semanaInicial,
  setSemanaInicial,
  periodos,
  isLoadingPeriodos,
  error,
  getNombrePeriodo,
  onGenerarTabla,
  isGenerating
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.xlsx,.xls'
      input.files = e.dataTransfer.files
      const event = { target: input } as React.ChangeEvent<HTMLInputElement>
      handleFileChange(event)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file && periodoSeleccionadoId && semanaInicial > 0) {
      onGenerarTabla()
    }
  }

  const canSubmit = file && periodoSeleccionadoId && semanaInicial > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paso 1: Seleccionar Archivo y Configuración</CardTitle>
          <CardDescription>
            Selecciona el archivo Excel y configura el mapeo de semanas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selección de periodo */}
          <div className="space-y-2">
            <Label htmlFor="periodo">Periodo</Label>
            <Select
              value={periodoSeleccionadoId?.toString() || ""}
              onValueChange={(value) => setPeriodoSeleccionadoId(value ? parseInt(value) : null)}
              disabled={isLoadingPeriodos}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un periodo" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    {getNombrePeriodo(periodo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configuración de semana inicial */}
          <div className="space-y-2">
            <Label htmlFor="semanaInicial">Semana Inicial del Periodo</Label>
            <div className="space-y-2">
              <Input
                id="semanaInicial"
                type="number"
                min="1"
                value={semanaInicial}
                onChange={(e) => setSemanaInicial(parseInt(e.target.value) || 1)}
                placeholder="Ej: 28"
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                <strong>Mapeo automático:</strong> Si ingresas semana 28, entonces:
                <br />• Semana 28 del Excel → Semana 1 del periodo
                <br />• Semana 29 del Excel → Semana 2 del periodo  
                <br />• Semana 30 del Excel → Semana 3 del periodo
                <br />• Semana 31 del Excel → Semana 4 del periodo
              </p>
            </div>
          </div>

          {/* Upload de archivo */}
          <div className="space-y-2">
            <Label>Archivo Excel</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <FileSpreadsheet className="h-12 w-12 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.xlsx,.xls'
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files && target.files[0]) {
                          const event = { target } as React.ChangeEvent<HTMLInputElement>
                          handleFileChange(event)
                        }
                      }
                      input.click()
                    }}
                  >
                    Cambiar Archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      Arrastra y suelta tu archivo Excel aquí
                    </p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.xlsx,.xls'
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        if (target.files && target.files[0]) {
                          const event = { target } as React.ChangeEvent<HTMLInputElement>
                          handleFileChange(event)
                        }
                      }
                      input.click()
                    }}
                  >
                    Seleccionar Archivo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Botón de generar tabla */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isGenerating}
              size="lg"
            >
              {isGenerating ? "Generando Tabla..." : "Generar Tabla de Clases"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
