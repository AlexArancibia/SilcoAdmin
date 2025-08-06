"use client";

import { useState, useEffect } from "react";
import { useThemeRideStore } from "@/store/useThemeRideStore";
import { useInstructoresStore } from "@/store/useInstructoresStore";
import { usePeriodosStore } from "@/store/usePeriodosStore";
import { ThemeRide, Instructor, Periodo } from "@/types/schema";
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
import { Plus, Search, Edit, Trash2, Eye, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ThemeRidesPage() {
  const { toast } = useToast();
  const {
    themeRides,
    loading,
    error,
    pagination,
    fetchThemeRides,
    createThemeRide,
    updateThemeRide,
    deleteThemeRide,
    getThemeRide,
    clearError,
  } = useThemeRideStore();

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
  const [selectedThemeRide, setSelectedThemeRide] = useState<ThemeRide | null>(null);
  const [instructorSearchCreate, setInstructorSearchCreate] = useState("");
  const [instructorSearchEdit, setInstructorSearchEdit] = useState("");
  const [openCreateInstructor, setOpenCreateInstructor] = useState(false);
  const [openEditInstructor, setOpenEditInstructor] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    numero: "",
    instructorId: "",
    periodoId: "",
    comentarios: "",
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchThemeRides();
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

  // Filtrar theme rides
  const handleSearch = () => {
    const params: any = {};
    if (searchTerm) params.busqueda = searchTerm;
    if (selectedPeriodo && selectedPeriodo !== "all") params.periodoId = selectedPeriodo;
    if (selectedInstructor && selectedInstructor !== "all") params.instructorId = selectedInstructor;
    
    fetchThemeRides(params);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPeriodo("all");
    setSelectedInstructor("all");
    fetchThemeRides();
  };

  // Abrir diálogo de creación
  const openCreateDialog = () => {
    setFormData({
      numero: "",
      instructorId: "",
      periodoId: "",
      comentarios: "",
    });
    setInstructorSearchCreate("");
    setOpenCreateInstructor(false);
    setIsCreateDialogOpen(true);
  };

  // Abrir diálogo de edición
  const openEditDialog = (themeRide: ThemeRide) => {
    setSelectedThemeRide(themeRide);
    setFormData({
      numero: themeRide.numero.toString(),
      instructorId: themeRide.instructorId.toString(),
      periodoId: themeRide.periodoId.toString(),
      comentarios: themeRide.comentarios || "",
    });
    setInstructorSearchEdit("");
    setOpenEditInstructor(false);
    setIsEditDialogOpen(true);
  };

  // Crear theme ride
  const handleCreate = async () => {
    if (!formData.numero || !formData.instructorId || !formData.periodoId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const result = await createThemeRide({
      numero: parseInt(formData.numero),
      instructorId: parseInt(formData.instructorId),
      periodoId: parseInt(formData.periodoId),
      comentarios: formData.comentarios || undefined,
    });

    if (result) {
      toast({
        title: "Éxito",
        description: "Theme ride creado correctamente",
      });
      setIsCreateDialogOpen(false);
      fetchThemeRides();
    }
  };

  // Actualizar theme ride
  const handleUpdate = async () => {
    if (!selectedThemeRide || !formData.numero || !formData.instructorId || !formData.periodoId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const result = await updateThemeRide(selectedThemeRide.id, {
      numero: parseInt(formData.numero),
      instructorId: parseInt(formData.instructorId),
      periodoId: parseInt(formData.periodoId),
      comentarios: formData.comentarios || undefined,
    });

    if (result) {
      toast({
        title: "Éxito",
        description: "Theme ride actualizado correctamente",
      });
      setIsEditDialogOpen(false);
      fetchThemeRides();
    }
  };

  // Eliminar theme ride
  const handleDelete = async (id: number) => {
    const result = await deleteThemeRide(id);
    if (result) {
      toast({
        title: "Éxito",
        description: "Theme ride eliminado correctamente",
      });
      fetchThemeRides();
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
          <h1 className="text-3xl font-bold">Theme Rides</h1>
          <p className="text-muted-foreground">
            Gestiona los theme rides de los instructores
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Theme Ride
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Theme Ride</DialogTitle>
              <DialogDescription>
                Completa la información del theme ride
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numero">Total de Theme Rides *</Label>
                <Input
                  id="numero"
                  type="number"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Ingresa el total de theme rides"
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
                placeholder="Buscar por instructor o comentarios..."
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
          <CardTitle>Theme Rides</CardTitle>
          <CardDescription>
            {pagination && `Mostrando ${themeRides.length} de ${pagination.total} theme rides`}
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
                  <TableHead>Total</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Comentarios</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : themeRides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No se encontraron theme rides
                    </TableCell>
                  </TableRow>
                ) : (
                  themeRides.map((themeRide) => (
                    <TableRow key={themeRide.id}>
                      <TableCell>
                        <Badge variant="secondary">{themeRide.numero}</Badge>
                      </TableCell>
                      <TableCell>{getInstructorName(themeRide.instructorId)}</TableCell>
                      <TableCell>{getPeriodoInfo(themeRide.periodoId)}</TableCell>
                      <TableCell>
                        {themeRide.comentarios ? (
                          <span className="text-sm text-muted-foreground">
                            {themeRide.comentarios.length > 50
                              ? `${themeRide.comentarios.substring(0, 50)}...`
                              : themeRide.comentarios}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin comentarios</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {themeRide.createdAt
                          ? new Date(themeRide.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(themeRide)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Theme Ride</DialogTitle>
                                <DialogDescription>
                                  Modifica la información del theme ride
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-numero">Total de Theme Rides *</Label>
                                  <Input
                                    id="edit-numero"
                                    type="number"
                                    value={formData.numero}
                                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
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
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el theme ride.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(themeRide.id)}
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