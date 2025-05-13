"use client"
import { Button } from "@/components/ui/button"
import { CalculatorIcon, FileTextIcon, PrinterIcon } from "lucide-react"
import type { Periodo } from "@/types/schema"

interface PageHeaderProps {
  periodosSeleccionados: Periodo[]
  exportarTodosPagosPDF: () => void
  imprimirTodosPagosPDF: () => void
  isCalculatingPayments: boolean
  setShowCalculateDialog: () => void
  setShowCalculateBonosDialog: () => void
}

export function PageHeader({
  periodosSeleccionados,
  exportarTodosPagosPDF,
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
        <Button variant="outline" size="sm" onClick={exportarTodosPagosPDF}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
        <Button variant="outline" size="sm" onClick={imprimirTodosPagosPDF}>
          <PrinterIcon className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button variant="outline" size="sm" onClick={setShowCalculateBonosDialog}>
          <CalculatorIcon className="mr-2 h-4 w-4" />
          Calcular Bonos
        </Button>
        <Button onClick={setShowCalculateDialog} disabled={isCalculatingPayments}>
          <CalculatorIcon className="mr-2 h-4 w-4" />
          Calcular Pagos
        </Button>
      </div>
    </div>
  )
}
