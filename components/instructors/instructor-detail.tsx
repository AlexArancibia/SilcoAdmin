import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Instructor } from "@/types/schema";
 

interface InstructorDetailProps {
  instructor: Instructor;
}

export function InstructorDetail({ instructor }: InstructorDetailProps) {
  // Asegurar valores predeterminados para evitar errores
  const disciplinas = instructor.disciplinas?.map(d => d.nombre) || [];
  const fechaCreacion = instructor.createdAt ? new Date(instructor.createdAt).toLocaleDateString() : "N/A";
  const ultimoAcceso = instructor.updatedAt ? new Date(instructor.updatedAt).toLocaleDateString() : "N/A";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Información del Instructor</CardTitle>
        <CardDescription>Detalles personales y profesionales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={instructor.extrainfo?.foto || "/placeholder.svg?height=96&width=96"} alt={instructor.nombre} />
              <AvatarFallback className="text-lg">{instructor.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
              <p className="text-base font-medium text-foreground">{instructor.nombre}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Teléfono</h3>
              <p className="text-base font-medium text-foreground">{instructor.extrainfo?.telefono || "No disponible"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Estudio</h3>
              <p className="text-base font-medium text-foreground">{instructor.clases?.[0]?.estudio || "No asignado"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Disciplinas</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {disciplinas.length > 0 ? (
                  disciplinas.map((disciplina, index) => (
                    <Badge key={index} variant="outline" className="bg-muted">
                      {disciplina}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No hay disciplinas asignadas</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Fecha de registro</h3>
              <p className="text-base font-medium text-foreground">{fechaCreacion}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Último acceso</h3>
              <p className="text-base font-medium text-foreground">{ultimoAcceso}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
