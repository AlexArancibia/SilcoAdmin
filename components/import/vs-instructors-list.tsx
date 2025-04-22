"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface VsInstructorsListProps {
  vsInstructors: Array<{
    originalName: string
    instructor1: string
    instructor2: string
    count: number
    keepInstructor1: boolean
    keepInstructor2: boolean
  }>
  toggleKeepVsInstructor: (originalName: string, instructorNumber: 1 | 2) => void
}

export function VsInstructorsList({ vsInstructors, toggleKeepVsInstructor }: VsInstructorsListProps) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-primary">Instructores con VS detectados</h4>
        <div className="text-sm text-muted-foreground">Selecciona qué instructores mantener en cada par VS</div>
      </div>

      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Atención: Instructores VS detectados</AlertTitle>
        <AlertDescription className="text-amber-700">
          Se han detectado {vsInstructors.length} instructores con formato "VS". Puedes elegir qué instructores mantener
          en cada par. Si un instructor es invitado y no pertenece a la organización, puedes desmarcarlo.
        </AlertDescription>
      </Alert>

      <div className="bg-background rounded-lg border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-primary">Nombre Original</th>
              <th className="text-left py-3 px-4 font-medium text-primary">Instructor 1</th>
              <th className="text-left py-3 px-4 font-medium text-primary">Instructor 2</th>
              <th className="text-left py-3 px-4 font-medium text-primary">Clases</th>
              <th className="text-left py-3 px-4 font-medium text-primary">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vsInstructors.map((instructor, index) => (
              <tr key={index} className="border-b hover:bg-amber-50 transition-colors">
                <td className="py-3 px-4 font-medium">{instructor.originalName}</td>
                <td className="py-3 px-4">{instructor.instructor1}</td>
                <td className="py-3 px-4">{instructor.instructor2}</td>
                <td className="py-3 px-4">{instructor.count}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`keep-instructor1-${index}`}
                        checked={instructor.keepInstructor1}
                        onChange={() => toggleKeepVsInstructor(instructor.originalName, 1)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`keep-instructor1-${index}`} className="text-xs">
                        Mantener instructor 1
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`keep-instructor2-${index}`}
                        checked={instructor.keepInstructor2}
                        onChange={() => toggleKeepVsInstructor(instructor.originalName, 2)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`keep-instructor2-${index}`} className="text-xs">
                        Mantener instructor 2
                      </label>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
