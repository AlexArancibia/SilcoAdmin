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
import { MoreHorizontal, Plus, Search, Check, X, Calendar, Clock, Hash, Save, Edit, User, DollarSign, MessageSquare } from 'lucide-react'
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
import { useCoversStore } from '@/store/useCoverStore'
import { useInstructoresStore } from '@/store/useInstructoresStore'
import { usePeriodosStore } from '@/store/usePeriodosStore'
import { useClasesStore } from '@/store/useClasesStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Cover } from '@/types/schema'

export default function CoversPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Refs for dropdown closing
  const claseSearchRef = useRef<HTMLDivElement>(null)
  const instructorSearchRef = useRef<HTMLDivElement>(null)

  // Covers store
  const {
    covers,
    coverSeleccionado,
    fetchCovers,
    fetchCover,
    crearCover,
    actualizarCover,
    eliminarCover,
    setCoverSeleccionado,
    aprobarCover,
    rechazarCover,
    isLoading: isLoadingCovers,
    error: coversError,
  } = useCoversStore()

  // Other stores
  const { instructores, fetchInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { clases, fetchClases } = useClasesStore()
  const { user } = useAuthStore()

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | 'all'>('all')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<Cover>>({
    claseId: '',
    periodoId: 0,
    instructorReemplazoId: 0,
    justificacion: false,
    pagoBono: false,
    pagoFullHouse: false,
    comentarios: '',
    cambioDeNombre: '',
  })
  const [claseSearch, setClaseSearch] = useState('')
  const [instructorSearch, setInstructorSearch] = useState('')
  const [showClaseResults, setShowClaseResults] = useState(false)
  const [showInstructorResults, setShowInstructorResults] = useState(false)
  const [editingCoverId, setEditingCoverId] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Cover>>({
    justificacion: false,
    pagoBono: false,
    pagoFullHouse: false,
    comentarios: '',
    cambioDeNombre: '',
  })
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (claseSearchRef.current && !claseSearchRef.current.contains(event.target as Node)) {
        setShowClaseResults(false)
      }
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
          fetchCovers(),
          fetchInstructores(),
          fetchPeriodos(),
          fetchClases(),
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
  }, [fetchCovers, fetchInstructores, fetchPeriodos, fetchClases, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleCheckboxChange = useCallback((name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }))
  }, [])

  const handleEditCheckboxChange = useCallback((name: string, checked: boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [name]: checked,
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await crearCover(formData as Omit<Cover, 'id' | 'createdAt' | 'updatedAt'>)
      toast({
        title: 'Cover creado',
        description: 'El cover se ha creado correctamente.',
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
      await actualizarCover(id, editFormData)
      toast({
        title: 'Cover actualizado',
        description: 'El cover se ha actualizado correctamente.',
      })
      setEditingCoverId(null)
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
      claseId: '',
      periodoId: 0,
      instructorReemplazoId: 0,
      justificacion: false,
      pagoBono: false,
      pagoFullHouse: false,
      comentarios: '',
      cambioDeNombre: '',
    })
    setClaseSearch('')
    setInstructorSearch('')
    setShowClaseResults(false)
    setShowInstructorResults(false)
  }, [])

  const handleDelete = async () => {
    if (!coverSeleccionado) return
    try {
      await eliminarCover(coverSeleccionado.id)
      toast({
        title: 'Cover eliminado',
        description: 'El cover se ha eliminado correctamente.',
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

const handleViewDetails = async (cover: Cover) => {
  try {
    setIsLoadingDetails(true)
    // En lugar de hacer fetch, usar directamente el cover pasado como parámetro
    setCoverSeleccionado(cover)
    setIsViewDialogOpen(true)
  } catch (error) {
    toast({
      title: 'Error',
      description: 'No se pudo cargar la información del cover',
      variant: 'destructive',
    })
  } finally {
    setIsLoadingDetails(false)
  }
}

  const handleApprove = async () => {
    if (!coverSeleccionado) return
    try {
      await aprobarCover(coverSeleccionado.id)
      toast({
        title: 'Cover aprobado',
        description: 'El cover ha sido aprobado correctamente.',
      })
      setIsApproveDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al aprobar',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async () => {
    if (!coverSeleccionado) return
    try {
      await rechazarCover(coverSeleccionado.id, rejectComment)
      toast({
        title: 'Cover rechazado',
        description: 'El cover ha sido rechazado correctamente.',
      })
      setIsRejectDialogOpen(false)
      setRejectComment('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al rechazar',
        variant: 'destructive',
      })
    }
  }

  const startEditing = useCallback((cover: Cover) => {
    setEditingCoverId(cover.id)
    setEditFormData({
      justificacion: cover.justificacion,
      pagoBono: cover.pagoBono,
      pagoFullHouse: cover.pagoFullHouse,
      comentarios: cover.comentarios || '',
      cambioDeNombre: cover.cambioDeNombre || '',
    })
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingCoverId(null)
  }, [])

  const filteredCovers = useCallback(() => {
    return covers.filter(cover => {
      const matchesSearch = searchTerm === '' || 
        cover.claseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cover.comentarios?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cover.cambioDeNombre?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesPeriodo = selectedPeriodo === 'all' || cover.periodoId === selectedPeriodo
      
      return matchesSearch && matchesPeriodo
    })
  }, [covers, searchTerm, selectedPeriodo])

  const filteredClases = useCallback(() => {
    return clases.filter(clase => 
      clase.id.toLowerCase().includes(claseSearch.toLowerCase()) ||
      clase.estudio.toLowerCase().includes(claseSearch.toLowerCase())
    )
  }, [clases, claseSearch])

  const filteredInstructores = useCallback(() => {
    return instructores.filter(instructor => 
      instructor.nombre.toLowerCase().includes(instructorSearch.toLowerCase())
    )
  }, [instructores, instructorSearch])

  const getInstructorName = useCallback((id: number) => {
    const instructor = instructores.find(i => i.id === id)
    return instructor ? instructor.nombre : `ID: ${id}`
  }, [instructores])

  const getClaseInfo = useCallback((cover: Cover) => {
    if (!cover.clase) return `ID: ${cover.claseId}`
    return `${cover.clase.estudio}`
  }, [])

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

  const handleClaseSelect = useCallback((claseId: string) => {
    const selectedClase = clases.find(c => c.id === claseId)
    if (selectedClase) {
      setFormData(prev => ({
        ...prev,
        claseId: selectedClase.id,
        periodoId: selectedClase.periodoId
      }))
      setClaseSearch(selectedClase.id)
    }
    setShowClaseResults(false)
  }, [clases])

  const handleInstructorSelect = useCallback((instructorId: number) => {
    const selectedInstructor = instructores.find(i => i.id === instructorId)
    if (selectedInstructor) {
      setFormData(prev => ({
        ...prev,
        instructorReemplazoId: instructorId
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

  const renderNewCoverRow = () => (
    <TableRow className="bg-blue-50">
      <TableCell>
        <div className="relative" ref={claseSearchRef}>
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-1 text-muted-foreground" />
            <Input
              placeholder="ID de clase"
              value={claseSearch}
              onChange={(e) => {
                setClaseSearch(e.target.value)
                setShowClaseResults(true)
              }}
              onFocus={() => setShowClaseResults(true)}
              className="w-full"
            />
          </div>
          {showClaseResults && claseSearch && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredClases().map(clase => (
                <div 
                  key={clase.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleClaseSelect(clase.id)}
                >
                  <div className="font-medium">{clase.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {clase.estudio}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPeruDateTime(clase.fecha)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="relative" ref={instructorSearchRef}>
          <Input
            placeholder="Instructor"
            value={instructorSearch}
            onChange={(e) => {
              setInstructorSearch(e.target.value)
              setShowInstructorResults(true)
            }}
            onFocus={() => setShowInstructorResults(true)}
            className="w-full"
          />
          {showInstructorResults && instructorSearch && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredInstructores().map(instructor => (
                <div 
                  key={instructor.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleInstructorSelect(instructor.id)}
                >
                  {instructor.nombre}
                </div>
              ))}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {formData.claseId ? (
          clases.find(c => c.id === formData.claseId)?.fecha ? (
            formatPeruDateTime(clases.find(c => c.id === formData.claseId)!.fecha)
          ) : 'Fecha no disponible'
        ) : 'Seleccione clase'}
      </TableCell>
      <TableCell>
        {formData.periodoId ? (
          <Badge variant="outline">
            {getPeriodoInfo(formData.periodoId)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Seleccione clase</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={formData.justificacion || false}
          onChange={(e) => handleCheckboxChange('justificacion', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </TableCell>
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={formData.pagoBono || false}
          onChange={(e) => handleCheckboxChange('pagoBono', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </TableCell>
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={formData.pagoFullHouse || false}
          onChange={(e) => handleCheckboxChange('pagoFullHouse', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Cambio de nombre (opcional)"
            name="cambioDeNombre"
            value={formData.cambioDeNombre || ''}
            onChange={handleInputChange}
            className="w-full"
          />
          <Textarea
            placeholder="Comentarios (opcional)"
            name="comentarios"
            value={formData.comentarios || ''}
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
              disabled={!formData.claseId || !formData.instructorReemplazoId}
            >
              <Check className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )

  const renderAddNewCoverButton = () => (
    <TableRow>
      <TableCell colSpan={8} className="text-center py-4">
        <Button 
          variant="ghost" 
          className="text-blue-500 hover:text-blue-600"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Añadir nuevo cover
        </Button>
      </TableCell>
    </TableRow>
  )

  const renderCoverRow = (cover: Cover) => (
    <TableRow key={cover.id} className="hover:bg-gray-50">
      <TableCell>
        <div className="font-medium">{cover.claseId}</div>
        <div className="text-sm text-muted-foreground">
          {getClaseInfo(cover)}
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {cover.instructorReemplazo?.nombre || getInstructorName(cover.instructorReemplazoId)}
      </TableCell>
      <TableCell>
        {cover.clase?.fecha ? (
          formatPeruDateTime(cover.clase.fecha)
        ) : 'N/A'}
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {getPeriodoInfo(cover.periodoId)}
        </Badge>
      </TableCell>
      
      <TableCell className="text-center">
        {editingCoverId === cover.id ? (
          <input
            type="checkbox"
            checked={editFormData.justificacion || false}
            onChange={(e) => handleEditCheckboxChange('justificacion', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ) : (
          <Badge variant={cover.justificacion ? "default" : "secondary"}>
            {cover.justificacion ? 'Justificado' : 'Sin justificar'}
          </Badge>
        )}
      </TableCell>

      <TableCell className="text-center">
        {editingCoverId === cover.id ? (
          <input
            type="checkbox"
            checked={editFormData.pagoBono || false}
            onChange={(e) => handleEditCheckboxChange('pagoBono', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ) : cover.pagoBono ? (
          <Check className="h-4 w-4 text-green-500 mx-auto" />
        ) : (
          <X className="h-4 w-4 text-red-500 mx-auto" />
        )}
      </TableCell>

      <TableCell className="text-center">
        {editingCoverId === cover.id ? (
          <input
            type="checkbox"
            checked={editFormData.pagoFullHouse || false}
            onChange={(e) => handleEditCheckboxChange('pagoFullHouse', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ) : cover.pagoFullHouse ? (
          <Check className="h-4 w-4 text-green-500 mx-auto" />
        ) : (
          <X className="h-4 w-4 text-red-500 mx-auto" />
        )}
      </TableCell>

      <TableCell>
        {editingCoverId === cover.id ? (
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Cambio de nombre"
              name="cambioDeNombre"
              value={editFormData.cambioDeNombre || ''}
              onChange={handleEditInputChange}
              className="w-full"
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
                onClick={() => handleEditSubmit(cover.id)}
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
              <DropdownMenuItem onClick={() => handleViewDetails(cover)}>
  Ver detalles
</DropdownMenuItem>

              {user?.rol !== 'USUARIO' && (
                <>
                  <DropdownMenuItem onClick={() => startEditing(cover)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCoverSeleccionado(cover)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="text-red-500 focus:text-red-500"
                  >
                    Eliminar
                  </DropdownMenuItem>
                  {!cover.justificacion && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setCoverSeleccionado(cover)
                          setIsApproveDialogOpen(true)
                        }}
                        className="text-green-500 focus:text-green-500"
                      >
                        Aprobar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setCoverSeleccionado(cover)
                          setIsRejectDialogOpen(true)
                        }}
                        className="text-orange-500 focus:text-orange-500"
                      >
                        Rechazar
                      </DropdownMenuItem>
                    </>
                  )}
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
      <div className="py-8 flex justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-muted-foreground">Cargando detalles...</span>
        </div>
      </div>
    )
  }

  if (!coverSeleccionado) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <X className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-muted-foreground">No se encontraron detalles del cover</p>
      </div>
    )
  }

  const cover = coverSeleccionado


    return (
    <div className="space-y-6">
      {/* Header con estado del cover */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Hash className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{cover.claseId}</h3>
            <p className="text-sm text-muted-foreground">{getClaseInfo(cover)}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge 
            variant={cover.justificacion ? "default" : "secondary"}
            className={`text-sm px-3 py-1 ${
              cover.justificacion 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}
          >
            {cover.justificacion ? (
              <><Check className="h-3 w-3 mr-1" /> Justificado</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
            )}
          </Badge>
        </div>
      </div>

      {/* Información principal en cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de Instructor */}
        <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Instructor Reemplazo</h4>
          </div>
          <p className="text-lg font-semibold text-gray-800">
            {cover.instructorReemplazo?.nombre || getInstructorName(cover.instructorReemplazoId)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ID: {cover.instructorReemplazoId}
          </p>
        </div>

        {/* Card de Fecha y Periodo */}
        <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Programación</h4>
          </div>
          <div className="space-y-2">
            {cover.clase?.fecha ? (
              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {format(addHours(new Date(cover.clase.fecha), 5), 'EEEE, dd MMMM yyyy', { locale: es })}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Fecha no disponible</p>
            )}
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs">
                {getPeriodoInfo(cover.periodoId)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Información de pagos */}
      <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
          Información de Pagos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-md border border-green-100">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${cover.pagoBono ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">Pago de S/80</span>
            </div>
            <Badge variant={cover.pagoBono ? "default" : "secondary"}>
              {cover.pagoBono ? 'Aprobado' : 'Pendiente'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-md border border-green-100">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${cover.pagoFullHouse ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">Pago Full House</span>
            </div>
            <Badge variant={cover.pagoFullHouse ? "default" : "secondary"}>
              {cover.pagoFullHouse ? 'Aprobado' : 'Pendiente'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      {(cover.cambioDeNombre || cover.comentarios) && (
        <div className="space-y-4">
          {cover.cambioDeNombre && (
            <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <Edit className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium text-orange-900">Cambio de Nombre</h4>
              </div>
              <p className="text-orange-800 bg-white p-3 rounded border border-orange-200">
                {cover.cambioDeNombre}
              </p>
            </div>
          )}

          {cover.comentarios && (
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Comentarios</h4>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="text-blue-800 whitespace-pre-line">
                  {cover.comentarios}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadatos del cover */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span>Creado: </span>
            <span className="font-medium">
              {cover.createdAt ? 
                format(addHours(new Date(cover.createdAt), 5), 'dd/MM/yyyy HH:mm', { locale: es }) 
                : 'N/A'
              }
            </span>
          </div>
          {cover.updatedAt && cover.updatedAt !== cover.createdAt && (
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>Actualizado: </span>
              <span className="font-medium">
                {format(addHours(new Date(cover.updatedAt), 5), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas para administradores */}
      {user?.rol !== 'USUARIO' && !cover.justificacion && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Acciones Rápidas</h4>
          <div className="flex space-x-3">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setIsViewDialogOpen(false)
                setCoverSeleccionado(cover)
                setIsApproveDialogOpen(true)
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
              onClick={() => {
                setIsViewDialogOpen(false)
                setCoverSeleccionado(cover)
                setIsRejectDialogOpen(true)
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Rechazar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false)
                startEditing(cover)
              }}
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

  return (
    <div className="px-12 mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Covers</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por clase, comentarios o nombre..."
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
      </div>

      {isLoadingCovers ? (
        renderLoadingSkeleton()
      ) : coversError ? (
        <div className="text-red-500">{coversError}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[200px]">Clase</TableHead>
                <TableHead className="w-[200px]">Instructor</TableHead>
                <TableHead>Fecha Clase (PET)</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Pago de S/80</TableHead>
                <TableHead className="text-center">Full</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* New Cover Row */}
              {user?.rol !== 'USUARIO' && (isCreating ? renderNewCoverRow() : renderAddNewCoverButton())}

              {/* Existing Covers */}
              {filteredCovers().map(renderCoverRow)}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Details Dialog */}
      <AlertDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
  <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <AlertDialogHeader className="border-b border-gray-200 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <AlertDialogTitle className="text-2xl font-bold text-gray-900">
            Detalles del Cover
          </AlertDialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Información completa del cover seleccionado
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsViewDialogOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </AlertDialogHeader>
    
    <div className="py-6">
      {renderViewDialogContent()}
    </div>
    
    <AlertDialogFooter className="border-t border-gray-200 pt-4">
      <AlertDialogAction 
        className="bg-blue-600 hover:bg-blue-700 px-6"
        onClick={() => setIsViewDialogOpen(false)}
      >
        Cerrar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este cover?</AlertDialogTitle>
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

      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar este cover?</AlertDialogTitle>
            <AlertDialogDescription>
              Al aprobar, el instructor recibirá el pago correspondiente por este cover.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              className="bg-green-500 hover:bg-green-600"
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar este cover?</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, indica el motivo del rechazo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Motivo del rechazo"
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}