'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { format, addHours } from 'date-fns'
import { es } from 'date-fns/locale'

// UI components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Search, Check, X, Calendar, Clock, User, Award, AlertCircle, Loader2, Save, Edit } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'

// Stores
import { usePenalizacionesStore } from '@/store/usePenalizacionesStore'
import { useInstructoresStore } from '@/store/useInstructoresStore'
import { usePeriodosStore } from '@/store/usePeriodosStore'
import { useDisciplinasStore } from '@/store/useDisciplinasStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { Penalizacion, TipoPenalizacion } from '@/types/schema'

export default function PenalizacionesPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Stores
  const {
    penalizaciones,
    penalizacionSeleccionada,
    fetchPenalizaciones,
    fetchPenalizacion,
    crearPenalizacion,
    actualizarPenalizacion,
    eliminarPenalizacion,
    setPenalizacionSeleccionada,
    isLoading: isLoadingPenalizaciones,
    error: penalizacionesError,
  } = usePenalizacionesStore()

  const { instructores, fetchInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { disciplinas, fetchDisciplinas } = useDisciplinasStore()
  const { user } = useAuthStore()

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | 'all'>('all')
  const [selectedTipo, setSelectedTipo] = useState<TipoPenalizacion | 'all'>('all')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Omit<Penalizacion, 'id' | 'createdAt' | 'updatedAt'>>({
    instructorId: 0,
    disciplinaId: undefined,
    periodoId: 0,
    tipo: "CANCELACION_FIJA",
    puntos: 2,
    descripcion: '',
    activa: true,
    aplicadaEn: new Date(),
    comentarios: '',
  })
  const [instructorSearch, setInstructorSearch] = useState('')
  const [showInstructorResults, setShowInstructorResults] = useState(false)
  const [editingPenalizacionId, setEditingPenalizacionId] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Penalizacion>>({
    descripcion: '',
    puntos: 2,
    comentarios: '',
    activa: true,
  })
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Refs
  const instructorSearchRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (instructorSearchRef.current && !instructorSearchRef.current.contains(event.target as Node)) {
        setShowInstructorResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchPenalizaciones(),
          fetchInstructores(),
          fetchPeriodos(),
          fetchDisciplinas(),
        ])
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al cargar los datos iniciales',
          variant: 'destructive',
        })
      }
    }
    loadData()
  }, [fetchPenalizaciones, fetchInstructores, fetchPeriodos, fetchDisciplinas, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'puntos' ? Number(value) : value,
    }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'puntos' ? Number(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'periodoId' || name === 'instructorId' || name === 'disciplinaId' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await crearPenalizacion(formData)
      toast({
        title: 'Penalización creada',
        description: 'La penalización se ha creado correctamente.',
      })
      resetFormData()
      setIsCreating(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error desconocido',
        variant: 'destructive',
      })
    }
  }

  const handleEditSubmit = async (id: number) => {
    try {
      await actualizarPenalizacion(id, editFormData)
      toast({
        title: 'Penalización actualizada',
        description: 'La penalización se ha actualizado correctamente.',
      })
      setEditingPenalizacionId(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al actualizar',
        variant: 'destructive',
      })
    }
  }

  const resetFormData = useCallback(() => {
    setFormData({
      instructorId: 0,
      disciplinaId: undefined,
      periodoId: 0,
      tipo: "CANCELACION_FIJA",
      puntos: 2,
      descripcion: '',
      activa: true,
      aplicadaEn: new Date(),
      comentarios: '',
    })
    setInstructorSearch('')
    setShowInstructorResults(false)
  }, [])

  const handleDelete = async () => {
    if (!penalizacionSeleccionada) return
    try {
      await eliminarPenalizacion(penalizacionSeleccionada.id)
      toast({
        title: 'Penalización eliminada',
        description: 'La penalización se ha eliminado correctamente.',
      })
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al eliminar',
        variant: 'destructive',
      })
    }
  }

  const handleViewDetails = async (id: number) => {
    try {
      setIsLoadingDetails(true)
      await fetchPenalizacion(id)
      setIsViewDialogOpen(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de la penalización',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const startEditing = useCallback((penalizacion: Penalizacion) => {
    setEditingPenalizacionId(penalizacion.id)
    setEditFormData({
      descripcion: penalizacion.descripcion || '',
      puntos: penalizacion.puntos,
      comentarios: penalizacion.comentarios || '',
      activa: true, // Always set to active
    })
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingPenalizacionId(null)
  }, [])

  const filteredPenalizaciones = useCallback(() => {
    return penalizaciones.filter(penalizacion => {
      const matchesSearch = searchTerm === '' || 
        (penalizacion.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (penalizacion.comentarios?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (penalizacion.instructor?.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesPeriodo = selectedPeriodo === 'all' || penalizacion.periodoId === selectedPeriodo
      const matchesTipo = selectedTipo === 'all' || penalizacion.tipo === selectedTipo
      
      return matchesSearch && matchesPeriodo && matchesTipo
    })
  }, [penalizaciones, searchTerm, selectedPeriodo, selectedTipo])

  const filteredInstructores = useCallback(() => {
    return instructores.filter(instructor => 
      instructor.nombre.toLowerCase().includes(instructorSearch.toLowerCase())
    )
  }, [instructores, instructorSearch])

  const getInstructorName = useCallback((id: number) => {
    const instructor = instructores.find(i => i.id === id)
    return instructor ? instructor.nombre : `ID: ${id}`
  }, [instructores])

  const getDisciplinaName = useCallback((id?: number) => {
    if (!id) return 'No aplica'
    const disciplina = disciplinas.find(d => d.id === id)
    return disciplina ? disciplina.nombre : `ID: ${id}`
  }, [disciplinas])

  const getPeriodoInfo = useCallback((id: number) => {
    const periodo = periodos.find(p => p.id === id)
    return periodo ? `P${periodo.numero}-${periodo.año}` : `ID: ${id}`
  }, [periodos])

  const formatPeruDateTime = useCallback((date: Date | string) => {
    if (!date) return 'N/A'
    const d = addHours(new Date(date), 5) // Add 5 hours for Peru time
    return (
      <div className="flex flex-col">
        <span className="flex items-center text-sm">
          <Calendar className="mr-1 h-3 w-3" />
          {format(d, 'PPP', { locale: es })}
        </span>
        <span className="flex items-center text-xs text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          {format(d, 'p', { locale: es })}
        </span>
      </div>
    )
  }, [])

  const getTipoBadge = (tipo: TipoPenalizacion) => {
    const tipoStyles = {
      CANCELACION_FIJA: 'bg-red-100 text-red-800',
      CANCELACION_FUERA_TIEMPO: 'bg-orange-100 text-orange-800',
      CANCELAR_MENOS_24HRS: 'bg-yellow-100 text-yellow-800',
      COVER_DEL_COVER: 'bg-blue-100 text-blue-800',
      SALIR_TARDE: 'bg-purple-100 text-purple-800',
      LLEGO_TARDE: 'bg-sky-100 text-sky-800',
      PERSONALIZADA: 'bg-gray-100 text-gray-800',
    }
    
    const tipoLabels = {
      CANCELACION_FIJA: 'Cancelación fija',
      CANCELACION_FUERA_TIEMPO: 'Cancelación fuera de tiempo',
      CANCELAR_MENOS_24HRS: 'Cancelar <24hrs',
      COVER_DEL_COVER: 'Cover del cover',
      SALIR_TARDE: 'Salió tarde',
      LLEGO_TARDE: 'Llegó tarde',
      PERSONALIZADA: 'Personalizada',
    }

    return (
      <Badge className={`${tipoStyles[tipo]} w-fit   capitalize`}>
        {tipoLabels[tipo]}
      </Badge>
    )


  }
  const handleInstructorSelect = useCallback((instructorId: number) => {
  const selectedInstructor = instructores.find(i => i.id === instructorId)
  if (selectedInstructor) {
    setFormData(prev => ({
      ...prev,
      instructorId: instructorId
    }))
    setInstructorSearch(selectedInstructor.nombre)
  }
  setShowInstructorResults(false)
}, [instructores])

  // Memoized components
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )

  const renderNewPenalizacionRow = () => (
    <TableRow className="bg-blue-50">
      <TableCell>
        <div className="relative" ref={instructorSearchRef}>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1 text-muted-foreground" />
            <Input
              placeholder="Buscar instructor"
              value={instructorSearch}
              onChange={(e) => {
                setInstructorSearch(e.target.value)
                setShowInstructorResults(true)
              }}
              onFocus={() => setShowInstructorResults(true)}
              className="w-full"
            />
          </div>
          {showInstructorResults && instructorSearch && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredInstructores().map(instructor => (
                <div 
                  key={instructor.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleInstructorSelect(instructor.id)}
                >
                  <div className="font-medium">{instructor.nombre}</div>
                  <div className="text-xs text-muted-foreground">
                    {instructor.celular}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <Select
            value={formData.tipo}
            onValueChange={(value) => handleSelectChange('tipo', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de penalización" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CANCELACION_FIJA">Cancelación fija</SelectItem>
              <SelectItem value="CANCELACION_FUERA_TIEMPO">Cancelación fuera de tiempo</SelectItem>
              <SelectItem value="CANCELAR_MENOS_24HRS">Cancelar con menos de 24hrs</SelectItem>
              <SelectItem value="COVER_DEL_COVER">Cover del cover</SelectItem>
              <SelectItem value="SALIR_TARDE">Salió tarde</SelectItem>
              <SelectItem value="LLEGO_TARDE">LLegó tarde</SelectItem>
              <SelectItem value="PERSONALIZADA">Personalizada</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Descripción breve"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            className="w-full text-sm"
            rows={2}
          />
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          name="puntos"
          value={formData.puntos}
          onChange={handleInputChange}
          placeholder="Puntos"
          min="0"
          className="w-20"
        />
      </TableCell>
      <TableCell>
        <Select
          value={formData.periodoId.toString()}
          onValueChange={(value) => handleSelectChange('periodoId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodos.map(periodo => (
              <SelectItem key={periodo.id} value={periodo.id.toString()}>
                P{periodo.numero}-{periodo.año}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={formData.disciplinaId?.toString() || '0'}
          onValueChange={(value) => handleSelectChange('disciplinaId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Disciplina (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No aplica</SelectItem>
            {disciplinas.map(disciplina => (
              <SelectItem key={disciplina.id} value={disciplina.id.toString()}>
                {disciplina.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
 
      <TableCell>
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Comentarios (opcional)"
            name="comentarios"
            value={formData.comentarios}
            onChange={handleInputChange}
            className="w-full text-sm"
            rows={2}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsCreating(false)
                resetFormData()
              }}
            >
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit}
              disabled={!formData.instructorId || !formData.periodoId}
            >
              <Check className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )

  const renderAddNewPenalizacionButton = () => (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-4">
        <Button 
          variant="ghost" 
          className="text-blue-500 hover:text-blue-600"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Añadir nueva penalización
        </Button>
      </TableCell>
    </TableRow>
  )

  const renderPenalizacionRow = (penalizacion: Penalizacion) => (
    <TableRow key={penalizacion.id} className="hover:bg-gray-50">
      <TableCell>
        <div className="font-medium">
          {penalizacion.instructor?.nombre || getInstructorName(penalizacion.instructorId)}
        </div>
 
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {getTipoBadge(penalizacion.tipo)}
          <div className="text-sm text-muted-foreground">
            {penalizacion.descripcion}
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {penalizacion.puntos}
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {getPeriodoInfo(penalizacion.periodoId)}
        </Badge>
      </TableCell>
      <TableCell>
        {getDisciplinaName(penalizacion.disciplinaId)}
      </TableCell>
 
      <TableCell>
        {editingPenalizacionId === penalizacion.id ? (
          <div className="flex flex-col gap-2">
            <Select
              value={editFormData.tipo || penalizacion.tipo}
              onValueChange={(value) => setEditFormData(prev => ({
                ...prev,
                tipo: value as TipoPenalizacion
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de penalización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CANCELACION_FIJA">Cancelación fija</SelectItem>
                <SelectItem value="CANCELACION_FUERA_TIEMPO">Cancelación fuera de tiempo</SelectItem>
                <SelectItem value="CANCELAR_MENOS_24HRS">Cancelar con menos de 24hrs</SelectItem>
                <SelectItem value="COVER_DEL_COVER">Cover del cover</SelectItem>
                <SelectItem value="SALIR_TARDE">Salió tarde</SelectItem>
               <SelectItem value="LLEGO_TARDE">LLegó tarde</SelectItem>

                <SelectItem value="PERSONALIZADA">Personalizada</SelectItem>

              </SelectContent>
            </Select>
            <Textarea
              placeholder="Descripción"
              name="descripcion"
              value={editFormData.descripcion || ''}
              onChange={handleEditInputChange}
              className="w-full text-sm"
              rows={2}
            />
            <Input
              type="number"
              name="puntos"
              value={editFormData.puntos || 0}
              onChange={handleEditInputChange}
              placeholder="Puntos"
              min="0"
              className="w-20"
            />
            <Textarea
              placeholder="Comentarios"
              name="comentarios"
              value={editFormData.comentarios || ''}
              onChange={handleEditInputChange}
              className="w-full text-sm"
              rows={2}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={cancelEditing}
              >
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleEditSubmit(penalizacion.id)}
              >
                <Save className="h-4 w-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleViewDetails(penalizacion.id)}>
                Ver detalles
              </DropdownMenuItem>
              {user?.rol !== 'USUARIO' && (
                <>
                  <DropdownMenuItem onClick={() => startEditing(penalizacion)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPenalizacionSeleccionada(penalizacion)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="text-red-500 focus:text-red-500"
                  >
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )

  const renderViewDialogContent = () => {
    if (isLoadingDetails) {
      return (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (!penalizacionSeleccionada) {
      return (
        <div className="py-4 text-center text-muted-foreground">
          No se encontraron detalles de la penalización
        </div>
      )
    }

    return (
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Instructor</Label>
            <p className="font-medium">
              {penalizacionSeleccionada.instructor?.nombre || getInstructorName(penalizacionSeleccionada.instructorId)}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Tipo</Label>
            <div className="font-medium">
              {getTipoBadge(penalizacionSeleccionada.tipo)}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Puntos</Label>
            <p className="font-medium">{penalizacionSeleccionada.puntos}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Período</Label>
            <p className="font-medium">{getPeriodoInfo(penalizacionSeleccionada.periodoId)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Disciplina</Label>
            <p className="font-medium">{getDisciplinaName(penalizacionSeleccionada.disciplinaId)}</p>
          </div>
 
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Aplicada en</Label>
            <div className="font-medium">
              {penalizacionSeleccionada.aplicadaEn ? (
                formatPeruDateTime(penalizacionSeleccionada.aplicadaEn)
              ) : 'N/A'}
            </div>
          </div>
        </div>

        {penalizacionSeleccionada.descripcion && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Descripción</Label>
            <p className="font-medium whitespace-pre-line bg-gray-50 p-3 rounded-md">
              {penalizacionSeleccionada.descripcion}
            </p>
          </div>
        )}

        {penalizacionSeleccionada.comentarios && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Comentarios</Label>
            <p className="font-medium whitespace-pre-line bg-gray-50 p-3 rounded-md">
              {penalizacionSeleccionada.comentarios}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-muted-foreground text-sm">Fecha de creación</Label>
          <div className="font-medium">
            {penalizacionSeleccionada.createdAt ? (
              <div className="flex items-center text-sm">
                <Calendar className="mr-1 h-3 w-3" />
                {format(addHours(new Date(penalizacionSeleccionada.createdAt), 5), 'PPPp', { locale: es })}
              </div>
            ) : 'N/A'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-12 mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Penalizaciones</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por instructor, descripción o comentarios..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select 
          value={selectedPeriodo.toString()} 
          onValueChange={(value) => setSelectedPeriodo(value === 'all' ? 'all' : parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por período" />
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
          value={selectedTipo} 
          onValueChange={(value) => setSelectedTipo(value as TipoPenalizacion | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="CANCELACION_FIJA">Cancelación fija</SelectItem>
            <SelectItem value="CANCELACION_FUERA_TIEMPO">Cancelación fuera de tiempo</SelectItem>
            <SelectItem value="CANCELAR_MENOS_24HRS">Cancelar con menos de 24hrs</SelectItem>
            <SelectItem value="COVER_DEL_COVER">Cover del cover</SelectItem>
            <SelectItem value="SALIR_TARDE">Salió tarde</SelectItem>
           <SelectItem value="LLEGO_TARDE">LLegó tarde</SelectItem>

            <SelectItem value="PERSONALIZADA">Personalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoadingPenalizaciones ? (
        renderLoadingSkeleton()
      ) : penalizacionesError ? (
        <div className="text-red-500">{penalizacionesError}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[200px]">Instructor</TableHead>
                <TableHead>Tipo y Descripción</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* New Penalizacion Row */}
              {user?.rol !== 'USUARIO' && (isCreating ? renderNewPenalizacionRow() : renderAddNewPenalizacionButton())}

              {/* Existing Penalizaciones */}
              {filteredPenalizaciones().map(renderPenalizacionRow)}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Details Dialog */}
      <AlertDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Detalles de la Penalización</AlertDialogTitle>
          </AlertDialogHeader>
          {renderViewDialogContent()}
          <AlertDialogFooter>
            <AlertDialogAction className="px-6">Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta penalización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}