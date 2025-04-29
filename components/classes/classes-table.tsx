"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useClasesStore } from "@/store/useClasesStore"
import type { Clase } from "@/types/schema"
import { format, addHours } from "date-fns"
import { es } from "date-fns/locale"
import { Edit, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { EditClassDialog } from "@/components/dialogs/edit-class-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface ClassesTableProps {
  periodoId?: number
  instructorId?: number
  disciplinaId?: number
  semana?: number
  estudio?: string
}

export function ClassesTable({ periodoId, instructorId, disciplinaId, semana, estudio }: ClassesTableProps) {
  const { toast } = useToast()
  const { clases, isLoading, error, fetchClases, eliminarClase } = useClasesStore()
  const [filteredClases, setFilteredClases] = useState<Clase[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    fetchClases({ periodoId, instructorId, disciplinaId, semana, estudio })
  }, [fetchClases, periodoId, instructorId, disciplinaId, semana, estudio])

  // Filtrar las clases en el cliente en lugar de volver a cargarlas
  useEffect(() => {
    setFilteredClases([...clases])
    setCurrentPage(1) // Reset to first page when filters change
  }, [clases])

  const formatDate = (date: Date) => {
    // Añadir 5 horas para mostrar en la tabla
    const adjustedDate = addHours(new Date(date), 5)
    return format(adjustedDate, "EEEE d MMMM, yyyy", { locale: es })
  }

  const formatTime = (date: Date) => {
    // Añadir 5 horas para mostrar en la tabla
    const adjustedDate = addHours(new Date(date), 5)
    return format(adjustedDate, "HH:mm", { locale: es })
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredClases.length / itemsPerPage)
  const paginatedClases = filteredClases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Función para generar páginas visibles con ellipsis cuando sea necesario
  const getVisiblePages = () => {
    const delta = 2 // Número de páginas a mostrar a cada lado de la página actual
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i)
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push("...")
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  const handleEditClass = (classId: string) => {
    setEditingClassId(classId)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClass = (classId: string) => {
    setDeletingClassId(classId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!deletingClassId) return

    setIsDeleting(true)
    try {
      await eliminarClase(deletingClassId)
      toast({
        title: "Clase eliminada",
        description: "La clase se ha eliminado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la clase",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeletingClassId(null)
    }
  }

  const handleClassSaved = (updatedClass: Clase) => {
    // La clase ya se actualizó en el store, solo necesitamos cerrar el diálogo
    setIsEditDialogOpen(false)
    setEditingClassId(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clases</CardTitle>
          <CardDescription>Cargando clases...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>No se pudieron cargar las clases</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <Button onClick={() => fetchClases()} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (filteredClases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clases</CardTitle>
          <CardDescription>No hay clases para mostrar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No se encontraron clases con los filtros seleccionados.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clases</CardTitle>
            <CardDescription>Mostrando {filteredClases.length} clases</CardDescription>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)}>Nueva clase</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Estudio</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClases.map((clase) => (
                <TableRow key={clase.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{clase.id}</TableCell>
                  <TableCell className="font-medium">{formatDate(clase.fecha)}</TableCell>
                  <TableCell>{formatTime(clase.fecha)}</TableCell>
                  <TableCell>{clase.instructor?.nombre}</TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: clase.disciplina?.color ? `${clase.disciplina.color}33` : "#88888833", // 20% de opacidad
                        color: "#555",
                        borderColor: clase.disciplina?.color ? `${clase.disciplina.color}80` : "#88888880", // 50% de opacidad
                        borderWidth: "1px",
                      }}
                    >
                      {clase.disciplina?.nombre}
                    </Badge>
                  </TableCell>
                  <TableCell>{clase.estudio}</TableCell>
                  <TableCell>{clase.salon}</TableCell>
                  <TableCell>
                    {clase.ciudad}, {clase.pais}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-[100px]">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{
                            width: `${Math.min((clase.reservasTotales / clase.lugares) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs whitespace-nowrap">
                        {clase.reservasTotales} / {clase.lugares}
                        {clase.listasEspera > 0 && <span className="ml-1 text-amber-500">(+{clase.listasEspera})</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClass(clase.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar clase
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClass(clase.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar clase
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) setCurrentPage(currentPage - 1)
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {getVisiblePages().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <span className="mx-1 px-2">...</span>
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(Number(page))
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {/* Diálogo de edición de clase */}
          <EditClassDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false)
              setEditingClassId(null)
            }}
            classId={editingClassId}
            onSaved={handleClassSaved}
            periodoId={periodoId}
            instructorId={instructorId}
            disciplinaId={disciplinaId}
          />
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta clase?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La clase será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
