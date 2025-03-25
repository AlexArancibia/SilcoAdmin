"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { User, Phone, Mail, Calendar, Edit, CheckCircle2, Dumbbell } from "lucide-react"

// Define una interfaz InstructorExtraInfo simplificada con solo correo y teléfono
interface InstructorExtraInfo {
  telefono?: string
  correo?: string
  [key: string]: any // Para cualquier otra propiedad que pueda tener
}

// Mapa de colores para las disciplinas conocidas
const DISCIPLINA_COLORS: Record<string, string> = {
  Siclo: "#FF5A5F",
  Ejercito: "#0A2463",
  Barre: "#8A4FFF",
  Yoga: "#00A699",
}

// Función para obtener el color de una disciplina
const getDisciplinaColor = (disciplina: any): string => {
  // Si la disciplina tiene un color definido, usarlo
  if (disciplina?.color) {
    return disciplina.color
  }

  // Si no, usar el mapa de colores predefinidos
  const nombreDisciplina = disciplina?.nombre || ""
  const normalizedName = nombreDisciplina.trim().toLowerCase()

  // Buscar coincidencias en el mapa de colores (insensible a mayúsculas/minúsculas)
  for (const [key, value] of Object.entries(DISCIPLINA_COLORS)) {
    if (key.toLowerCase() === normalizedName) {
      return value
    }
  }

  // Color por defecto si no se encuentra la disciplina
  return "#888888"
}

// Actualizar la interfaz InstructorProfileProps para aceptar cualquier tipo de extrainfo
interface InstructorProfileProps {
  instructor: {
    id: number
    nombre: string
    extrainfo?: any // Cambiar a any para aceptar cualquier tipo de Json
    createdAt?: Date
    disciplinas?: {
      id: number
      disciplinaId: number
      disciplina?: {
        id: number
        nombre: string
        color?: string
      }
    }[]
  }
}

export function InstructorProfile({ instructor }: InstructorProfileProps) {
  const [isEditing, setIsEditing] = useState(false)

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Formatear fecha
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "N/A"
    return format(new Date(date), "dd MMMM, yyyy", { locale: es })
  }

  // Verificar si el instructor está activo (simplificado ya que no usamos estado/activo)
  const isActive = true // Por defecto asumimos que está activo

  return (
    <Card className="h-full">
      <CardHeader className="relative pb-2">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="h-8 w-8">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar perfil</span>
          </Button>
        </div>
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-xl">{getInitials(instructor.nombre)}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-4 text-center">{instructor.nombre}</CardTitle>
          <CardDescription className="text-center">Instructor</CardDescription>
          <div className="mt-2">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Activo
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Información de contacto</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>ID: {instructor.id}</span>
            </div>
            {instructor.extrainfo?.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{instructor.extrainfo.telefono}</span>
              </div>
            )}
            {instructor.extrainfo?.correo && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{instructor.extrainfo.correo}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Registro: {formatDate(instructor.createdAt)}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Disciplinas</h3>
          <div className="flex flex-wrap gap-1">
            {instructor.disciplinas && instructor.disciplinas.length > 0 ? (
              instructor.disciplinas.map((disciplina) => {
                const disciplinaNombre = disciplina.disciplina?.nombre || `Disciplina ${disciplina.disciplinaId}`
                const color = getDisciplinaColor(disciplina.disciplina)

                return (
                  <Badge
                    key={disciplina.id}
                    style={{
                      backgroundColor: color,
                      color: "#fff",
                    }}
                    className="flex items-center gap-1"
                  >
                    <Dumbbell className="h-3 w-3" />
                    {disciplinaNombre}
                  </Badge>
                )
              })
            ) : (
              <span className="text-sm text-muted-foreground">No hay disciplinas asignadas</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          Ver historial completo
        </Button>
        <Button size="sm">Editar perfil</Button>
      </CardFooter>
    </Card>
  )
}

