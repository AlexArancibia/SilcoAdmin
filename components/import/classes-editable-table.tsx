"use client"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DateTimeValidator } from "./date-time-validator"
import type { TablaClasesEditable, ClaseEditable } from "@/types/importacion"

interface ClassesEditableTableProps {
  tablaClases: TablaClasesEditable
  disciplinas: Array<{ id: number; nombre: string }>
  instructores: Array<{ id: number; nombre: string }>
  onEditClase: (claseId: string, campo: string, valor: any) => void
  onToggleEliminar: (claseId: string) => void
}

export function ClassesEditableTable({ 
  tablaClases, 
  disciplinas, 
  instructores, 
  onEditClase, 
  onToggleEliminar 
}: ClassesEditableTableProps) {
  const [unlockedInstructors, setUnlockedInstructors] = useState<Set<string>>(new Set())
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set())

  const toggleInstructorLock = (claseId: string) => {
    setUnlockedInstructors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(claseId)) {
        newSet.delete(claseId)
      } else {
        newSet.add(claseId)
      }
      return newSet
    })
  }

  const toggleEditingCell = (claseId: string) => {
    setEditingCells(prev => {
      const newSet = new Set(prev)
      if (newSet.has(claseId)) {
        newSet.delete(claseId)
      } else {
        newSet.add(claseId)
      }
      return newSet
    })
  }

  const handleDelete = (claseId: string) => {
    onToggleEliminar(claseId)
  }

  // Función para generar colores sutiles basados en el instructor VS
  const getVSGroupColor = (clase: ClaseEditable) => {
    if (!clase.esInstructorVS || !clase.instructoresVS) return ""
    
    // Crear un hash simple del instructor VS para generar colores consistentes
    const hash = clase.instructoresVS.join('').split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff
      return a
    }, 0)
    
    // Generar colores sutiles basados en el hash
    const hue = Math.abs(hash) % 360
    const saturation = 15 + (Math.abs(hash) % 10) // 15-25%
    const lightness = 95 + (Math.abs(hash) % 5)   // 95-100%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  const clasesFiltradas = tablaClases.clases.filter(clase => !clase.eliminada)
  const clasesNormales = clasesFiltradas.filter(clase => !clase.esInstructorVS)
  const clasesVS = clasesFiltradas.filter(clase => clase.esInstructorVS)

  const renderTable = (clases: ClaseEditable[], title: string) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <Badge variant="secondary">{clases.length} clases</Badge>
      </div>
      
      {clases.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="w-32">Instructor</TableHead>
                <TableHead className="w-28">Disciplina</TableHead>
                <TableHead className="w-20">Estudio</TableHead>
                <TableHead className="w-20">Salón</TableHead>
                <TableHead className="w-32">Fecha y Hora</TableHead>
                <TableHead className="w-12">Sem</TableHead>
                <TableHead className="w-16">Reservas</TableHead>
                <TableHead className="w-16">Lugares</TableHead>
                <TableHead className="w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clases.map((clase) => {
                const isInstructorUnlocked = unlockedInstructors.has(clase.id)
                const isEditing = editingCells.has(clase.id)
                const vsGroupColor = getVSGroupColor(clase)
                
                return (
                  <TableRow 
                    key={clase.id}
                    style={{ backgroundColor: vsGroupColor }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="text-xs font-mono bg-muted/20 px-1 py-1 rounded">
                      {clase.id}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {!clase.instructorExiste && !isInstructorUnlocked ? (
                          // Instructor nuevo - input bloqueado con opción de desbloquear
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Input
                                value={clase.instructorEditado || clase.instructor}
                                onChange={(e) => onEditClase(clase.id, "instructorEditado", e.target.value)}
                                disabled={true}
                                className="h-7 w-28 text-xs"
                                placeholder="Nombre instructor"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleInstructorLock(clase.id)}
                                className="h-7 w-7 p-0"
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                              <span className="text-xs text-red-600 font-medium">Nuevo</span>
                            </div>
                          </div>
                        ) : (
                          // Instructor existente O instructor nuevo desbloqueado - selector normal
                          <div className="space-y-1">
                            <Select
                              value={clase.instructorEditado || clase.instructor}
                              onValueChange={(valor) => onEditClase(clase.id, "instructorEditado", valor)}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {instructores.map((instructor) => (
                                  <SelectItem key={instructor.id} value={instructor.nombre}>
                                    {instructor.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!clase.instructorExiste && isInstructorUnlocked && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleInstructorLock(clase.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Unlock className="h-3 w-3" />
                                </Button>
                                <span className="text-xs text-orange-600 font-medium">Editable</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={clase.disciplinaEditada || clase.mapeoDisciplina || ""}
                        onValueChange={(valor) => onEditClase(clase.id, "disciplinaEditada", valor)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue placeholder="Mapear" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplinas.map((disciplina) => (
                            <SelectItem key={disciplina.id} value={disciplina.nombre}>
                              {disciplina.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">
                      {isEditing ? (
                        <Input
                          value={clase.estudioEditado || clase.estudio}
                          onChange={(e) => onEditClase(clase.id, "estudioEditado", e.target.value)}
                          className="h-7 w-16 text-xs"
                        />
                      ) : (
                        clase.estudioEditado || clase.estudio
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isEditing ? (
                        <Input
                          value={clase.salonEditado || clase.salon}
                          onChange={(e) => onEditClase(clase.id, "salonEditado", e.target.value)}
                          className="h-7 w-16 text-xs"
                        />
                      ) : (
                        clase.salonEditado || clase.salon
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isEditing ? (
                        <DateTimeValidator
                          dia={clase.diaEditado || clase.dia}
                          hora={clase.horaEditada || clase.hora}
                          onDiaChange={(valor) => onEditClase(clase.id, "diaEditado", valor)}
                          onHoraChange={(valor) => onEditClase(clase.id, "horaEditada", valor)}
                          className="min-w-[280px]"
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium">
                            {clase.diaEditado || clase.dia}
                          </div>
                          <div className="text-muted-foreground">
                            {clase.horaEditada || clase.hora}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {clase.semana}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">T: {clase.reservasTotales}</div>
                        <div className="text-xs text-muted-foreground">P: {clase.reservasPagadas}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">L: {clase.lugares}</div>
                        <div className="text-xs text-muted-foreground">E: {clase.listasEspera}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleEditingCell(clase.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {isEditing ? "Desactivar edición" : "Editar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(clase.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No hay {title.toLowerCase()} para mostrar
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Clases a Importar</h2>
        <p className="text-sm text-muted-foreground">
          Revisa y edita las clases antes de procesar la importación
        </p>
      </div>
      
      <Tabs defaultValue="normales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="normales">
            Clases Normales ({clasesNormales.length})
          </TabsTrigger>
          <TabsTrigger value="versus">
            Clases VS ({clasesVS.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="normales" className="mt-6">
          {renderTable(clasesNormales, "Clases Normales")}
        </TabsContent>
        
        <TabsContent value="versus" className="mt-6">
          {renderTable(clasesVS, "Clases VS")}
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• <span className="text-green-600">Verde:</span> Instructor/Disciplina existe en el sistema</p>
        <p>• <span className="text-red-600">Rojo:</span> Instructor/Disciplina nuevo o sin mapear</p>
        <p>• <span className="text-orange-600">Naranja:</span> Clase con instructores VS</p>
        <p>• <strong>Colores sutiles:</strong> Las clases VS del mismo grupo tienen el mismo color de fondo</p>
        <p>• <strong>Leyenda:</strong> T=Total, P=Pagadas, L=Lugares, E=Espera</p>
        <p>• <strong>Instructor Nuevo:</strong> Click en el candado para editar nombre</p>
        <p>• <strong>Edición:</strong> Usa el menú de 3 puntos para editar o eliminar clases</p>
      </div>
    </div>
  )
}
