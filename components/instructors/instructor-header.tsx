"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PeriodSelector } from "@/components/period-selector"
import { Edit, Phone, Star, X } from "lucide-react"
import type { Instructor } from "@/types/schema"

interface InstructorHeaderProps {
  instructor: Instructor | null
  isEditing: boolean
  handleEditToggle: () => void
}

export function InstructorHeader({ instructor, isEditing, handleEditToggle }: InstructorHeaderProps) {
  if (!instructor) return null

  const telefono = instructor?.extrainfo?.telefono || "No disponible"
  const especialidad = instructor?.extrainfo?.especialidad || "No especificada"
  const estado = instructor?.extrainfo?.activo ? "activo" : "inactivo"
  const foto = instructor?.extrainfo?.foto
  const disciplinasInstructor = instructor?.disciplinas || []

  return (
    <div className="bg-card rounded-xl p-5 border shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-primary/10">
         
            <AvatarFallback className="text-lg font-bold bg-primary/5">
              {instructor?.nombre?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="heading-1 ">{instructor?.nombre}</h1>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEditToggle}>
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </div>
 
            <div className="flex flex-wrap gap-1.5 mt-2">
              {disciplinasInstructor.map((disciplina) => (
                <Badge key={disciplina.id} variant="outline" className="text-primary bg-primary/5 text-xs">
                  {disciplina.nombre}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="md:self-start mt-2 md:mt-0">
          <PeriodSelector />
        </div>
      </div>
    </div>
  )
}
