"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, X, Sparkles } from "lucide-react"
import type { Instructor } from "@/types/schema"

interface InstructorHeaderProps {
  instructor: Instructor | null
  isEditing: boolean
  handleEditToggle: () => void
}

export function InstructorHeader({ instructor, isEditing, handleEditToggle }: InstructorHeaderProps) {
  if (!instructor) return null

  const telefono = instructor?.extrainfo?.telefono || "No disponible"
  const estado = instructor?.extrainfo?.activo ? "activo" : "inactivo"
  const foto = instructor?.extrainfo?.foto
  const disciplinasInstructor = instructor?.disciplinas || []

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-card to-card/80 rounded-xl border shadow-sm">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

      <div className="relative p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-sm"></div>
              <Avatar className="h-20 w-20 border-2 border-background shadow-md relative">
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary/30 to-primary/10 text-primary-foreground">
                  {instructor?.nombre?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {instructor?.activo && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">{instructor?.nombre}</h1>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {disciplinasInstructor.map((disciplina) => (
                  <Badge
                    key={disciplina.id}
                    variant="outline"
                    className="bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-medium py-1 px-2.5"
                  >
                    {disciplina.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant={isEditing ? "destructive" : "default"}
            size="sm"
            className={`transition-all duration-200 shadow-sm ${
              isEditing ? "bg-red-500/90 hover:bg-red-500" : "bg-primary/90 hover:bg-primary"
            }`}
            onClick={handleEditToggle}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" /> Editar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  )
}
