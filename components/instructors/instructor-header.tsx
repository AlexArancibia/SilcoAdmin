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

  const disciplinasInstructor = instructor?.disciplinas || []

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-card to-card/80 rounded-xl border shadow-sm">
      {/* Decorative elements - reducidos para móvil */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl md:w-32 md:h-32 md:blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-lg md:w-24 md:h-24 md:blur-xl"></div>

      <div className="relative p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-sm"></div>
              <Avatar className="h-16 w-16 border-2 border-background shadow-md relative md:h-20 md:w-20">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/30 to-primary/10 text-primary-foreground md:text-xl">
                  {instructor?.nombre?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {instructor?.activo && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full shadow-sm">
                  <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate md:text-2xl">{instructor?.nombre}</h1>
              <div className="flex flex-wrap gap-1 mt-2 overflow-x-auto py-1 -mx-1 px-1 md:mt-3">
                {disciplinasInstructor.map((disciplina) => (
                  <Badge
                    key={disciplina.id}
                    variant="outline"
                    className="bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-medium py-1 px-2"
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
            className={`transition-all duration-200 shadow-sm mt-2 self-end md:mt-0 md:self-auto ${
              isEditing ? "bg-red-500/90 hover:bg-red-500" : "bg-primary/90 hover:bg-primary"
            }`}
            onClick={handleEditToggle}
          >
            {isEditing ? (
              <>
                <X className="h-3.5 w-3.5 mr-1.5 md:h-4 md:w-4 md:mr-2" /> 
                <span className="text-xs md:text-sm">Cancelar</span>
              </>
            ) : (
              <>
                <Edit className="h-3.5 w-3.5 mr-1.5 md:h-4 md:w-4 md:mr-2" /> 
                <span className="text-xs md:text-sm">Editar</span>
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