"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, UserCheck, UserX, Loader2 } from "lucide-react"
import type { Instructor } from "@/types/schema"
import { VsInstructorsList } from "./vs-instructors-list"

interface InstructorValidationProps {
  instructorAnalysis: {
    total: number
    existing: number
    new: number
    instructors: Array<{
      name: string
      exists: boolean
      count: number
      matchedInstructor?: Instructor
      disciplines: Set<string>
    }>
  }
  vsInstructors: Array<{
    originalName: string
    instructor1: string
    instructor2: string
    count: number
    keepInstructor1: boolean
    keepInstructor2: boolean
  }>
  toggleKeepVsInstructor: (originalName: string, instructorNumber: 1 | 2) => void
  isLoadingInstructores: boolean
  setCurrentStep: (step: number) => void
}

export function InstructorValidation({
  instructorAnalysis,
  vsInstructors,
  toggleKeepVsInstructor,
  isLoadingInstructores,
  setCurrentStep,
}: InstructorValidationProps) {
  if (isLoadingInstructores) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Cargando instructores...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border shadow-sm">
        <h3 className="text-lg font-medium text-primary mb-4">Validación de Instructores</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background p-5 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Total de Instructores</div>
            <div className="text-2xl font-bold text-primary">{instructorAnalysis.total}</div>
          </div>
          <div className="bg-background p-5 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Instructores Existentes</div>
            <div className="text-2xl font-bold text-green-600">{instructorAnalysis.existing}</div>
          </div>
          <div className="bg-background p-5 rounded-lg border shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Instructores Nuevos</div>
            <div className="text-2xl font-bold text-blue-600">{instructorAnalysis.new}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-primary">Detalle de Instructores</h4>
            <div className="text-sm text-muted-foreground">
              Se crearán automáticamente los instructores que no existan
            </div>
          </div>

          <div className="bg-background rounded-lg border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-primary">Instructor</th>
                  <th className="text-left py-3 px-4 font-medium text-primary">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-primary">Clases</th>
                  <th className="text-left py-3 px-4 font-medium text-primary">Información</th>
                </tr>
              </thead>
              <tbody>
                {instructorAnalysis.instructors.map((instructor, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{instructor.name}</td>
                    <td className="py-3 px-4">
                      {instructor.exists ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit px-2 py-0.5"
                        >
                          <UserCheck className="h-3 w-3 mr-1.5" />
                          Existente
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 flex items-center w-fit px-2 py-0.5"
                        >
                          <UserX className="h-3 w-3 mr-1.5" />
                          Nuevo
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">{instructor.count}</td>
                    <td className="py-3 px-4">
                      {instructor.matchedInstructor && (
                        <div className="text-xs text-muted-foreground">
                          <div>
                            ID: <span className="font-medium">{instructor.matchedInstructor.id}</span>
                          </div>
                          {instructor.matchedInstructor.extrainfo?.telefono && (
                            <div>
                              Teléfono:{" "}
                              <span className="font-medium">{instructor.matchedInstructor.extrainfo.telefono}</span>
                            </div>
                          )}
                          {instructor.matchedInstructor.extrainfo?.especialidad && (
                            <div>
                              Especialidad:{" "}
                              <span className="font-medium">{instructor.matchedInstructor.extrainfo.especialidad}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {vsInstructors.length > 0 && (
        <VsInstructorsList vsInstructors={vsInstructors} toggleKeepVsInstructor={toggleKeepVsInstructor} />
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="border-muted">
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button onClick={() => setCurrentStep(3)} className="bg-primary hover:bg-primary/90 transition-colors">
          Continuar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
