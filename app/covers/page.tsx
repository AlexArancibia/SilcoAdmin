'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Componentes UI
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronsUpDown
} from 'lucide-react'

// Stores
import { useCoversStore } from '@/store/useCoverStore'
import { useInstructoresStore } from '@/store/useInstructoresStore'
import { usePeriodosStore } from '@/store/usePeriodosStore'
import { useDisciplinasStore } from '@/store/useDisciplinasStore'
import { useClasesStore } from '@/store/useClasesStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { Cover, StatusCover } from '@/types/schema'

export default function CoversPage() {
  const { toast } = useToast()

  // Stores
  const {
    covers,
    pagination,
    coverSeleccionado,
    fetchCovers,
    fetchMisReemplazos,
    crearCover,
    updateCoverJustificacion,
    updateCoverPayments,
    enlazarCoverConClase,
    actualizarCover,
    eliminarCover,
    setCoverSeleccionado,
    searchCovers,
    fetchCoversByJustificacion,
    fetchCoversByPeriodo,
    isLoading,
    error,
  } = useCoversStore()

  const { instructores, fetchInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()
  const { clases, fetchClases, isLoading: isLoadingClases } = useClasesStore()
  const { user } = useAuthStore()

  // Estados
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | 'all'>('all')
  const [selectedJustificacion, setSelectedJustificacion] = useState<StatusCover | 'all'>('all')
  
  // Estados para el buscador de clases
  const [openCreateClaseSearch, setOpenCreateClaseSearch] = useState(false)
  const [openEditClaseSearch, setOpenEditClaseSearch] = useState(false)
  
  // Diálogos
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isJustificacionDialogOpen, setIsJustificacionDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
        // Formularios
   const [createForm, setCreateForm] = useState({
     instructorOriginalId: 0,
     disciplinaId: 0,
     periodoId: 0,
     fecha: '',
     hora: '',
     claseId: '',
     comentarios: '',
     cambioDeNombre: '',
   })
  
     const [editForm, setEditForm] = useState({
     instructorOriginalId: 0,
     instructorReemplazoId: 0,
     disciplinaId: 0,
     periodoId: 0,
     fecha: '',
     hora: '',
     claseId: '',
     justificacion: 'PENDIENTE' as StatusCover,
     pagoBono: false,
     pagoFullHouse: false,
     comentarios: '',
     cambioDeNombre: '',
   })
  
  const [justificacionForm, setJustificacionForm] = useState({
    justificacion: 'PENDIENTE' as StatusCover,
    comentarios: '',
  })

  // Determinar si es instructor
  const { userType } = useAuthStore()
  const isInstructor = userType === 'instructor'
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user?.rol || '')
 

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchInstructores(),
          fetchPeriodos(),
          fetchDisciplinas(),
        ])
        
        // Cargar covers según el rol
        if (isInstructor && user?.id) {
          await fetchMisReemplazos(user.id)
        } else {
          await fetchCovers()
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al cargar los datos iniciales',
          variant: 'destructive',
        })
      }
    }
    loadData()
  }, [fetchInstructores, fetchPeriodos, fetchDisciplinas, fetchCovers, fetchMisReemplazos, isInstructor, user?.id, toast])

  // Cargar clases cuando se selecciona un periodo
  useEffect(() => {
    if (selectedPeriodo !== 'all' && typeof selectedPeriodo === 'number') {
      fetchClases({ periodoId: selectedPeriodo })
    }
  }, [selectedPeriodo, fetchClases])

  // Limpiar campo de clase cuando se cambia el periodo en el formulario de creación
  useEffect(() => {
    if (createForm.periodoId !== selectedPeriodo) {
      setCreateForm(prev => ({ ...prev, claseId: '' }))
      setOpenCreateClaseSearch(false)
    }
  }, [selectedPeriodo, createForm.periodoId])



  // Limpiar campo de clase cuando se cambia el periodo en el formulario de edición
  useEffect(() => {
    if (editForm.periodoId && editForm.periodoId !== selectedPeriodo) {
      setEditForm(prev => ({ ...prev, claseId: '' }))
      setOpenEditClaseSearch(false)
    }
  }, [selectedPeriodo, editForm.periodoId])

  // Limpiar checkbox de Full House cuando se desenlaza una clase
  useEffect(() => {
    if (!editForm.claseId && editForm.pagoFullHouse) {
      setEditForm(prev => ({ ...prev, pagoFullHouse: false }))
    }
  }, [editForm.claseId, editForm.pagoFullHouse])

  // Filtros
  const handleSearch = useCallback(async () => {
    if (isInstructor && user?.id) {
      await fetchMisReemplazos(user.id, {
        busqueda: searchTerm || undefined,
        periodoId: selectedPeriodo !== 'all' ? selectedPeriodo : undefined,
        justificacion: selectedJustificacion !== 'all' ? selectedJustificacion : undefined,
      })
    } else {
      await fetchCovers({
        busqueda: searchTerm || undefined,
        periodoId: selectedPeriodo !== 'all' ? selectedPeriodo : undefined,
        justificacion: selectedJustificacion !== 'all' ? selectedJustificacion : undefined,
      })
    }
  }, [searchTerm, selectedPeriodo, selectedJustificacion, isInstructor, user?.id, fetchMisReemplazos, fetchCovers])

  useEffect(() => {
    handleSearch()
  }, [selectedPeriodo, selectedJustificacion, handleSearch])

  // Handlers para formularios
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      await crearCover({
        instructorOriginalId: createForm.instructorOriginalId,
        instructorReemplazoId: user.id,
        disciplinaId: createForm.disciplinaId,
        periodoId: createForm.periodoId,
        fecha: new Date(createForm.fecha),
        hora: createForm.hora,
        claseId: createForm.claseId || undefined,
        comentarios: createForm.comentarios || undefined,
        cambioDeNombre: createForm.cambioDeNombre || undefined,
      })
      
      toast({
        title: 'Cover creado',
        description: 'El cover se ha creado correctamente.',
      })
      
      setIsCreateDialogOpen(false)
      resetCreateForm()
      handleSearch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear el cover',
        variant: 'destructive',
      })
    }
  }

  const handleJustificacionSubmit = async () => {
    if (!coverSeleccionado) return

    try {
      await updateCoverJustificacion(
        coverSeleccionado.id,
        justificacionForm.justificacion,
        justificacionForm.comentarios || undefined
      )
      
      toast({
        title: 'Justificación actualizada',
        description: `Cover ${justificacionForm.justificacion.toLowerCase()} correctamente.`,
      })
      
      setIsJustificacionDialogOpen(false)
      handleSearch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar la justificación',
        variant: 'destructive',
      })
    }
  }

     const handleEditSubmit = async () => {
     if (!coverSeleccionado) return

     try {
       await actualizarCover(coverSeleccionado.id, {
         ...editForm,
         fecha: editForm.fecha ? new Date(editForm.fecha) : undefined,
         claseId: editForm.claseId || undefined,
         comentarios: editForm.comentarios || undefined,
         cambioDeNombre: editForm.cambioDeNombre || undefined,
       })
      
      toast({
        title: 'Cover actualizado',
        description: 'Los cambios se han guardado correctamente.',
      })
      
      setIsEditDialogOpen(false)
      handleSearch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al actualizar el cover',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!coverSeleccionado) return

    try {
      await eliminarCover(coverSeleccionado.id)
      toast({
        title: 'Cover eliminado',
        description: 'El cover se ha eliminado correctamente.',
      })
      setIsDeleteDialogOpen(false)
      handleSearch()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar el cover',
        variant: 'destructive',
      })
    }
  }

  // Funciones auxiliares
  const resetCreateForm = () => {
    setCreateForm({
      instructorOriginalId: 0,
      disciplinaId: 0,
      periodoId: 0,
      fecha: '',
      hora: '',
      claseId: '',
      comentarios: '',
      cambioDeNombre: '',
    })
    setOpenCreateClaseSearch(false)
  }

     const openEditDialog = async (cover: Cover) => {
     setCoverSeleccionado(cover)
     setEditForm({
       instructorOriginalId: cover.instructorOriginalId,
       instructorReemplazoId: cover.instructorReemplazoId,
       disciplinaId: cover.disciplinaId,
       periodoId: cover.periodoId,
       fecha: format(new Date(cover.fecha), 'yyyy-MM-dd'),
       hora: cover.hora,
       claseId: cover.claseId || '',
       justificacion: cover.justificacion || 'PENDIENTE',
       pagoBono: cover.pagoBono || false,
       pagoFullHouse: cover.pagoFullHouse || false,
       comentarios: cover.comentarios || '',
       cambioDeNombre: cover.cambioDeNombre || '',
     })
     
     // Cargar clases del periodo si no están cargadas
     if (cover.periodoId && !clases.some(c => c.periodoId === cover.periodoId)) {
       await fetchClases({ periodoId: cover.periodoId })
     }
     
     setIsEditDialogOpen(true)
   }

  const openJustificacionDialog = (cover: Cover) => {
    setCoverSeleccionado(cover)
    setJustificacionForm({
      justificacion: cover.justificacion || 'PENDIENTE',
      comentarios: cover.comentarios || '',
    })
    setIsJustificacionDialogOpen(true)
  }

  const getInstructorName = (id: number) => {
    const instructor = instructores.find(i => i.id === id)
    return instructor ? instructor.nombre : `ID: ${id}`
  }

  const getDisciplinaName = (id: number) => {
    const disciplina = disciplinas.find(d => d.id === id)
    return disciplina ? disciplina.nombre : `ID: ${id}`
  }

  const getPeriodoLabel = (id: number) => {
    const periodo = periodos.find(p => p.id === id)
    return periodo ? `P${periodo.numero}-${periodo.año}` : `ID: ${id}`
  }

  // Función para obtener información de una clase por ID
  const getClaseInfo = (claseId: string) => {
    return clases.find(clase => clase.id.toString() === claseId)
  }

  // Función para obtener el texto de la clase seleccionada
  const getClaseDisplayText = (claseId: string) => {
    const clase = getClaseInfo(claseId)
    if (!clase) return 'Seleccionar clase...'
    
    const instructor = instructores.find(i => i.id === clase.instructorId)
    const disciplina = disciplinas.find(d => d.id === clase.disciplinaId)
    
    return `ID: ${clase.id} - ${instructor?.nombre || 'Sin instructor'} - ${disciplina?.nombre || 'Sin disciplina'}`
  }

  const getJustificacionBadge = (justificacion: StatusCover) => {
    const configs = {
      PENDIENTE: { variant: 'outline' as const, icon: AlertCircle, color: 'text-yellow-600' },
      APROBADO: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      RECHAZADO: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    }
    
    const config = configs[justificacion] || configs.PENDIENTE
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {justificacion}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Covers</h1>
                     <p className="text-muted-foreground">
             {isInstructor 
               ? 'Crea y gestiona los covers que has realizado como instructor reemplazo' 
               : 'Administra todos los covers del sistema - aprueba, edita pagos y gestiona justificaciones'
             }
           </p>
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cover
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar covers..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <Select 
              value={selectedPeriodo.toString()} 
              onValueChange={(value) => setSelectedPeriodo(value === 'all' ? 'all' : parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los períodos</SelectItem>
                {periodos.map(periodo => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    P{periodo.numero}-{periodo.año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedJustificacion} 
              onValueChange={(value) => setSelectedJustificacion(value as StatusCover | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="APROBADO">Aprobado</SelectItem>
                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
                                                   <TableHeader>
                <TableRow>
                  <TableHead>Instructor Original</TableHead>
                  <TableHead>Instructor Reemplazo</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago Bono S/80</TableHead>
                  <TableHead>Pago Full House</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {covers.map((cover) => (
                <TableRow key={cover.id}>
                                     <TableCell className="font-medium">
                     {getInstructorName(cover.instructorOriginalId)}
                   </TableCell>
                   <TableCell className="font-medium">
                     <span className="text-blue-600 dark:text-blue-400">
                       {getInstructorName(cover.instructorReemplazoId)}
                     </span>
                   </TableCell>
                   <TableCell>
                     <Badge variant="outline">
                       {getDisciplinaName(cover.disciplinaId)}
                     </Badge>
                   </TableCell>
                                     <TableCell>
                     <div className="flex items-center gap-1">
                       <CalendarIcon className="h-3 w-3" />
                       {format(new Date(cover.fecha), 'dd/MM/yyyy', { locale: es })}
                     </div>
                   </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {cover.hora}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getPeriodoLabel(cover.periodoId)}
                    </Badge>
                  </TableCell>
                                     <TableCell>
                     {getJustificacionBadge(cover.justificacion)}
                   </TableCell>
                   
                   {/* Pago Bono S/80 */}
                   <TableCell className="text-center">
                     {cover.justificacion === 'PENDIENTE' ? (
                       <Badge variant="outline" className="text-xs">Pendiente</Badge>
                     ) : cover.pagoBono ? (
                       <Badge variant="default" className="text-xs bg-green-600">S/80</Badge>
                     ) : (
                       <Badge variant="outline" className="text-xs">No</Badge>
                     )}
                   </TableCell>
                   
                   {/* Pago Full House */}
                   <TableCell className="text-center">
                     {cover.justificacion === 'PENDIENTE' ? (
                       <Badge variant="outline" className="text-xs">Pendiente</Badge>
                     ) : cover.pagoFullHouse ? (
                       <Badge variant="default" className="text-xs bg-blue-600">Full House</Badge>
                     ) : (
                       <Badge variant="outline" className="text-xs">No</Badge>
                     )}
                   </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                                                 <DropdownMenuItem
                           onClick={() => {
                             setCoverSeleccionado(cover)
                             setIsViewDialogOpen(true)
                           }}
                         >
                           <Eye className="mr-2 h-4 w-4" />
                           Ver detalles
                         </DropdownMenuItem>
                         
                         {(isAdmin || (isInstructor && user?.id === cover.instructorReemplazoId)) && (
                           <>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => openEditDialog(cover)}>
                               <Edit className="mr-2 h-4 w-4" />
                               Editar
                             </DropdownMenuItem>
                             
                             {/* Solo admins pueden cambiar justificación */}
                             {isAdmin && (
                               <DropdownMenuItem onClick={() => openJustificacionDialog(cover)}>
                                 <CheckCircle className="mr-2 h-4 w-4" />
                                 Cambiar justificación
                               </DropdownMenuItem>
                             )}
                             
                             <DropdownMenuSeparator />
                             <DropdownMenuItem
                               onClick={() => {
                                 setCoverSeleccionado(cover)
                                 setIsDeleteDialogOpen(true)
                               }}
                               className="text-red-600"
                             >
                               <Trash2 className="mr-2 h-4 w-4" />
                               Eliminar
                             </DropdownMenuItem>
                           </>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {covers.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron covers</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.hasPrev}
            onClick={() => handleSearch()}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNext}
            onClick={() => handleSearch()}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Dialog: Crear Cover */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Cover</DialogTitle>
            <DialogDescription>
              Registra un cover que has realizado
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="instructorOriginal">Instructor Original</Label>
              <Select
                value={createForm.instructorOriginalId.toString()}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, instructorOriginalId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructores.map(instructor => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="disciplina">Disciplina</Label>
              <Select
                value={createForm.disciplinaId.toString()}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, disciplinaId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map(disciplina => (
                    <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                      {disciplina.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select
                value={createForm.periodoId.toString()}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, periodoId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(periodo => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      P{periodo.numero}-{periodo.año}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                         <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="fecha">Fecha</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className="w-full justify-start text-left font-normal"
                     >
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {createForm.fecha ? format(new Date(createForm.fecha), 'dd/MM/yyyy', { locale: es }) : 'Selecciona fecha'}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={createForm.fecha ? new Date(createForm.fecha) : undefined}
                       onSelect={(date) => {
                         if (date) {
                           setCreateForm(prev => ({ 
                             ...prev, 
                             fecha: format(date, 'yyyy-MM-dd') 
                           }))
                         }
                       }}
                       disabled={(date) => date < new Date('1900-01-01')}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
               <div>
                 <Label htmlFor="hora">Hora</Label>
                 <Input
                   type="time"
                   value={createForm.hora}
                   onChange={(e) => setCreateForm(prev => ({ ...prev, hora: e.target.value }))}
                   required
                 />
               </div>
             </div>

            <div>
              <Label htmlFor="claseId">Clase a Enlazar (opcional)</Label>
              {selectedPeriodo !== 'all' && typeof selectedPeriodo === 'number' ? (
                <Popover open={openCreateClaseSearch} onOpenChange={setOpenCreateClaseSearch}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCreateClaseSearch}
                      className="w-full justify-between"
                      disabled={isLoadingClases}
                    >
                      {createForm.claseId ? getClaseDisplayText(createForm.claseId) : "Seleccionar clase..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar clase por ID, instructor o disciplina..." />
                      <CommandList 
                        className="max-h-[300px] overflow-y-auto"
                        onWheel={(e) => {
                          e.preventDefault()
                          const target = e.currentTarget
                          target.scrollTop += e.deltaY
                        }}
                      >
                        <CommandEmpty>
                          {isLoadingClases ? "Cargando clases..." : "No se encontraron clases en este periodo."}
                        </CommandEmpty>
                        <CommandGroup>
                          {clases.map((clase) => {
                            const instructor = instructores.find(i => i.id === clase.instructorId)
                            const disciplina = disciplinas.find(d => d.id === clase.disciplinaId)
                            return (
                              <CommandItem
                                key={clase.id}
                                value={`${clase.id} ${instructor?.nombre || ''} ${disciplina?.nombre || ''}`}
                                onSelect={() => {
                                  setCreateForm(prev => ({ ...prev, claseId: clase.id.toString() }))
                                  setOpenCreateClaseSearch(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    createForm.claseId === clase.id.toString() ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium truncate">ID: {clase.id}</span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {instructor?.nombre || 'Sin instructor'} • {disciplina?.nombre || 'Sin disciplina'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(clase.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                                  </span>
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                  Selecciona un periodo para buscar clases disponibles
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="comentarios">Comentarios (opcional)</Label>
              <Textarea
                placeholder="Comentarios adicionales..."
                value={createForm.comentarios}
                onChange={(e) => setCreateForm(prev => ({ ...prev, comentarios: e.target.value }))}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!createForm.instructorOriginalId || !createForm.disciplinaId || !createForm.periodoId || !createForm.fecha || !createForm.hora}
              >
                Crear Cover
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Detalles */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Cover</DialogTitle>
          </DialogHeader>
          
          {coverSeleccionado && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Instructor Original</Label>
                  <p className="font-medium">{getInstructorName(coverSeleccionado.instructorOriginalId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Instructor Reemplazo</Label>
                  <p className="font-medium">{getInstructorName(coverSeleccionado.instructorReemplazoId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Disciplina</Label>
                  <p className="font-medium">{getDisciplinaName(coverSeleccionado.disciplinaId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Período</Label>
                  <p className="font-medium">{getPeriodoLabel(coverSeleccionado.periodoId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                  <p className="font-medium">{format(new Date(coverSeleccionado.fecha), 'dd/MM/yyyy', { locale: es })}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Hora</Label>
                  <p className="font-medium">{coverSeleccionado.hora}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <div className="mt-1">{getJustificacionBadge(coverSeleccionado.justificacion)}</div>
                </div>
                {coverSeleccionado.claseId && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Clase Enlazada</Label>
                    <div className="mt-1">
                      <p className="font-medium">ID: {coverSeleccionado.claseId}</p>
                      {(() => {
                        const clase = getClaseInfo(coverSeleccionado.claseId)
                        if (clase) {
                          const instructor = instructores.find(i => i.id === clase.instructorId)
                          const disciplina = disciplinas.find(d => d.id === clase.disciplinaId)
                          return (
                            <div className="text-sm text-muted-foreground mt-1">
                              <p>Instructor: {instructor?.nombre || 'Sin instructor'}</p>
                              <p>Disciplina: {disciplina?.nombre || 'Sin disciplina'}</p>
                              <p>Fecha: {format(new Date(clase.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                            </div>
                          )
                        }
                        return <p className="text-sm text-muted-foreground">Clase no encontrada</p>
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Label className="text-sm font-medium text-muted-foreground">Pago S/80</Label>
                  <p className="mt-1">
                    {coverSeleccionado.pagoBono ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 mx-auto" />
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium text-muted-foreground">Pago Full House</Label>
                  <p className="mt-1">
                    {coverSeleccionado.pagoFullHouse ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 mx-auto" />
                    )}
                  </p>
                </div>
              </div>

              {(coverSeleccionado.comentarios || coverSeleccionado.cambioDeNombre) && (
                <div className="space-y-4">
                  {coverSeleccionado.cambioDeNombre && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cambio de Nombre</Label>
                      <p className="mt-1 p-3 bg-muted rounded-md">{coverSeleccionado.cambioDeNombre}</p>
                    </div>
                  )}
                  {coverSeleccionado.comentarios && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Comentarios</Label>
                      <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">{coverSeleccionado.comentarios}</p>
                    </div>
                  )}
                </div>
              )}

                             <div className="text-xs text-muted-foreground border-t pt-4">
                 <p>Creado: {coverSeleccionado.createdAt ? format(new Date(coverSeleccionado.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}</p>
                 {coverSeleccionado.updatedAt && (
                   <p>Actualizado: {format(new Date(coverSeleccionado.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                 )}
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

                           {/* Dialog: Editar Cover */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cover</DialogTitle>
              <DialogDescription>
                {isAdmin 
                  ? 'Modifica todos los campos del cover' 
                  : 'Modifica la información básica de tu cover'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instructorOriginal">Instructor Original</Label>
                  <Select
                    value={editForm.instructorOriginalId.toString()}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, instructorOriginalId: parseInt(value) }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructores.map(instructor => (
                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                          {instructor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="instructorReemplazo">Instructor Reemplazo</Label>
                  <Select
                    value={editForm.instructorReemplazoId.toString()}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, instructorReemplazoId: parseInt(value) }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructores.map(instructor => (
                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                          {instructor.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="disciplina">Disciplina</Label>
                  <Select
                    value={editForm.disciplinaId.toString()}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, disciplinaId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas.map(disciplina => (
                        <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                          {disciplina.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Select
                    value={editForm.periodoId.toString()}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, periodoId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map(periodo => (
                        <SelectItem key={periodo.id} value={periodo.id.toString()}>
                          P{periodo.numero}-{periodo.año}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editForm.fecha ? format(new Date(editForm.fecha), 'dd/MM/yyyy', { locale: es }) : 'Selecciona fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editForm.fecha ? new Date(editForm.fecha) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setEditForm(prev => ({ 
                              ...prev, 
                              fecha: format(date, 'yyyy-MM-dd') 
                            }))
                          }
                        }}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="hora">Hora</Label>
                  <Input
                    type="time"
                    value={editForm.hora}
                    onChange={(e) => setEditForm(prev => ({ ...prev, hora: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="claseId">Clase a Enlazar (opcional)</Label>
                {editForm.periodoId && editForm.periodoId !== 0 ? (
                  <Popover open={openEditClaseSearch} onOpenChange={setOpenEditClaseSearch}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openEditClaseSearch}
                        className="w-full justify-between"
                        disabled={isLoadingClases}
                      >
                        {editForm.claseId ? getClaseDisplayText(editForm.claseId) : "Seleccionar clase..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar clase por ID, instructor o disciplina..." />
                        <CommandList 
                          className="max-h-[300px] overflow-y-auto"
                          onWheel={(e) => {
                            e.preventDefault()
                            const target = e.currentTarget
                            target.scrollTop += e.deltaY
                          }}
                        >
                          <CommandEmpty>
                            {isLoadingClases ? "Cargando clases..." : "No se encontraron clases en este periodo."}
                          </CommandEmpty>
                          <CommandGroup>
                            {clases.map((clase) => {
                              const instructor = instructores.find(i => i.id === clase.instructorId)
                              const disciplina = disciplinas.find(d => d.id === clase.disciplinaId)
                              return (
                                <CommandItem
                                  key={clase.id}
                                  value={`${clase.id} ${instructor?.nombre || ''} ${disciplina?.nombre || ''}`}
                                  onSelect={() => {
                                    setEditForm(prev => ({ ...prev, claseId: clase.id.toString() }))
                                    setOpenEditClaseSearch(false)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      editForm.claseId === clase.id.toString() ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-medium truncate">ID: {clase.id}</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                      {instructor?.nombre || 'Sin instructor'} • {disciplina?.nombre || 'Sin disciplina'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(clase.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </span>
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                    Selecciona un periodo para buscar clases disponibles
                  </div>
                )}
              </div>

              {/* Campos administrativos para admins */}
              {isAdmin && (
                <>
                  <div>
                    <Label htmlFor="justificacion">Estado</Label>
                    <Select
                      value={editForm.justificacion}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, justificacion: value as StatusCover }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="APROBADO">Aprobado</SelectItem>
                        <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="pagoBono"
                        checked={editForm.pagoBono}
                        onChange={(e) => setEditForm(prev => ({ ...prev, pagoBono: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="pagoBono">Pago S/80</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="pagoFullHouse"
                        checked={editForm.pagoFullHouse}
                        onChange={(e) => setEditForm(prev => ({ ...prev, pagoFullHouse: e.target.checked }))}
                        disabled={!editForm.claseId}
                        className="rounded"
                      />
                      <Label 
                        htmlFor="pagoFullHouse" 
                        className={!editForm.claseId ? "text-muted-foreground cursor-not-allowed" : ""}
                      >
                        Pago Full House
                        {!editForm.claseId && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (requiere clase enlazada)
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="cambioDeNombre">Cambio de Nombre</Label>
                <Input
                  placeholder="Cambio de nombre..."
                  value={editForm.cambioDeNombre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, cambioDeNombre: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="comentarios">Comentarios</Label>
                <Textarea
                  placeholder={isAdmin ? "Comentarios administrativos..." : "Comentarios adicionales..."}
                  value={editForm.comentarios}
                  onChange={(e) => setEditForm(prev => ({ ...prev, comentarios: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSubmit}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Dialog: Cambiar Justificación (Solo Admin) */}
      {isAdmin && (
        <Dialog open={isJustificacionDialogOpen} onOpenChange={setIsJustificacionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Justificación del Cover</DialogTitle>
              <DialogDescription>
                Modifica el estado de aprobación del cover
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="justificacion">Estado</Label>
                <Select
                  value={justificacionForm.justificacion}
                  onValueChange={(value) => setJustificacionForm(prev => ({ ...prev, justificacion: value as StatusCover }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="APROBADO">Aprobado</SelectItem>
                    <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {justificacionForm.justificacion === 'RECHAZADO' && (
                <div>
                  <Label htmlFor="comentarios">Motivo del rechazo</Label>
                  <Textarea
                    placeholder="Explica el motivo del rechazo..."
                    value={justificacionForm.comentarios}
                    onChange={(e) => setJustificacionForm(prev => ({ ...prev, comentarios: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsJustificacionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleJustificacionSubmit}
                disabled={justificacionForm.justificacion === 'RECHAZADO' && !justificacionForm.comentarios.trim()}
              >
                Actualizar Justificación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Confirmar Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cover?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cover será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}