"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calculator, ChevronDown, Download, FileText, Loader2, Printer } from "lucide-react"
import type { Periodo } from "@/types/schema"
import { PeriodSelector } from "../period-selector"

interface PageHeaderProps {
  periodosSeleccionados: Periodo[]
  exportarTodosPagosPDF: () => void
  imprimirTodosPagosPDF: () => void
  isCalculatingPayments: boolean
  setShowCalculateDialog: (show: boolean) => void
}

export function PageHeader({
  periodosSeleccionados,
  exportarTodosPagosPDF,
  imprimirTodosPagosPDF,
  isCalculatingPayments,
  setShowCalculateDialog,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Gestión de Pagos</h1>
        <p className="text-muted-foreground">
          {periodosSeleccionados.length > 0
            ? `Mostrando pagos de ${periodosSeleccionados.length} periodos seleccionados`
            : "Mostrando todos los periodos (no hay selección)"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mr-2">
              <Download className="mr-2 h-4 w-4" />
              Exportar Pagos
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer" onClick={exportarTodosPagosPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar a PDF
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={imprimirTodosPagosPDF}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        <Button variant="default" onClick={() => setShowCalculateDialog(true)} disabled={isCalculatingPayments}>
          {isCalculatingPayments ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          Calcular Pagos
        </Button>
        <PeriodSelector />
      </div>
    </div>
  )
}
