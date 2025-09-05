"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBrandeoStore } from "@/store/useBrandeoStore";
import { useInstructoresStore } from "@/store/useInstructoresStore";
import { usePeriodosStore } from "@/store/usePeriodosStore";
import { Brandeo, Instructor, Periodo } from "@/types/schema";
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
import { Plus, Search, Edit, Trash2, Eye, Check, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { performanceMonitor } from "@/utils/performance-monitor";
import { PerformanceDebugPanel } from "@/components/debug/performance-debug-panel";

export default function BrandeosPage() {
  const { toast } = useToast();
  const {
    brandeos,
    loading,
    error,
    pagination,
    fetchBrandeos,
    createBrandeo,
    updateBrandeo,
    deleteBrandeo,
    getBrandeo,
    clearError,
  } = useBrandeoStore();

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
  const [selectedBrandeo, setSelectedBrandeo] = useState<Brandeo | null>(null);
  const [instructorSearchCreate, setInstructorSearchCreate] = useState("");
  const [instructorSearchEdit, setInstructorSearchEdit] = useState("");
  const [openCreateInstructor, setOpenCreateInstructor] = useState(false);
  const [openEditInstructor, setOpenEditInstructor] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estados del formulario
  const [formData, setFormData] = useState({
    numero: "",
    instructorId: "",
    periodoId: "",
    comentarios: "",
  });

  // Cargar datos iniciales de forma optimizada
  useEffect(() => {
    const loadInitialData = async () => {
      await performanceMonitor.measureAsync('load-brandeos', () => 
        fetchBrandeos({ page: currentPage, limit: pageSize })
      );
    };
    
    loadInitialData();
  }, [currentPage, pageSize, fetchBrandeos]);

  // Cargar instructores si no están disponibles (con caché)
  useEffect(() => {
    if (instructores.length === 0 && !isLoadingInstructores) {
      performanceMonitor.measureAsync('load-instructores', () => fetchInstructores());
    }
  }, [instructores.length, isLoadingInstructores, fetchInstructores]);

  // Cargar periodos si no están disponibles (con caché)
  useEffect(() => {
    if (periodos.length === 0 && !isLoadingPeriodos) {
      performanceMonitor.measureAsync('load-periodos', () => fetchPeriodos());
    }
  }, [periodos.length, isLoadingPeriodos, fetchPeriodos]);

  // Filtrar brandeos (optimizado con useCallback)
  const handleSearch = useCallback(() => {
    performanceMonitor.measure('search-brandeos', () => {
      const params: any = { page: 1, limit: pageSize };
      if (searchTerm) params.busqueda = searchTerm;
      if (selectedPeriodo && selectedPeriodo !== "all") params.periodoId = selectedPeriodo;
      if (selectedInstructor && selectedInstructor !== "all") params.instructorId = selectedInstructor;
      
      setCurrentPage(1);
      fetchBrandeos(params);
    });
  }, [searchTerm, selectedPeriodo, selectedInstructor, pageSize, fetchBrandeos]);

  // Limpiar filtros (optimizado con useCallback)
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedPeriodo("all");
    setSelectedInstructor("all");
    setCurrentPage(1);
    fetchBrandeos({ page: 1, limit: pageSize });
  }, [pageSize, fetchBrandeos]);

  // Navegación de páginas (optimizado con useCallback)
  const goToPage = useCallback((page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) return;
    setCurrentPage(page);
    const params: any = { page, limit: pageSize };
    if (searchTerm) params.busqueda = searchTerm;
    if (selectedPeriodo && selectedPeriodo !== "all") params.periodoId = selectedPeriodo;
    if (selectedInstructor && selectedInstructor !== "all") params.instructorId = selectedInstructor;
    fetchBrandeos(params);
  }, [searchTerm, selectedPeriodo, selectedInstructor, pageSize, pagination, fetchBrandeos]);

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => pagination && goToPage(pagination.totalPages);
  const goToNextPage = () => pagination && goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  // Cambiar tamaño de página
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    const params: any = { page: 1, limit: newSize };
    if (searchTerm) params.busqueda = searchTerm;
    if (selectedPeriodo && selectedPeriodo !== "all") params.periodoId = selectedPeriodo;
    if (selectedInstructor && selectedInstructor !== "all") params.instructorId = selectedInstructor;
    fetchBrandeos(params);
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
  const openEditDialog = (brandeo: Brandeo) => {
    setSelectedBrandeo(brandeo);
    setFormData({
      numero: brandeo.numero.toString(),
      instructorId: brandeo.instructorId.toString(),
      periodoId: brandeo.periodoId.toString(),
      comentarios: brandeo.comentarios || "",
    });
    setInstructorSearchEdit("");
    setOpenEditInstructor(false);
    setIsEditDialogOpen(true);
  };

  // Crear brandeo
  const handleCreate = async () => {
    if (!formData.numero || !formData.instructorId || !formData.periodoId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const result = await createBrandeo({
      numero: parseInt(formData.numero),
      instructorId: parseInt(formData.instructorId),
      periodoId: parseInt(formData.periodoId),
      comentarios: formData.comentarios || undefined,
    });

    if (result) {
      toast({
        title: "Éxito",
        description: "Brandeo creado correctamente",
      });
      setIsCreateDialogOpen(false);
      fetchBrandeos();
    }
  };

  // Actualizar brandeo
  const handleUpdate = async () => {
    if (!selectedBrandeo || !formData.numero || !formData.instructorId || !formData.periodoId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const result = await updateBrandeo(selectedBrandeo.id, {
      numero: parseInt(formData.numero),
      instructorId: parseInt(formData.instructorId),
      periodoId: parseInt(formData.periodoId),
      comentarios: formData.comentarios || undefined,
    });

    if (result) {
      toast({
        title: "Éxito",
        description: "Brandeo actualizado correctamente",
      });
      setIsEditDialogOpen(false);
      fetchBrandeos();
    }
  };

  // Eliminar brandeo
  const handleDelete = async (id: number) => {
    const result = await deleteBrandeo(id);
    if (result) {
      toast({
        title: "Éxito",
        description: "Brandeo eliminado correctamente",
      });
      fetchBrandeos();
    }
  };

  // Obtener nombre del instructor (optimizado con useMemo)
  const getInstructorName = useCallback((instructorId: number) => {
    const instructor = instructores.find(i => i.id === instructorId);
    return instructor ? instructor.nombre : "Desconocido";
  }, [instructores]);

  // Obtener información del periodo (optimizado con useMemo)
  const getPeriodoInfo = useCallback((periodoId: number) => {
    const periodo = periodos.find(p => p.id === periodoId);
    return periodo ? `P${periodo.numero} - ${periodo.año}` : "Desconocido";
  }, [periodos]);

  // Filtrar instructores por búsqueda (optimizado con useMemo)
  const getFilteredInstructors = useCallback((searchTerm: string) => {
    if (!searchTerm) return instructores;
    return instructores.filter(instructor =>
      instructor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instructores]);

  // Memoizar el estado de carga general
  const isLoading = useMemo(() => 
    loading || isLoadingInstructores || isLoadingPeriodos, 
    [loading, isLoadingInstructores, isLoadingPeriodos]
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Panel de Debug de Rendimiento */}
      <PerformanceDebugPanel />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brandeos</h1>
          <p className="text-muted-foreground">
            Gestiona los brandeos de los instructores
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Brandeo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Brandeo</DialogTitle>
              <DialogDescription>
                Completa la información del brandeo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                             <div>
                 <Label htmlFor="numero">Total de Brandeos *</Label>
                 <Input
                   id="numero"
                   type="number"
                   value={formData.numero}
                   onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                   placeholder="Ingresa el total de brandeos"
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
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear"
                )}
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
          <CardTitle>Brandeos</CardTitle>
          <CardDescription>
            {pagination && `Mostrando ${brandeos.length} de ${pagination.total} brandeos (Página ${currentPage} de ${pagination.totalPages})`}
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Cargando brandeos...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : brandeos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-muted-foreground">No se encontraron brandeos</div>
                        {searchTerm || selectedPeriodo !== "all" || selectedInstructor !== "all" ? (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            Limpiar filtros
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  brandeos.map((brandeo) => (
                    <TableRow key={brandeo.id}>
                                             <TableCell>
                         <Badge variant="secondary">{brandeo.numero}</Badge>
                       </TableCell>
                      <TableCell>{getInstructorName(brandeo.instructorId)}</TableCell>
                      <TableCell>{getPeriodoInfo(brandeo.periodoId)}</TableCell>
                      <TableCell>
                        {brandeo.comentarios ? (
                          <span className="text-sm text-muted-foreground">
                            {brandeo.comentarios.length > 50
                              ? `${brandeo.comentarios.substring(0, 50)}...`
                              : brandeo.comentarios}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin comentarios</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {brandeo.createdAt
                          ? new Date(brandeo.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(brandeo)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Brandeo</DialogTitle>
                                <DialogDescription>
                                  Modifica la información del brandeo
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                                                 <div>
                                   <Label htmlFor="edit-numero">Total de Brandeos *</Label>
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
                                  {loading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Actualizando...
                                    </>
                                  ) : (
                                    "Actualizar"
                                  )}
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
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el brandeo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(brandeo.id)}
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

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} resultados
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-2">
                    Página {currentPage} de {pagination.totalPages}
                  </span>
                  
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === pagination.totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === pagination.totalPages}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 