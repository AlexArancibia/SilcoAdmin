"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Info, Users, BookOpen, Calendar } from "lucide-react"
import { ConfirmationDialog } from "./confirmation-dialog"
import type { TablaClasesEditable } from "@/types/importacion"

interface ImportSummaryProps {
  tablaClases: TablaClasesEditable
  onProcesar: () => void
  isProcessing: boolean
  periodoInfo?: {
    numero: number
    año: number
  }
}

export function ImportSummary({ tablaClases, onProcesar, isProcessing, periodoInfo }: ImportSummaryProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  // Calcular estadísticas
  const totalClases = tablaClases.totalClases
  const clasesValidas = tablaClases.clasesValidas
  const clasesConErrores = tablaClases.clasesConErrores
  const clasesEliminadas = tablaClases.clasesEliminadas

  // Análisis de instructores
  const instructoresUnicos = new Set<string>()
  const instructoresExistentes = new Set<string>()
  const instructoresNuevos = new Set<string>()
  const instructoresVS = new Set<string>()

  tablaClases.clases.forEach(clase => {
    if (!clase.eliminada) {
      instructoresUnicos.add(clase.instructor)
      
      if (clase.instructorExiste) {
        instructoresExistentes.add(clase.instructor)
      } else {
        instructoresNuevos.add(clase.instructor)
      }

      if (clase.esInstructorVS) {
        instructoresVS.add(clase.instructor)
      }
    }
  })

  // Análisis de disciplinas
  const disciplinasUnicas = new Set<string>()
  const disciplinasExistentes = new Set<string>()
  const disciplinasNuevas = new Set<string>()

  tablaClases.clases.forEach(clase => {
    if (!clase.eliminada) {
      disciplinasUnicas.add(clase.disciplina)
      
      if (clase.mapeoDisciplina) {
        disciplinasExistentes.add(clase.disciplina)
      } else {
        disciplinasNuevas.add(clase.disciplina)
      }
    }
  })

  // Análisis de semanas
  const semanasUnicas = new Set<number>()
  tablaClases.clases.forEach(clase => {
    if (!clase.eliminada) {
      semanasUnicas.add(clase.semana)
    }
  })

  const semanasOrdenadas = Array.from(semanasUnicas).sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resumen de Importación
          </CardTitle>
          <CardDescription>
            Revisa el resumen antes de procesar la importación final
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{totalClases}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{clasesValidas}</div>
              <div className="text-xs text-green-600">Válidas</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{clasesConErrores}</div>
              <div className="text-xs text-yellow-600">Errores</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">{clasesEliminadas}</div>
              <div className="text-xs text-red-600">Eliminadas</div>
            </div>
          </div>

          {/* Análisis compacto */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Instructores
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Total:</span>
                  <Badge variant="secondary">{instructoresUnicos.size}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Existentes:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {instructoresExistentes.size}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Nuevos:</span>
                  <Badge variant="destructive">
                    {instructoresNuevos.size}
                  </Badge>
                </div>
                {instructoresVS.size > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span>VS:</span>
                    <Badge variant="outline" className="border-orange-200 text-orange-800">
                      {instructoresVS.size}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Disciplinas
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Total:</span>
                  <Badge variant="secondary">{disciplinasUnicas.size}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Existentes:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {disciplinasExistentes.size}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Nuevas:</span>
                  <Badge variant="destructive">
                    {disciplinasNuevas.size}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Semanas
              </div>
              <div className="flex flex-wrap gap-1">
                {semanasOrdenadas.map(semana => (
                  <Badge key={semana} variant="outline" className="text-xs">
                    {semana}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Advertencia crítica sobre eliminación de clases */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-red-800 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">⚠️ Acción Crítica</span>
            </div>
            <div className="text-xs text-red-700 space-y-1">
              <p><strong>Se eliminarán TODAS las clases existentes del periodo antes de crear las nuevas.</strong></p>
              <p>Esta acción no se puede deshacer. Asegúrate de que los datos sean correctos antes de continuar.</p>
            </div>
          </div>

          {/* Advertencias compactas */}
          {(instructoresNuevos.size > 0 || disciplinasNuevas.size > 0 || clasesConErrores > 0) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-yellow-800 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Advertencias</span>
              </div>
              <div className="text-xs text-yellow-700 space-y-1">
                {instructoresNuevos.size > 0 && (
                  <p>• {instructoresNuevos.size} instructor(es) nuevo(s) serán creados</p>
                )}
                {disciplinasNuevas.size > 0 && (
                  <p>• {disciplinasNuevas.size} disciplina(s) nueva(s) requieren mapeo</p>
                )}
                {clasesConErrores > 0 && (
                  <p>• {clasesConErrores} clase(s) tienen errores</p>
                )}
              </div>
            </div>
          )}

          {/* Botón de procesar */}
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowConfirmation(true)} 
              disabled={isProcessing || clasesValidas === 0}
              size="lg"
              variant={isProcessing ? "secondary" : "destructive"}
              className={isProcessing ? "" : "bg-red-600 hover:bg-red-700"}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Eliminar y Reemplazar Todas las Clases
                </>
              )}
            </Button>
          </div>

          {/* Diálogo de confirmación */}
          {periodoInfo && (
            <ConfirmationDialog
              isOpen={showConfirmation}
              onClose={() => setShowConfirmation(false)}
              onConfirm={() => {
                setShowConfirmation(false)
                onProcesar()
              }}
              periodoInfo={periodoInfo}
              estadisticas={{
                clasesValidas,
                instructoresNuevos: instructoresNuevos.size,
                disciplinasNuevas: disciplinasNuevas.size
              }}
              isProcessing={isProcessing}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
