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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos a Instructores</h1>
        <p className="text-muted-foreground">
          {periodosSeleccionados.length > 0
            ? `Periodos: ${periodosSeleccionados.map((p) => `${p.numero}-${p.año}`).join(", ")}`
            : "Todos los periodos"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileTextIcon className="mr-2 h-4 w-4" />
              Exportar <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportarTodosPagosPDF}>
              <FileTextIcon className="mr-2 h-4 w-4" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportarTodosExcel}>
              <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={imprimirTodosPagosPDF}>
          <PrinterIcon className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" size="sm" onClick={setShowCalculateBonosDialog}>
          <CalculatorIcon className="mr-2 h-4 w-4" />
          Calcular Bonos
        </Button>
        <PeriodSelector />  
        <Button onClick={setShowCalculateDialog} disabled={isCalculatingPayments}>
          <CalculatorIcon className="mr-2 h-4 w-4" />
          Calcular Pagos
        </Button>
      </div>
    </div>
  )
}
