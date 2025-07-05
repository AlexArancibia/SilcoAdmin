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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card rounded-lg p-3 sm:p-4 shadow-sm border">
      {/* Left section - Back button and info */}
      <div className="flex items-start gap-2 sm:gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/pagos")}
          className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 bg-card border hover:bg-muted/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">Detalle de Pago</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
            <Badge 
              variant="outline" 
              className={`text-xs sm:text-sm font-medium ${getEstadoColor(pagoSeleccionado.estado)} w-max`}
            >
              {pagoSeleccionado.estado}
            </Badge>
            
            <div className="flex items-center gap-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {instructor.nombre} - {periodo ? `P${periodo.numero} ${periodo.año}` : ""}
              </p>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 rounded-full hover:bg-muted/10 ml-0.5"
                onClick={() => router.push(`/instructores/${instructor.id}`)}
                title="Ver perfil del instructor"
              >
                <Users className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-normal mt-2 sm:mt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleEstadoPago}
          className="h-8 sm:h-9 text-xs sm:text-sm bg-card border hover:bg-muted/10"
        >
          {pagoSeleccionado.estado === "PENDIENTE" ? "Aprobar" : "Marcar Pendiente"}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 sm:h-9 text-xs sm:text-sm bg-card border hover:bg-muted/10"
            >
              <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sm:inline">Exportar</span>
              <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="bg-card border w-48">
            <DropdownMenuItem 
              className="cursor-pointer text-xs sm:text-sm hover:bg-muted/10" 
              onClick={handleExportPDF}
            >
              <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Exportar a PDF
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-xs sm:text-sm hover:bg-muted/10" 
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Imprimir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}