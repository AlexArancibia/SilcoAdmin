"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CalculatorIcon, FileTextIcon, PrinterIcon, ChevronDown, FileSpreadsheetIcon } from "lucide-react"
import type { Periodo } from "@/types/schema"
import { PeriodSelector } from "../period-selector"

interface PageHeaderProps {
  periodosSeleccionados: Periodo[]
  exportarTodosPagosPDF: () => void
  exportarTodosExcel: () => void
  imprimirTodosPagosPDF: () => void
  isCalculatingPayments: boolean
  setShowCalculateDialog: () => void
  setShowCalculateBonosDialog: () => void
}

export function PageHeader({
  periodosSeleccionados,
  exportarTodosPagosPDF,
  exportarTodosExcel,
  imprimirTodosPagosPDF,
  isCalculatingPayments,
  setShowCalculateDialog,
  setShowCalculateBonosDialog,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-3 mb-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Pagos a Instructores</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {periodosSeleccionados.length > 0
            ? `Periodos: ${periodosSeleccionados.map((p) => `${p.numero}-${p.año}`).join(", ")}`
            : "Todos los periodos"}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <div className="flex flex-row flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <FileTextIcon className="mr-2 h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Exportar</span>
                <ChevronDown className="ml-1 h-4 w-4 sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={exportarTodosPagosPDF} className="text-sm">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarTodosExcel} className="text-sm">
                <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={imprimirTodosPagosPDF}
            className="flex-1 sm:flex-none"
          >
            <PrinterIcon className="mr-2 h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Imprimir</span>
          </Button>
        </div>

        <div className="flex flex-row flex-wrap gap-2">
          <PeriodSelector   />
          
          <Button 
            onClick={setShowCalculateDialog} 
            disabled={isCalculatingPayments}
            className="flex-1 sm:flex-none"
          >
            <CalculatorIcon className="mr-2 h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Calcular Pagos</span>
          </Button>
        </div>
      </div>
    </div>
  )
}