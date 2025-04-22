import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Info, Clock, AlertTriangle } from "lucide-react"
import type { Clase, Disciplina, PagoInstructor } from "@/types/schema"
import { esHorarioNoPrime } from "@/utils/config"

interface ClassesTabProps {
  clasesInstructor: Clase[]
  pagoSeleccionado: PagoInstructor
  disciplinas: Disciplina[]
  formatCurrency: (amount: number) => string
}

export function ClassesTab({ clasesInstructor, pagoSeleccionado, disciplinas, formatCurrency }: ClassesTabProps) {
  // Función para obtener la hora de una fecha
  const obtenerHora = (fecha: any): string => {
    try {
      let hours = 0
      let minutes = 0

      if (fecha instanceof Date) {
        // Get UTC hours and minutes to avoid timezone conversion
        hours = fecha.getUTCHours()
        minutes = fecha.getUTCMinutes()
      } else {
        // If it's a string or another format, create a Date object
        const dateObj = new Date(fecha)
        if (!isNaN(dateObj.getTime())) {
          // Get UTC hours and minutes to avoid timezone conversion
          hours = dateObj.getUTCHours()
          minutes = dateObj.getUTCMinutes()
        }
      }

      // Format as HH:MM
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    } catch (error) {
      console.error("Error al obtener hora:", error)
      return "00:00"
    }
  }

  // Función para verificar si una clase es en horario no prime
  const esClaseHorarioNoPrime = (clase: Clase): boolean => {
    const hora = obtenerHora(clase.fecha)
    const estudio = clase.estudio || ""
    return esHorarioNoPrime(estudio, hora)
  }

  // Ordenar clases por estudio y luego por hora
  const clasesOrdenadas = [...clasesInstructor].sort((a, b) => {
    // Primero ordenar por estudio
    const estudioA = a.estudio || ""
    const estudioB = b.estudio || ""
    const comparacionEstudio = estudioA.localeCompare(estudioB)

    // Si los estudios son iguales, ordenar por hora
    if (comparacionEstudio === 0) {
      const horaA = obtenerHora(a.fecha)
      const horaB = obtenerHora(b.fecha)
      return horaA.localeCompare(horaB)
    }

    return comparacionEstudio
  })

  return (
    <div className="space-y-6">
      {clasesInstructor.length === 0 ? (
        <div className="text-center py-8 bg-muted/10 rounded-lg border">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No hay clases registradas</h3>
          <p className="mt-2 text-sm text-muted-foreground">El instructor no tiene clases asignadas en este periodo.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-accent/5 border-b border-border/40">
                <TableRow>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Fecha</TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Horario</TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Estudio</TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Disciplina</TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Reservas</TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Lista Espera</TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Cortesías</TableHead>
                  <TableHead className="text-accent font-medium whitespace-nowrap">Monto</TableHead>
                  <TableHead className="text-accent font-medium w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clasesOrdenadas.map((clase) => {
                  // Find class detail
                  const detalleClase = pagoSeleccionado.detalles?.clases?.find((d: any) => d.claseId === clase.id)

                  // Get the discipline
                  const disciplina = disciplinas.find((d) => d.id === clase.disciplinaId)

                  // Calculate occupancy percentage
                  const ocupacionPorcentaje = Math.round((clase.reservasTotales / clase.lugares) * 100)

                  // Determine color based on occupancy
                  const getOcupacionColor = () => {
                    if (ocupacionPorcentaje >= 80)
                      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50"
                    if (ocupacionPorcentaje >= 50)
                      return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/50"
                    return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50"
                  }

                  // Check if class is in non-prime hour
                  const esNoPrime = esClaseHorarioNoPrime(clase)
                  const hora = obtenerHora(clase.fecha)

                  return (
                    <TableRow key={clase.id} className="hover:bg-muted/5 transition-colors border-b border-border/30">
                      <TableCell className="font-medium whitespace-nowrap text-foreground">
                        {new Date(clase.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{hora}</span>
                          {esNoPrime && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 ml-1 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              No Prime
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground">{clase.estudio}</span>
                          <span className="text-xs text-muted-foreground">{clase.salon}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/20 font-medium"
                          style={{
                            backgroundColor: disciplina?.color ? `${disciplina.color}15` : undefined,
                            color: disciplina?.color || undefined,
                            borderColor: disciplina?.color ? `${disciplina.color}30` : undefined,
                          }}
                        >
                          {disciplina?.nombre || `Disciplina ${clase.disciplinaId}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="relative w-full max-w-[100px] bg-border rounded-full h-3 mr-2 overflow-hidden">
                            <div
                              className={`absolute top-0 left-0 h-full ${
                                ocupacionPorcentaje >= 80
                                  ? "bg-green-500"
                                  : ocupacionPorcentaje >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(ocupacionPorcentaje, 100)}%` }}
                            >
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white">
                                {ocupacionPorcentaje}%
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getOcupacionColor()}`}>
                            {clase.reservasTotales}/{clase.lugares}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {clase.listasEspera > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
                          >
                            {clase.listasEspera}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {clase.cortesias > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                          >
                            {clase.cortesias}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {detalleClase ? formatCurrency(detalleClase.montoCalculado) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted/10">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
