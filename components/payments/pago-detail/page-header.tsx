"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, ChevronDown, Download, FileText, Printer, Users } from "lucide-react"
import type { Instructor, Periodo, PagoInstructor, EstadoPago } from "@/types/schema"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

interface PageHeaderProps {
  instructor: Instructor
  periodo: Periodo
  pagoSeleccionado: PagoInstructor
  getEstadoColor: (estado: EstadoPago) => string
  toggleEstadoPago: () => void
  handleExportPDF: () => void
  handlePrint: () => void
  router: AppRouterInstance
}

export function PageHeader({
  instructor,
  periodo,
  pagoSeleccionado,
  getEstadoColor,
  toggleEstadoPago,
  handleExportPDF,
  handlePrint,
  router,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card rounded-lg p-4 shadow-sm border">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/pagos")}
          className="h-10 w-10 shrink-0 bg-card border hover:bg-muted/10 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Detalle de Pago</h1>
          <div className="flex items-center mt-1">
            <Badge variant="outline" className={`mr-2 font-medium ${getEstadoColor(pagoSeleccionado.estado)}`}>
              {pagoSeleccionado.estado}
            </Badge>
            <div className="flex items-center">
              <p className="text-muted-foreground">
                {instructor.nombre} - {periodo ? `Periodo ${periodo.numero} - ${periodo.año}` : ""}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-6 w-6 p-0 rounded-full hover:bg-muted/10"
                onClick={() => router.push(`/admin/instructores/${instructor.id}`)}
                title="Ver perfil del instructor"
              >
                <Users className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 bg-card border hover:bg-muted/10">
              <Download className="mr-2 h-4 w-4" />
              Exportar
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border">
            <DropdownMenuItem className="cursor-pointer hover:bg-muted/10" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar a PDF
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-muted/10" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
