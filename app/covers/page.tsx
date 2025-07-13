'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { format, addHours } from 'date-fns'
import { es } from 'date-fns/locale'

// Componentes UI
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
import { Clase, Instructor } from '@/types/schema'

export default function CoversPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Stores
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
    enlazarCovers,
    isLoading: isLoadingCovers,
    error: coversError,
  } = useCoversStore()

  const { instructores, fetchInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const { clases, fetchClases } = useClasesStore()
  const { user } = useAuthStore()

  // Estados
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
  const [claseSearchResults, setClaseSearchResults] = useState<Clase[]>([])
  const [instructorSearchResults, setInstructorSearchResults] = useState<Instructor[]>([])
  const [claseInfo, setClaseInfo] = useState<Partial<Clase> | null>(null)

  // Cargar datos iniciales
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

  // Handlers
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

  const handleEnlazarCovers = async () => {
    if (selectedPeriodo === 'all') {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un período específico',
        variant: 'destructive',
      })
      return
    }

    try {
      const updatedCount = await enlazarCovers(selectedPeriodo)
      toast({
        title: 'Éxito',
        description: `Se han enlazado ${updatedCount} covers correctamente`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al enlazar covers',
        variant: 'destructive',
      })
    }
  }

  // Funciones auxiliares
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
    setClaseInfo(null)
  }, [])

  const startEditing = useCallback((cover: Cover) => {
  setEditingCoverId(cover.id);

  // Determinar el valor a mostrar en el input de búsqueda de clase
  const claseSearchValue = cover.claseId || cover.claseTemp || '';
  
  // Establecer el valor de búsqueda en el estado
  setClaseSearch(claseSearchValue);
  
  // Actualizar el editFormData con el valor correcto
  setEditFormData({
    claseId: cover.claseId || '',
    claseTemp: cover.claseTemp || '',
    periodoId: cover.periodoId,
    instructorReemplazoId: cover.instructorReemplazoId,
    justificacion: cover.justificacion,
    pagoBono: cover.pagoBono,
    pagoFullHouse: cover.pagoFullHouse,
    comentarios: cover.comentarios || '',
    cambioDeNombre: cover.cambioDeNombre || '',
  });
  
  // Si hay una clase asociada, cargar su información
  if (cover.claseId) {
    const clase = clases.find(c => c.id === cover.claseId);
    setClaseInfo(clase || null);
  } else if (cover.claseTemp) {
    // Para clases temporales, mostramos la info básica
 
  }
  
  // Cargar información del instructor
  const instructor = instructores.find(i => i.id === cover.instructorReemplazoId);
  setInstructorSearch(instructor?.nombre || '');
}, [clases, instructores]);

  const cancelEditing = useCallback(() => {
    setEditingCoverId(null)
  }, [])

  const filteredCovers = useCallback(() => {
    return covers.filter(cover => {
      const matchesSearch = searchTerm === '' || 
        (cover.claseId && cover.claseId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cover.claseTemp && cover.claseTemp.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cover.comentarios?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cover.cambioDeNombre?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesPeriodo = selectedPeriodo === 'all' || cover.periodoId === selectedPeriodo
      
      return matchesSearch && matchesPeriodo
    })
  }, [covers, searchTerm, selectedPeriodo])

  const getInstructorName = useCallback((id: number) => {
    const instructor = instructores.find(i => i.id === id)
    return instructor ? instructor.nombre : `ID: ${id}`
  }, [instructores])

  const getClaseInfo = useCallback((cover: Cover) => {
  if (cover.clase) {
    // Para clases existentes, mostrar estudio + fecha/hora
    return `${cover.clase.estudio} - ${format(new Date(cover.clase.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}`;
  }
  if (cover.claseTemp) {
    // Para clases temporales
    return `Clase temporal: ${cover.claseTemp}`;
  }
  return 'Sin clase asignada';
}, []);

  const getPeriodoInfo = useCallback((id: number) => {
    const periodo = periodos.find(p => p.id === id)
    return periodo ? `P${periodo.numero}-${periodo.año}` : `ID: ${id}`
  }, [periodos])

  const formatPeruDateTime = useCallback((date: Date | string) => {
    if (!date) return 'N/A'
    const d = addHours(new Date(date), 5)
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

  const formatClaseFecha = useCallback((clase: Clase | undefined | null) => {
  if (!clase?.fecha) return '';
  return format(new Date(clase.fecha), 'dd/MM/yyyy', { locale: es });
}, []);

const formatClaseHora = useCallback((clase: Clase | undefined | null) => {
  if (!clase?.fecha) return '';
  return format(new Date(clase.fecha), 'HH:mm', { locale: es });
}, []);



  // Funciones para los buscadores
  const handleClaseSearch = (term: string) => {
  setClaseSearch(term);
  setShowClaseResults(term.length > 0);
  
  // Actualizar el formData con el valor ingresado como claseId
  setFormData(prev => ({
    ...prev,
    claseId: term
  }));

  if (term.length > 0) {
    const results = clases.filter(clase => 
      clase.id.toLowerCase().includes(term.toLowerCase()) || 
      clase.estudio.toLowerCase().includes(term.toLowerCase())
    );
    setClaseSearchResults(results);
  } else {
    setClaseSearchResults([]);
  }
};

  const handleInstructorSearch = (term: string) => {
    setInstructorSearch(term)
    setShowInstructorResults(term.length > 0)
    
    if (term.length > 0) {
      const results = instructores.filter(instructor => 
        instructor.nombre.toLowerCase().includes(term.toLowerCase()) ||
        instructor.nombreCompleto?.toLowerCase().includes(term.toLowerCase())
      )
      setInstructorSearchResults(results)
    } else {
      setInstructorSearchResults([])
    }
  }

 const selectClase = (clase: Clase) => {
  setClaseSearch(clase.id);
  setFormData(prev => ({ 
    ...prev, 
    claseId: clase.id, // Asegurarse de guardar el ID de la clase
    periodoId: clase.periodoId
  }));
  setShowClaseResults(false);
  
  // Autocompletar información adicional de la clase
  setClaseInfo({
    estudio: clase.estudio,
    fecha: clase.fecha,
    disciplinaId: clase.disciplinaId,
    salon: clase.salon
  });
};

  const selectInstructor = (instructor: Instructor) => {
    setInstructorSearch(instructor.nombre)
    setFormData(prev => ({ ...prev, instructorReemplazoId: instructor.id }))
    setShowInstructorResults(false)
  }

  // Componentes renderizados
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )

  const renderClaseSearch = () => (
    <div className="relative">
      <div className="flex items-center">
        <Hash className="h-4 w-4 mr-1 text-muted-foreground" />
        <Input
          placeholder="ID de clase..."
          value={formData.claseId || ''}
          onChange={(e) => handleClaseSearch(e.target.value)}
          className="w-full"
        />
      </div>
      {showClaseResults && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {claseSearchResults.length > 0 ? (
            claseSearchResults.map(clase => (
              <div
                key={clase.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => selectClase(clase)}
              >
                <div className="font-medium">{clase.id}</div>
                <div className="text-sm text-muted-foreground">
                  {clase.estudio} - {format(new Date(clase.fecha), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-muted-foreground">No se encontraron clases</div>
          )}
        </div>
      )}
    </div>
  )

  const renderInstructorSearch = () => (
    <div className="relative">
      <Input
        placeholder="Buscar instructor..."
        value={instructorSearch}
        onChange={(e) => handleInstructorSearch(e.target.value)}
        className="w-full"
      />
      {showInstructorResults && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {instructorSearchResults.length > 0 ? (
            instructorSearchResults.map(instructor => (
              <div
                key={instructor.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => selectInstructor(instructor)}
              >
                <div className="font-medium">{instructor.nombre}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-muted-foreground">No se encontraron instructores</div>
          )}
        </div>
      )}
    </div>
  )

  const renderNewCoverRow = () => (
    <TableRow className="bg-blue-50">
      <TableCell>
        {renderClaseSearch()}
        {claseInfo && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium">Estudio:</span> {claseInfo.estudio}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {claseInfo.fecha ? format(new Date(claseInfo.fecha), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Hora:</span> {claseInfo.fecha ? format(new Date(claseInfo.fecha), 'HH:mm', { locale: es }) : 'N/A'}
                </div>
                {claseInfo.salon && (
                  <div>
                    <span className="font-medium">Id:</span> {claseInfo.id}
                  </div>
                )}
              </div>
            </div>
          )}
      </TableCell>

      <TableCell>
      {claseInfo?.fecha ? format(new Date(claseInfo.fecha), 'dd/MM/yyyy', { locale: es }) : ''}
    </TableCell>
    
    <TableCell>
      {claseInfo?.fecha ? format(new Date(claseInfo.fecha), 'HH:mm', { locale: es }) : ''}
    </TableCell>
      
      <TableCell>
        {renderInstructorSearch()}
      </TableCell>
      
      <TableCell>
        <Select
          value={formData.periodoId?.toString() || ''}
          onValueChange={(value) => setFormData(prev => ({ ...prev, periodoId: parseInt(value) }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione período" />
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
      
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={formData.justificacion || false}
          onChange={(e) => setFormData(prev => ({ ...prev, justificacion: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </TableCell>
      
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={formData.pagoBono || false}
          onChange={(e) => setFormData(prev => ({ ...prev, pagoBono: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </TableCell>
      
      <TableCell className="text-center">
        <input
          type="checkbox"
          checked={formData.pagoFullHouse || false}
          onChange={(e) => setFormData(prev => ({ ...prev, pagoFullHouse: e.target.checked }))}
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
              disabled={!formData.claseId || !formData.instructorReemplazoId || !formData.periodoId}
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
      <TableCell colSpan={10} className="text-center py-4">
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

  const renderCoverRow = (cover: Cover) => {
    if (editingCoverId === cover.id) {
      return (
        <TableRow key={cover.id} className="bg-blue-50">
          <TableCell>
            {renderClaseSearch()}
            {claseInfo && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Estudio:</span> {claseInfo.estudio}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {claseInfo.fecha ? format(new Date(claseInfo.fecha), 'dd/MM/yyyy HH:mm') : '-'}
                  </div>
                  <div>
                    <span className="font-medium">Id:</span> {claseInfo.id || '-'}
                  </div>
                  <div>
                    <span className="font-medium">Disciplina:</span> {claseInfo.disciplina?.nombre || '-'}
                  </div>
                </div>
              </div>
            )}
          </TableCell>

           <TableCell>
              {cover.clase ? formatClaseFecha(cover.clase) : ''}
            </TableCell>
            
            {/* Nueva columna Hora */}
            <TableCell>
              {cover.clase ? formatClaseHora(cover.clase) : ''}
            </TableCell>
          
          <TableCell>
            {renderInstructorSearch()}
          </TableCell>
          
          <TableCell>
            <Badge variant="outline">
              {getPeriodoInfo(cover.periodoId)}
            </Badge>
          </TableCell>
          
          <TableCell className="text-center">
            <input
              type="checkbox"
              checked={editFormData.justificacion || false}
              onChange={handleEditInputChange}
              name="justificacion"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </TableCell>
          
          <TableCell className="text-center">
            <input
              type="checkbox"
              checked={editFormData.pagoBono || false}
              onChange={handleEditInputChange}
              name="pagoBono"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </TableCell>
          
          <TableCell className="text-center">
            <input
              type="checkbox"
              checked={editFormData.pagoFullHouse || false}
              onChange={handleEditInputChange}
              name="pagoFullHouse"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </TableCell>
          
          <TableCell>
            <div className="flex gap-2">
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
          </TableCell>
        </TableRow>
      )
    }

    return (
      <TableRow key={cover.id} className="hover:bg-gray-50">
        <TableCell>
          <div className="font-medium">{cover.claseId || cover.claseTemp}</div>
          <div className="text-sm text-muted-foreground">
            {getClaseInfo(cover)}
          </div>
        </TableCell>

         <TableCell>
          {cover.clase ? formatClaseFecha(cover.clase) : ''}
        </TableCell>
        
        {/* Nueva columna Hora */}
        <TableCell>
          {cover.clase ? formatClaseHora(cover.clase) : ''}
        </TableCell>
        
        <TableCell className="font-medium">
          {getInstructorName(cover.instructorReemplazoId)}
        </TableCell>
        
        <TableCell>
          <Badge variant="outline">
            {getPeriodoInfo(cover.periodoId)}
          </Badge>
        </TableCell>
        
        <TableCell className="text-center">
          <Badge variant={cover.justificacion ? "default" : "secondary"}>
            {cover.justificacion ? 'Justificado' : 'Sin justificar'}
          </Badge>
        </TableCell>

        <TableCell className="text-center">
          {cover.pagoBono ? (
            <Check className="h-4 w-4 text-green-500 mx-auto" />
          ) : (
            <X className="h-4 w-4 text-red-500 mx-auto" />
          )}
        </TableCell>

        <TableCell className="text-center">
          {cover.pagoFullHouse ? (
            <Check className="h-4 w-4 text-green-500 mx-auto" />
          ) : (
            <X className="h-4 w-4 text-red-500 mx-auto" />
          )}
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
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
        
        <div className="flex gap-2">
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

          <Button 
            variant="outline" 
            onClick={handleEnlazarCovers}
            disabled={selectedPeriodo === 'all' || isLoadingCovers}
          >
            Enlazar Covers
          </Button>
        </div>
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
              <TableHead className="w-[300px]">Clase</TableHead>
              <TableHead className="w-[120px]">Fecha</TableHead>  
              <TableHead className="w-[80px]">Hora</TableHead>  
              <TableHead className="w-[300px]">Instructor</TableHead>
              <TableHead className='w-[150px]'>Periodo</TableHead>
              <TableHead className="w-[150px] text-center">Estado</TableHead>
              <TableHead className="w-[100px] text-center">Pago de S/80</TableHead>
              <TableHead className="w-[100px] text-center">Full</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {user?.rol !== 'USUARIO' && (isCreating ? renderNewCoverRow() : renderAddNewCoverButton())}
              {filteredCovers().map(renderCoverRow)}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogos de confirmación */}
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

      {/* Diálogo de detalles */}
      <AlertDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <AlertDialogTitle className="text-2xl font-bold text-gray-900">
                  Detalles del Cover
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Información completa del cover seleccionado
                </AlertDialogDescription>
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
          
          {isLoadingDetails ? (
            <div className="py-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-muted-foreground">Cargando detalles...</span>
              </div>
            </div>
          ) : coverSeleccionado ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Hash className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{coverSeleccionado.claseId || coverSeleccionado.claseTemp}</h3>
                    <p className="text-sm text-muted-foreground">{getClaseInfo(coverSeleccionado)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={coverSeleccionado.justificacion ? "default" : "secondary"}>
                    {coverSeleccionado.justificacion ? 'Justificado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Instructor Reemplazo</h4>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    {getInstructorName(coverSeleccionado.instructorReemplazoId)}
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Periodo</h4>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs">
                      {getPeriodoInfo(coverSeleccionado.periodoId)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  Información de Pagos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-md border border-green-100">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${coverSeleccionado.pagoBono ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">Pago de S/80</span>
                    </div>
                    <Badge variant={coverSeleccionado.pagoBono ? "default" : "secondary"}>
                      {coverSeleccionado.pagoBono ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-md border border-green-100">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${coverSeleccionado.pagoFullHouse ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">Pago Full House</span>
                    </div>
                    <Badge variant={coverSeleccionado.pagoFullHouse ? "default" : "secondary"}>
                      {coverSeleccionado.pagoFullHouse ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              </div>

              {(coverSeleccionado.cambioDeNombre || coverSeleccionado.comentarios) && (
                <div className="space-y-4">
                  {coverSeleccionado.cambioDeNombre && (
                    <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Edit className="h-4 w-4 text-orange-600" />
                        <h4 className="font-medium text-orange-900">Cambio de Nombre</h4>
                      </div>
                      <p className="text-orange-800 bg-white p-3 rounded border border-orange-200">
                        {coverSeleccionado.cambioDeNombre}
                      </p>
                    </div>
                  )}

                  {coverSeleccionado.comentarios && (
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Comentarios</h4>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-blue-800 whitespace-pre-line">
                          {coverSeleccionado.comentarios}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>Creado: </span>
                    <span className="font-medium">
                      {coverSeleccionado.createdAt ? 
                        format(addHours(new Date(coverSeleccionado.createdAt), 5), 'dd/MM/yyyy HH:mm', { locale: es }) 
                        : 'N/A'
                      }
                    </span>
                  </div>
                  {coverSeleccionado.updatedAt && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span>Actualizado: </span>
                      <span className="font-medium">
                        {format(addHours(new Date(coverSeleccionado.updatedAt), 5), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <X className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-muted-foreground">No se encontraron detalles del cover</p>
            </div>
          )}
          
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
    </div>
  )
}