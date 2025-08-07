"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, FileSpreadsheet, Users, Calendar, CheckCircle, XCircle } from "lucide-react"
import { useExcelImportAPI } from "@/hooks/use-excel-import-api"

export function ExcelImportAPI() {
  const {
    file,
    currentStep,
    setCurrentStep,
    isAnalyzing,
    isImporting,
    resultadoAnalisis,
    resultadoImportacion,
    error,
    periodoSeleccionadoId,
    setPeriodoSeleccionadoId,
    mapeoSemanas,
    mapeoDisciplinas,
    instructoresVS,
    instructoresCreados,
    periodos,
    disciplinas,
    instructores,
    isLoadingPeriodos,
    isLoadingDisciplinas,
    isLoadingInstructores,
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

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleProcesarImportacion = async () => {
    const validacion = validarConfiguracion()
    if (!validacion.valido) {
      alert(`Errores de validación:\n${validacion.errores.join('\n')}`)
      return
    }
    await procesarImportacion()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Importar Excel</h2>
          <p className="text-muted-foreground">
            Importa clases desde un archivo Excel usando las nuevas APIs del backend
          </p>
        </div>
      </div>

      {/* Step 1: Selección de archivo y análisis */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Paso 1: Seleccionar y analizar archivo
            </CardTitle>
            <CardDescription>
              Sube tu archivo Excel para analizar su contenido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodo">Periodo</Label>
              <Select
                value={periodoSeleccionadoId?.toString() || ""}
                onValueChange={(value) => setPeriodoSeleccionadoId(Number(value))}
                disabled={isLoadingPeriodos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      Periodo {periodo.numero} - {periodo.año}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Archivo Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}

            <Button 
              onClick={analizarArchivo} 
              disabled={!file || !periodoSeleccionadoId || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando archivo...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Analizar archivo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configuración */}
      {currentStep === 2 && resultadoAnalisis && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Paso 2: Configurar importación
              </CardTitle>
              <CardDescription>
                Revisa y ajusta las configuraciones antes de importar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumen del análisis */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{resultadoAnalisis.totalRegistros}</div>
                  <div className="text-sm text-muted-foreground">Registros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{resultadoAnalisis.instructorAnalysis.total}</div>
                  <div className="text-sm text-muted-foreground">Instructores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{resultadoAnalisis.disciplineAnalysis.total}</div>
                  <div className="text-sm text-muted-foreground">Disciplinas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{resultadoAnalisis.semanasEncontradas.length}</div>
                  <div className="text-sm text-muted-foreground">Semanas</div>
                </div>
              </div>

              <Separator />

              {/* Mapeo de semanas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mapeo de Semanas</h3>
                <p className="text-sm text-muted-foreground">
                  Un periodo tiene 4 semanas obligatorias. Mapea cada semana del periodo a una semana del Excel.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }, (_, i) => i + 1).map((semanaPeriodo) => {
                    const mapeo = mapeoSemanas.find(ms => ms.semanaPeriodo === semanaPeriodo)
                    return (
                      <div key={semanaPeriodo} className="flex items-center gap-2">
                        <Label className="min-w-[100px]">Semana {semanaPeriodo} del Periodo →</Label>
                        <Select
                          value={mapeo?.semanaExcel?.toString() || "none"}
                          onValueChange={(value) => actualizarMapeoSemanas(value === "none" ? 0 : Number(value), semanaPeriodo)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin mapear</SelectItem>
                            {resultadoAnalisis.semanasEncontradas.map((semanaExcel) => (
                              <SelectItem key={semanaExcel} value={semanaExcel.toString()}>
                                Semana {semanaExcel} del Excel
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Mapeo de disciplinas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mapeo de Disciplinas</h3>
                <div className="space-y-2">
                  {resultadoAnalisis.disciplineAnalysis.disciplines.map((disciplina) => (
                    <div key={disciplina.name} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span>{disciplina.name}</span>
                        {disciplina.exists ? (
                          <Badge variant="secondary">Existente</Badge>
                        ) : (
                          <Badge variant="destructive">Nueva</Badge>
                        )}
                      </div>
                      {!disciplina.exists && (
                        <Select
                          value={mapeoDisciplinas[disciplina.name] || ""}
                          onValueChange={(value) => actualizarMapeoDisciplinas(disciplina.name, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Mapear a..." />
                          </SelectTrigger>
                          <SelectContent>
                            {disciplinas.map((disc) => (
                              <SelectItem key={disc.id} value={disc.nombre}>
                                {disc.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Instructores VS */}
              {instructoresVS.length > 0 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Instructores VS</h3>
                    <div className="space-y-2">
                      {instructoresVS.map((vs) => (
                        <div key={vs.originalName} className="p-3 border rounded">
                          <div className="font-medium mb-2">{vs.originalName}</div>
                          <div className="space-y-1">
                            {vs.instructores.map((instructor, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Checkbox
                                  checked={vs.keepInstructores[index]}
                                  onCheckedChange={() => toggleInstructorVS(vs.originalName, index)}
                                />
                                <span>{instructor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Instructores a crear */}
              {resultadoAnalisis.instructorAnalysis.new > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Instructores a Crear</h3>
                  <div className="space-y-2">
                    {resultadoAnalisis.instructorAnalysis.instructors
                      .filter(instructor => !instructor.exists)
                      .map((instructor) => (
                        <div key={instructor.name} className="flex items-center gap-2">
                          <Checkbox
                            checked={instructoresCreados.includes(instructor.name)}
                            onCheckedChange={() => toggleInstructorCreado(instructor.name)}
                          />
                          <span>{instructor.name}</span>
                          <Badge variant="outline">{instructor.count} clases</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleProcesarImportacion} 
                  disabled={isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando importación...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Procesar importación
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  disabled={isImporting}
                >
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Resultado */}
      {currentStep === 3 && resultadoImportacion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Importación completada
            </CardTitle>
            <CardDescription>
              Resumen de la importación realizada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {resultadoImportacion.totalRegistros}
                </div>
                <div className="text-sm text-muted-foreground">Total registros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {resultadoImportacion.registrosFiltrados || 0}
                </div>
                <div className="text-sm text-muted-foreground">Registros filtrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {resultadoImportacion.registrosImportados}
                </div>
                <div className="text-sm text-muted-foreground">Registros importados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {resultadoImportacion.clasesCreadas}
                </div>
                <div className="text-sm text-muted-foreground">Clases creadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {resultadoImportacion.instructoresCreados || 0}
                </div>
                <div className="text-sm text-muted-foreground">Instructores creados</div>
              </div>
            </div>
            
            {resultadoImportacion.registrosConError > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {resultadoImportacion.registrosConError}
                </div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
            )}

            {resultadoImportacion.errores.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Errores encontrados:</h3>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {resultadoImportacion.errores.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Fila {error.fila}: {error.mensaje}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={resetState} 
              className="w-full"
            >
              Importar otro archivo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 