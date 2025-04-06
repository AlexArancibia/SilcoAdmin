"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useInstructoresStore } from "@/store/useInstructoresStore"
import type { Instructor, Disciplina } from "@/types/schema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function InstructorsTable() {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [selectedDisciplina, setSelectedDisciplina] = React.useState<string>("todas")

  // Obtener instructores directamente del store
  const { instructores, fetchInstructores, isLoading, error } = useInstructoresStore()

  // Cargar instructores al montar el componente
  React.useEffect(() => {
    fetchInstructores()
  }, [fetchInstructores])

  // Extraer todas las disciplinas únicas para el filtro
  const todasDisciplinas = React.useMemo(() => {
    const disciplinasMap = new Map<number, Disciplina>()
    
    instructores.forEach(instructor => {
      instructor.disciplinas?.forEach(disciplina => {
        disciplinasMap.set(disciplina.id, disciplina)
      })
    })
    
    return Array.from(disciplinasMap.values())
  }, [instructores])

  // Filtrar instructores por disciplina seleccionada
  const filteredInstructores = React.useMemo(() => {
    if (selectedDisciplina === "todas") return instructores
    
    return instructores.filter(instructor => 
      instructor.disciplinas?.some(d => d.id.toString() === selectedDisciplina)
    )
  }, [instructores, selectedDisciplina])

  const columns: ColumnDef<Instructor>[] = [
    {
      accessorKey: "nombre",
      header: () => <div className="text-left">Nombre</div>,
      cell: ({ row }) => (
        <div className="flex items-center text-left gap-3">
          <Avatar className="h-9 w-9 border bg-background shadow-sm">
            {row.original.extrainfo?.foto ? (
              <AvatarImage src={row.original.extrainfo.foto} alt={row.getValue("nombre")} />
            ) : null}
            <AvatarFallback className="bg-secondary/10 text-secondary-foreground">
              {(row.getValue("nombre") as string).substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/instructores/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
          >
            {row.getValue("nombre")}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "disciplinas",
      header: () => <div className="text-center w-full">Disciplinas</div>,
      cell: ({ row }) => {
        const disciplinas = row.original.disciplinas || []
        if (disciplinas.length === 0) return <div className="text-muted-foreground italic text-center">No asignadas</div>

        return (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {disciplinas.map((d) => (
              <Badge
                key={`disciplina-${d.id}-${row.original.id}`}
                variant="outline"
                className="font-normal px-2 py-0.5 transition-all mb-1"
                style={{ backgroundColor: `${d.color}20`, borderColor: `${d.color}50` }}
              >
                {d.nombre}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="text-foreground group"
            >
              Fecha registro
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt!)
        return <div className="text-muted-foreground text-center">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "Detalle",
      cell: ({ row }) => {
        const instructor = row.original
        return ( 
          <div className="flex justify-center">
            <Eye 
              onClick={() => router.push(`/instructores/${instructor.id}`)}
              className="cursor-pointer hover:text-primary transition-colors"  
              size={18}
            />
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredInstructores,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (error) {
    return (
      <div className="p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5">
        <p className="text-destructive font-medium">Error al cargar los instructores: {error}</p>
        <Button onClick={() => fetchInstructores()} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border mt-4">
              <div className="h-[400px] w-full relative">
                <Skeleton className="absolute inset-0" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 pb-2">
            <Skeleton className="h-8 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nombre..."
              value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("nombre")?.setFilterValue(event.target.value)}
              className="pl-9 max-w-sm border-muted bg-background"
            />
          </div>
          
          <div className="w-full sm:w-auto">
            <Select
              value={selectedDisciplina}
              onValueChange={setSelectedDisciplina}
            >
              <SelectTrigger className="w-full sm:w-[200px] border-muted">
                <SelectValue placeholder="Filtrar por disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las disciplinas</SelectItem>
                {todasDisciplinas.map((disciplina) => (
                  <SelectItem key={`select-disciplina-${disciplina.id}`} value={disciplina.id.toString()}>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: disciplina.color }} 
                      />
                      {disciplina.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-muted/20 border-b">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-foreground font-medium">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between py-4 border-t bg-muted/10">
        <div className="flex-1 text-sm text-muted-foreground">
          Mostrando {filteredInstructores.length} instructor(es)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-muted"
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-muted"
          >
            Siguiente
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}