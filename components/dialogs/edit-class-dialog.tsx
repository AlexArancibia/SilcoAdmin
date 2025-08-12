"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Loader2, Trash2, Users, Check, X } from "lucide-react"
import { format, addHours, subHours, setHours, setMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useClasesStore } from "@/store/useClasesStore"
import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import type { Clase, Instructor } from "@/types/schema"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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

interface EditClassDialogProps {
  isOpen: boolean
  onClose: () => void
  classId?: string | null
  onSaved?: (clase: Clase) => void
  periodoId?: number
  instructorId?: number
  disciplinaId?: number
}

export function EditClassDialog({
  isOpen,
  onClose,
  classId,
  onSaved,
  periodoId,
  instructorId,
  disciplinaId,
}: EditClassDialogProps) {
  const { toast } = useToast()
  const { clases, actualizarClase, crearClase, eliminarClase, isLoading: isLoadingClases } = useClasesStore()
  const { disciplinas, fetchDisciplinas, isLoading: isLoadingDisciplinas } = useDisciplinasStore()
  const { instructores, fetchInstructores, isLoading: isLoadingInstructores } = useInstructoresStore()
  const { periodos, fetchPeriodos, isLoading: isLoadingPeriodos } = usePeriodosStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedHour, setSelectedHour] = useState("12")
  const [selectedMinute, setSelectedMinute] = useState("00")
  const [activeTab, setActiveTab] = useState("general")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isVersusMode, setIsVersusMode] = useState(false)
  const [additionalInstructors, setAdditionalInstructors] = useState<Instructor[]>([])
  const [instructorSearch, setInstructorSearch] = useState("")
  const [formData, setFormData] = useState<Partial<Clase> & { id?: string }>({
    id: classId || "",
    fecha: new Date(),
    instructorId: instructorId || 0,
    disciplinaId: disciplinaId || 0,
    periodoId: periodoId || 0,
    estudio: "",
    salon: "",
    ciudad: "",
    pais: "Perú",
    lugares: 30,
    reservasTotales: 0,
    listasEspera: 0,
    cortesias: 0,
    reservasPagadas: 0,
    semana: 1,
    textoEspecial: "",
  })

  // Generar opciones para horas y minutos
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutesOptions = ["00", "15", "30", "45"]

  // Cargar datos iniciales
  useEffect(() => {
    fetchDisciplinas()
    fetchInstructores()
    fetchPeriodos()
  }, [fetchDisciplinas, fetchInstructores, fetchPeriodos])

  // Cargar datos de la clase si se está editando
  useEffect(() => {
    if (classId && isOpen) {
      const claseToEdit = clases.find((c) => c.id === classId)
      if (claseToEdit) {
        // Usar la fecha original sin ajustes manuales, la zona horaria se manejará en la UI
        const fechaAjustada = claseToEdit.fecha ? new Date(claseToEdit.fecha) : new Date()

        setFormData({
          ...claseToEdit,
          fecha: fechaAjustada,
          id: classId,
        })

        // Establecer la hora y minutos seleccionados
        setSelectedHour(format(fechaAjustada, "HH"))
        setSelectedMinute(format(fechaAjustada, "mm"))
      }
    } else if (isOpen) {
      // Si es una nueva clase, establecer valores predeterminados
      const fechaActual = new Date()
      setFormData({
        id: "",
        fecha: fechaActual,
        instructorId: instructorId || 0,
        disciplinaId: disciplinaId || 0,
        periodoId: periodoId || 0,
        estudio: "",
        salon: "",
        ciudad: "",
        pais: "Perú",
        lugares: 30,
        reservasTotales: 0,
        listasEspera: 0,
        cortesias: 0,
        reservasPagadas: 0,
        semana: 1,
        textoEspecial: "",
      })

      // Establecer la hora y minutos actuales
      setSelectedHour(format(fechaActual, "HH"))
      setSelectedMinute(format(fechaActual, "mm"))
    }
  }, [classId, isOpen, clases, instructorId, disciplinaId, periodoId])

  const handleChange = (field: keyof (Clase & { id?: string }), value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleVersusModeToggle = (enabled: boolean) => {
    setIsVersusMode(enabled)
    if (!enabled) {
      setAdditionalInstructors([])
      setFormData(prev => ({ 
        ...prev, 
        esVersus: false, 
        vsNum: undefined 
      }))
    } else {
      setAdditionalInstructors([])
      setFormData(prev => ({ 
        ...prev, 
        esVersus: true, 
        vsNum: 0,
        instructorId: 0 // Limpiar instructor principal cuando se activa versus
      }))
    }
  }

  const handleInstructorToggle = (instructor: Instructor) => {
    setAdditionalInstructors(prev => {
      const isSelected = prev.some(i => i.id === instructor.id)
      if (isSelected) {
        const newList = prev.filter(i => i.id !== instructor.id)
        setFormData(prevData => ({ 
          ...prevData, 
          vsNum: newList.length 
        }))
        return newList
      } else {
        if (prev.length >= 4) { // Máximo 4 instructores total
          toast({
            title: "Límite alcanzado",
            description: "Máximo 4 instructores por clase versus",
            variant: "destructive",
          })
          return prev
        }
        const newList = [...prev, instructor]
        setFormData(prevData => ({ 
          ...prevData, 
          vsNum: newList.length 
        }))
        return newList
      }
    })
  }

  // Actualizar la fecha cuando cambia la hora o minutos
  useEffect(() => {
    if (formData.fecha) {
      const newDate = setMinutes(
        setHours(formData.fecha, Number.parseInt(selectedHour, 10)),
        Number.parseInt(selectedMinute, 10),
      )

      setFormData((prev) => ({
        ...prev,
        fecha: newDate,
      }))
    }
  }, [selectedHour, selectedMinute])

  const handleSubmit = async () => {
    if (!formData.disciplinaId || !formData.periodoId || !formData.id) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos, incluyendo el ID",
        variant: "destructive",
      })
      return
    }

    // Validar instructor solo si NO es versus
    if (!isVersusMode && !formData.instructorId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un instructor",
        variant: "destructive",
      })
      return
    }

    // Validar que el ID base no termine en letra para clases versus
    if (isVersusMode && additionalInstructors.length > 0) {
      const lastChar = formData.id.slice(-1)
      if (/[a-z]/.test(lastChar)) {
        toast({
          title: "Error",
          description: "El ID base no debe terminar en letra para clases versus. Ejemplo: usa 'VS_001' en lugar de 'VS_001a'",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // Ajustar la fecha para guardar con -5 horas
      const fechaAjustada = formData.fecha ? subHours(formData.fecha, 5) : new Date()

      if (classId) {
        // Actualizar clase existente
        const savedClase = await actualizarClase(classId, {
          ...formData,
          fecha: fechaAjustada,
        })
        toast({
          title: "Clase actualizada",
          description: "La clase se ha actualizado correctamente",
        })
        if (onSaved) {
          onSaved(savedClase)
        }
      } else {
        // Crear nueva(s) clase(s)
            if (isVersusMode && additionalInstructors.length > 0) {
      // Crear múltiples clases para versus usando el patrón del sistema de importación
      const allInstructors = additionalInstructors
      
      if (allInstructors.length === 0) {
        toast({
          title: "Error",
          description: "Debes seleccionar al menos un instructor para crear una clase versus",
          variant: "destructive",
        })
        return
      }
          const createdClasses: Clase[] = []
          const baseId = formData.id

          for (let i = 0; i < allInstructors.length; i++) {
            const instructor = allInstructors[i]
            // Usar el patrón: VS_001a, VS_001b, VS_001c, VS_001d
            const classId = `${baseId}${String.fromCharCode(97 + i)}` // 97 = 'a', 98 = 'b', etc.
            
            const claseData = {
              ...formData,
              id: classId,
              instructorId: instructor.id,
              fecha: fechaAjustada,
              esVersus: true,
              vsNum: allInstructors.length,
            } as Omit<Clase, "createdAt" | "updatedAt">

            const savedClase = await crearClase(claseData)
            createdClasses.push(savedClase)
          }

          toast({
            title: "Clases versus creadas",
            description: `Se han creado ${createdClasses.length} clases versus para ${allInstructors.length} instructores`,
          })

          if (onSaved && createdClasses.length > 0) {
            onSaved(createdClasses[0]) // Devolver la primera clase creada
          }
        } else {
          // Crear clase normal
          const savedClase = await crearClase({
            ...formData,
            id: formData.id,
            fecha: fechaAjustada,
          } as Omit<Clase, "createdAt" | "updatedAt">)
          
          toast({
            title: "Clase creada",
            description: "La clase se ha creado correctamente",
          })

          if (onSaved) {
            onSaved(savedClase)
          }
        }
      }

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la clase",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!classId) return

    setIsSubmitting(true)
    try {
      await eliminarClase(classId)
      toast({
        title: "Clase eliminada",
        description: "La clase se ha eliminado correctamente",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la clase",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setDeleteDialogOpen(false)
    }
  }

  const isLoading = isLoadingClases || isLoadingDisciplinas || isLoadingInstructores || isLoadingPeriodos

  // Encontrar el instructor y disciplina actuales
  const currentInstructor = instructores.find((i) => i.id === formData.instructorId)
  const currentDisciplina = disciplinas.find((d) => d.id === formData.disciplinaId)
  const currentPeriodo = periodos.find((p) => p.id === formData.periodoId)

  // Calcular la ocupación
  const ocupacion =
    formData.reservasTotales && formData.lugares ? Math.round((formData.reservasTotales / formData.lugares) * 100) : 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-background rounded-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/70"></div>

          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">{classId ? "Editar clase" : "Nueva clase"}</DialogTitle>
              {classId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {currentInstructor && currentDisciplina && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="secondary" className="text-xs py-0.5">
                  {currentInstructor.nombre}
                </Badge>
                <Badge
                  className="text-xs py-0.5"
                  style={{
                    backgroundColor: currentDisciplina.color ? `${currentDisciplina.color}22` : undefined,
                    color: currentDisciplina.color || undefined,
                    borderColor: currentDisciplina.color ? `${currentDisciplina.color}44` : undefined,
                  }}
                >
                  {currentDisciplina.nombre}
                </Badge>
                {formData.fecha && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs py-0.5">
                    <Clock className="h-3 w-3" />
                    {format(formData.fecha, "HH:mm")}
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <span className="text-sm text-muted-foreground">Cargando datos...</span>
              </div>
            </div>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-4 border-b">
                  <TabsList className="grid grid-cols-3 h-9">
                    <TabsTrigger value="general" className="text-xs">
                      General
                    </TabsTrigger>
                    <TabsTrigger value="ubicacion" className="text-xs">
                      Ubicación
                    </TabsTrigger>
                    <TabsTrigger value="metricas" className="text-xs">
                      Métricas
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
                  <TabsContent value="general" className="mt-0 space-y-3">
                    {/* ID de la clase (editable) */}
                    <div className="space-y-1">
                      <Label htmlFor="id" className="text-xs font-medium flex items-center">
                        ID <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      <Input
                        id="id"
                        value={formData.id || ""}
                        onChange={(e) => handleChange("id", e.target.value)}
                        className="h-8 font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Identificador único de la clase</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Instructor (solo si NO es versus) */}
                      {!isVersusMode && (
                        <div className="space-y-1">
                          <Label htmlFor="instructor" className="text-xs font-medium">
                            Instructor <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formData.instructorId?.toString() || ""}
                            onValueChange={(value) => handleChange("instructorId", Number.parseInt(value))}
                          >
                            <SelectTrigger className="h-8 text-xs" id="instructor">
                              <SelectValue placeholder="Seleccionar instructor" />
                            </SelectTrigger>
                            <SelectContent>
                              {instructores.map((instructor) => (
                                <SelectItem key={instructor.id} value={instructor.id.toString()} className="text-xs">
                                  {instructor.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Switch de Versus */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Clase Versus
                          </Label>
                          <Switch
                            checked={isVersusMode}
                            onCheckedChange={handleVersusModeToggle}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Activar para crear clase versus con múltiples instructores (misma jerarquía)
                        </p>
                      </div>

                      {/* Disciplina */}
                      <div className="space-y-1">
                        <Label htmlFor="disciplina" className="text-xs font-medium">
                          Disciplina <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formData.disciplinaId?.toString() || ""}
                          onValueChange={(value) => handleChange("disciplinaId", Number.parseInt(value))}
                        >
                          <SelectTrigger className="h-8 text-xs" id="disciplina">
                            <SelectValue placeholder="Seleccionar disciplina" />
                          </SelectTrigger>
                          <SelectContent>
                            {disciplinas.map((disciplina) => (
                              <SelectItem key={disciplina.id} value={disciplina.id.toString()} className="text-xs">
                                {disciplina.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Instructores Versus (solo si es versus) */}
                    {isVersusMode && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Seleccionar Instructores para Versus ({additionalInstructors.length}/4)
                        </Label>
                        <div className="text-xs text-muted-foreground mb-2">
                          Selecciona hasta 4 instructores para esta clase versus. Todos tienen la misma jerarquía y recibirán un bono de S/.30.
                          <br />
                          <strong>IDs generados:</strong> Si el ID base es "VS_001", se crearán: VS_001a, VS_001b, VS_001c, VS_001d
                          <br />
                          <strong>Nota:</strong> No hay instructor principal en clases versus.
                        </div>
                        
                        {/* Campo de búsqueda */}
                        <div className="space-y-1">
                          <Input
                            placeholder="Buscar instructor por nombre..."
                            value={instructorSearch}
                            onChange={(e) => setInstructorSearch(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {instructores
                            .filter(instructor => 
                              instructor.nombre.toLowerCase().includes(instructorSearch.toLowerCase()) ||
                              instructor.id.toString().includes(instructorSearch)
                            )
                            .map((instructor) => {
                              const isSelected = additionalInstructors.some(i => i.id === instructor.id)
                              
                              return (
                                <div
                                  key={instructor.id}
                                  className={cn(
                                    "flex items-center justify-between p-2 border rounded-md cursor-pointer transition-colors text-xs",
                                    isSelected
                                      ? "border-indigo-500 bg-indigo-50"
                                      : "border-border hover:border-indigo-300"
                                  )}
                                  onClick={() => handleInstructorToggle(instructor)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-3 h-3 rounded-full border-2 flex items-center justify-center",
                                      isSelected
                                        ? "border-indigo-500 bg-indigo-500"
                                        : "border-gray-300"
                                    )}>
                                      {isSelected && <Check className="w-2 h-2 text-white" />}
                                    </div>
                                    <div>
                                      <div className="font-medium">{instructor.nombre}</div>
                                      <div className="text-muted-foreground">ID: {instructor.id}</div>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
                                      Seleccionado
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                        
                        {additionalInstructors.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-2">
                            <div className="text-xs text-green-800">
                              <strong>Instructores seleccionados:</strong> {additionalInstructors.length}
                            </div>
                            <div className="text-xs text-green-700 mt-1">
                              {additionalInstructors.map(instructor => instructor.nombre).join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fecha y Hora */}
                    <div className="space-y-1">
                      <Label htmlFor="fecha" className="text-xs font-medium">
                        Fecha y hora <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Selector de fecha */}
                        <div className="col-span-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal h-8 text-xs",
                                  !formData.fecha && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                                {formData.fecha ? (
                                  format(formData.fecha, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.fecha}
                                onSelect={(date) => {
                                  if (date) {
                                    // Mantener la hora actual al cambiar la fecha
                                    const newDate = setMinutes(
                                      setHours(date, Number.parseInt(selectedHour, 10)),
                                      Number.parseInt(selectedMinute, 10),
                                    )
                                    handleChange("fecha", newDate)
                                  }
                                }}
                                initialFocus
                                locale={es}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Selector de hora */}
                        <div className="flex items-center gap-1 border rounded-md px-1.5 h-8 bg-background">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <Select value={selectedHour} onValueChange={setSelectedHour}>
                            <SelectTrigger className="h-6 w-10 border-0 p-0 pl-1 focus:ring-0 text-xs">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {hoursOptions.map((hour) => (
                                <SelectItem key={hour} value={hour} className="py-0.5 text-xs">
                                  {hour}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs">:</span>
                          <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                            <SelectTrigger className="h-6 w-10 border-0 p-0 pl-1 focus:ring-0 text-xs">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {minutesOptions.map((minute) => (
                                <SelectItem key={minute} value={minute} className="py-0.5 text-xs">
                                  {minute}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">La hora se guarda con -5 horas de diferencia.</p>
                    </div>

                    {/* Periodo */}
                    <div className="space-y-1">
                      <Label htmlFor="periodo" className="text-xs font-medium">
                        Periodo <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.periodoId?.toString() || ""}
                        onValueChange={(value) => handleChange("periodoId", Number.parseInt(value))}
                      >
                        <SelectTrigger className="h-8 text-xs" id="periodo">
                          <SelectValue placeholder="Seleccionar periodo" />
                        </SelectTrigger>
                        <SelectContent>
                          {periodos.map((periodo) => (
                            <SelectItem key={periodo.id} value={periodo.id.toString()} className="text-xs">
                              {`Periodo ${periodo.numero}/${periodo.año}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="ubicacion" className="mt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="estudio" className="text-xs font-medium">
                          Estudio
                        </Label>
                        <Input
                          id="estudio"
                          value={formData.estudio || ""}
                          onChange={(e) => handleChange("estudio", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="salon" className="text-xs font-medium">
                          Salón
                        </Label>
                        <Input
                          id="salon"
                          value={formData.salon || ""}
                          onChange={(e) => handleChange("salon", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="ciudad" className="text-xs font-medium">
                          Ciudad
                        </Label>
                        <Input
                          id="ciudad"
                          value={formData.ciudad || ""}
                          onChange={(e) => handleChange("ciudad", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="pais" className="text-xs font-medium">
                          País
                        </Label>
                        <Input
                          id="pais"
                          value={formData.pais || ""}
                          onChange={(e) => handleChange("pais", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metricas" className="mt-0 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="semana" className="text-xs font-medium">
                          Semana
                        </Label>
                        <Input
                          id="semana"
                          type="number"
                          min="1"
                          max="4"
                          value={formData.semana || ""}
                          onChange={(e) => handleChange("semana", Number.parseInt(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="lugares" className="text-xs font-medium">
                          Capacidad
                        </Label>
                        <Input
                          id="lugares"
                          type="number"
                          min="1"
                          value={formData.lugares || ""}
                          onChange={(e) => handleChange("lugares", Number.parseInt(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="listasEspera" className="text-xs font-medium">
                          Lista de espera
                        </Label>
                        <Input
                          id="listasEspera"
                          type="number"
                          min="0"
                          value={formData.listasEspera || ""}
                          onChange={(e) => handleChange("listasEspera", Number.parseInt(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Reservas */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="reservasTotales" className="text-xs font-medium">
                          Reservas totales
                        </Label>
                        <Input
                          id="reservasTotales"
                          type="number"
                          min="0"
                          value={formData.reservasTotales || ""}
                          onChange={(e) => handleChange("reservasTotales", Number.parseInt(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reservasPagadas" className="text-xs font-medium">
                          Reservas pagadas
                        </Label>
                        <Input
                          id="reservasPagadas"
                          type="number"
                          min="0"
                          value={formData.reservasPagadas || ""}
                          onChange={(e) => handleChange("reservasPagadas", Number.parseInt(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="cortesias" className="text-xs font-medium">
                          Cortesías
                        </Label>
                        <Input
                          id="cortesias"
                          type="number"
                          min="0"
                          value={formData.cortesias || ""}
                          onChange={(e) => handleChange("cortesias", Number.parseInt(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Ocupación - Mejorado */}
                    <div className="space-y-1.5 bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-xs font-medium">Ocupación</Label>
                        <Badge
                          variant={ocupacion > 80 ? "destructive" : ocupacion > 50 ? "default" : "secondary"}
                          className="font-medium text-xs py-0"
                        >
                          {ocupacion}%
                        </Badge>
                      </div>
                      <div className="w-full bg-background border rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            ocupacion > 80 ? "bg-destructive" : ocupacion > 50 ? "bg-amber-500" : "bg-emerald-500",
                          )}
                          style={{ width: `${Math.min(ocupacion, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ocupacion > 80 ? "Alta demanda" : ocupacion > 50 ? "Demanda moderada" : "Baja ocupación"}
                      </p>
                    </div>

                    {/* Texto especial */}
                    <div className="space-y-1">
                      <Label htmlFor="textoEspecial" className="text-xs font-medium">
                        Notas adicionales
                      </Label>
                      <Textarea
                        id="textoEspecial"
                        value={formData.textoEspecial || ""}
                        onChange={(e) => handleChange("textoEspecial", e.target.value)}
                        placeholder="Información adicional sobre la clase..."
                        className="min-h-[60px] resize-none text-sm"
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}

          <DialogFooter className="p-3 bg-muted/30 border-t flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="sm" className="h-7 text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || isSubmitting} size="sm" className="h-7 px-4 text-xs">
              {isSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {classId 
                ? "Guardar cambios" 
                : isVersusMode && additionalInstructors.length > 0
                ? `Crear ${additionalInstructors.length} clases versus`
                : isVersusMode && additionalInstructors.length === 0
                ? "Seleccionar instructores"
                : "Crear clase"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar clase?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La clase será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              {isSubmitting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
