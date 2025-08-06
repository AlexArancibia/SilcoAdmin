"use client";

import { useState, useEffect } from "react";
import { useWorkshopStore } from "@/store/useWorkshopStore";
import { useInstructoresStore } from "@/store/useInstructoresStore";
import { usePeriodosStore } from "@/store/usePeriodosStore";
import { Workshop, Instructor, Periodo } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Calendar, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkshopsPage() {
  const { toast } = useToast();
  const {
    workshops,
    loading,
    error,
    pagination,
    fetchWorkshops,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    getWorkshop,
    clearError,
  } = useWorkshopStore();

  const {
    instructores,
    isLoading: isLoadingInstructores,
    fetchInstructores,
  } = useInstructoresStore();

  const {
    periodos,
    isLoading: isLoadingPeriodos,
    fetchPeriodos,
  } = usePeriodosStore();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("all");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [instructorSearchCreate, setInstructorSearchCreate] = useState("");
  const [instructorSearchEdit, setInstructorSearchEdit] = useState("");
  const [openCreateInstructor, setOpenCreateInstructor] = useState(false);
  const [openEditInstructor, setOpenEditInstructor] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    instructorId: "",
    periodoId: "",
    fecha: "",
    comentarios: "",
    pago: "",
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchWorkshops();
  }, []);

  // Cargar instructores si no están disponibles
  useEffect(() => {
    if (instructores.length === 0 && !isLoadingInstructores) {
      fetchInstructores();
    }
  }, [instructores.length, isLoadingInstructores, fetchInstructores]);

  // Cargar periodos si no están disponibles
  useEffect(() => {
    if (periodos.length === 0 && !isLoadingPeriodos) {
      fetchPeriodos();
    }
  }, [periodos.length, isLoadingPeriodos, fetchPeriodos]);

  // Filtrar workshops
  const handleSearch = () => {
    const params: any = {};
    if (searchTerm) params.busqueda = searchTerm;
    if (selectedPeriodo && selectedPeriodo !== "all") params.periodoId = selectedPeriodo;
    if (selectedInstructor && selectedInstructor !== "all") params.instructorId = selectedInstructor;
    
    fetchWorkshops(params);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPeriodo("all");
    setSelectedInstructor("all");
    fetchWorkshops();
  };

  // Abrir diálogo de creación
  const openCreateDialog = () => {
    setFormData({
      nombre: "",
      instructorId: "",
      periodoId: "",
      fecha: "",
      comentarios: "",
      pago: "",
    });
    setInstructorSearchCreate("");
    setOpenCreateInstructor(false);
    setIsCreateDialogOpen(true);
  };

  // Abrir diálogo de edición
  const openEditDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setFormData({
      nombre: workshop.nombre,
      instructorId: workshop.instructorId.toString(),
      periodoId: workshop.periodoId.toString(),
      fecha: new Date(workshop.fecha).toISOString().split('T')[0],
      comentarios: workshop.comentarios || "",
      pago: workshop.pago.toString(),
    });
    setInstructorSearchEdit("");
    setOpenEditInstructor(false);
    setIsEditDialogOpen(true);
  };

  // Crear workshop
  const handleCreate = async () => {
    if (!formData.nombre || !formData.instructorId || !formData.periodoId || !formData.fecha || !formData.pago) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const result = await createWorkshop({
      nombre: formData.nombre,
      instructorId: parseInt(formData.instructorId),
      periodoId: parseInt(formData.periodoId),
      fecha: new Date(formData.fecha),
      comentarios: formData.comentarios || undefined,
      pago: parseFloat(formData.pago),
    });

    if (result) {
      toast({
        title: "Éxito",
        description: "Workshop creado correctamente",
      });
      setIsCreateDialogOpen(false);
      fetchWorkshops();
    }
  };

  // Actualizar workshop
  const handleUpdate = async () => {
    if (!selectedWorkshop || !formData.nombre || !formData.instructorId || !formData.periodoId || !formData.fecha || !formData.pago) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const result = await updateWorkshop(selectedWorkshop.id, {
      nombre: formData.nombre,
      instructorId: parseInt(formData.instructorId),
      periodoId: parseInt(formData.periodoId),
      fecha: new Date(formData.fecha),
      comentarios: formData.comentarios || undefined,
      pago: parseFloat(formData.pago),
    });

    if (result) {
      toast({
        title: "Éxito",
        description: "Workshop actualizado correctamente",
      });
      setIsEditDialogOpen(false);
      fetchWorkshops();
    }
  };

  // Eliminar workshop
  const handleDelete = async (id: number) => {
    const result = await deleteWorkshop(id);
    if (result) {
      toast({
        title: "Éxito",
        description: "Workshop eliminado correctamente",
      });
      fetchWorkshops();
    }
  };

  // Obtener nombre del instructor
  const getInstructorName = (instructorId: number) => {
    const instructor = instructores.find(i => i.id === instructorId);
    return instructor ? instructor.nombre : "Desconocido";
  };

  // Obtener información del periodo
  const getPeriodoInfo = (periodoId: number) => {
    const periodo = periodos.find(p => p.id === periodoId);
    return periodo ? `P${periodo.numero} - ${periodo.año}` : "Desconocido";
  };

  // Formatear fecha
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filtrar instructores por búsqueda
  const getFilteredInstructors = (searchTerm: string) => {
    if (!searchTerm) return instructores;
    return instructores.filter(instructor =>
      instructor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workshops</h1>
          <p className="text-muted-foreground">
            Gestiona los workshops de los instructores
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Workshop
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Workshop</DialogTitle>
              <DialogDescription>
                Completa la información del workshop
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Workshop *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ingresa el nombre del workshop"
                />
              </div>
              <div>
                <Label htmlFor="instructor">Instructor *</Label>
                <Popover open={openCreateInstructor} onOpenChange={setOpenCreateInstructor}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCreateInstructor}
                      className="w-full justify-between"
                    >
                      {formData.instructorId
                        ? instructores.find((instructor) => instructor.id.toString() === formData.instructorId)?.nombre
                        : "Selecciona un instructor..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar instructor..." />
                      <CommandList>
                        <CommandEmpty>No se encontró instructor.</CommandEmpty>
                        <CommandGroup>
                          {instructores.map((instructor) => (
                            <CommandItem
                              key={instructor.id}
                              value={instructor.nombre}
                              onSelect={() => {
                                setFormData({ ...formData, instructorId: instructor.id.toString() });
                                setOpenCreateInstructor(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.instructorId === instructor.id.toString() ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {instructor.nombre}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="periodo">Periodo *</Label>
                <Select
                  value={formData.periodoId}
                  onValueChange={(value) => setFormData({ ...formData, periodoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.id} value={periodo.id.toString()}>
                        P{periodo.numero} - {periodo.año}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha">Fecha del Workshop *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pago">Pago (S/) *</Label>
                <Input
                  id="pago"
                  type="number"
                  step="0.01"
                  value={formData.pago}
                  onChange={(e) => setFormData({ ...formData, pago: e.target.value })}
                  placeholder="Ingresa el monto a pagar"
                />
              </div>
              <div>
                <Label htmlFor="comentarios">Comentarios</Label>
                <Textarea
                  id="comentarios"
                  value={formData.comentarios}
                  onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                  placeholder="Comentarios adicionales (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre, instructor o comentarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="periodo-filter">Periodo</Label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los periodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los periodos</SelectItem>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      P{periodo.numero} - {periodo.año}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="instructor-filter">Instructor</Label>
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los instructores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los instructores</SelectItem>
                  {instructores.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end space-x-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Workshops</CardTitle>
          <CardDescription>
            {pagination && `Mostrando ${workshops.length} de ${pagination.total} workshops`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Comentarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : workshops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No se encontraron workshops
                    </TableCell>
                  </TableRow>
                ) : (
                  workshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell>
                        <div className="font-medium">{workshop.nombre}</div>
                      </TableCell>
                      <TableCell>{getInstructorName(workshop.instructorId)}</TableCell>
                      <TableCell>{getPeriodoInfo(workshop.periodoId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(workshop.fecha)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          S/ {workshop.pago.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {workshop.comentarios ? (
                          <span className="text-sm text-muted-foreground">
                            {workshop.comentarios.length > 50
                              ? `${workshop.comentarios.substring(0, 50)}...`
                              : workshop.comentarios}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin comentarios</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(workshop)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Editar Workshop</DialogTitle>
                                <DialogDescription>
                                  Modifica la información del workshop
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-nombre">Nombre del Workshop *</Label>
                                  <Input
                                    id="edit-nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-instructor">Instructor *</Label>
                                  <Popover open={openEditInstructor} onOpenChange={setOpenEditInstructor}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openEditInstructor}
                                        className="w-full justify-between"
                                      >
                                        {formData.instructorId
                                          ? instructores.find((instructor) => instructor.id.toString() === formData.instructorId)?.nombre
                                          : "Selecciona un instructor..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                      <Command>
                                        <CommandInput placeholder="Buscar instructor..." />
                                        <CommandList>
                                          <CommandEmpty>No se encontró instructor.</CommandEmpty>
                                          <CommandGroup>
                                            {instructores.map((instructor) => (
                                              <CommandItem
                                                key={instructor.id}
                                                value={instructor.nombre}
                                                onSelect={() => {
                                                  setFormData({ ...formData, instructorId: instructor.id.toString() });
                                                  setOpenEditInstructor(false);
                                                }}
                                              >
                                                <Check
                                                  className={`mr-2 h-4 w-4 ${
                                                    formData.instructorId === instructor.id.toString() ? "opacity-100" : "opacity-0"
                                                  }`}
                                                />
                                                {instructor.nombre}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div>
                                  <Label htmlFor="edit-periodo">Periodo *</Label>
                                  <Select
                                    value={formData.periodoId}
                                    onValueChange={(value) => setFormData({ ...formData, periodoId: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {periodos.map((periodo) => (
                                        <SelectItem key={periodo.id} value={periodo.id.toString()}>
                                          P{periodo.numero} - {periodo.año}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit-fecha">Fecha del Workshop *</Label>
                                  <Input
                                    id="edit-fecha"
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-pago">Pago (S/) *</Label>
                                  <Input
                                    id="edit-pago"
                                    type="number"
                                    step="0.01"
                                    value={formData.pago}
                                    onChange={(e) => setFormData({ ...formData, pago: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-comentarios">Comentarios</Label>
                                  <Textarea
                                    id="edit-comentarios"
                                    value={formData.comentarios}
                                    onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button onClick={handleUpdate} disabled={loading}>
                                  {loading ? "Actualizando..." : "Actualizar"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el workshop.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(workshop.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 