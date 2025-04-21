"use client"

import { Button } from "@/components/ui/button"

interface PaginationProps {
  paginaActual: number
  setPaginaActual: (page: number) => void
  totalPaginas: number
  totalItems: number
}

export function Pagination({ paginaActual, setPaginaActual, totalPaginas, totalItems }: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Página {paginaActual} de {totalPaginas} • {totalItems} pagos
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaginaActual(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="border-muted"
        >
          Anterior
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
            let pageNum
            if (totalPaginas <= 5) {
              pageNum = i + 1
            } else if (paginaActual <= 3) {
              pageNum = i + 1
            } else if (paginaActual >= totalPaginas - 2) {
              pageNum = totalPaginas - 4 + i
            } else {
              pageNum = paginaActual - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === paginaActual ? "default" : "outline"}
                size="sm"
                onClick={() => setPaginaActual(pageNum)}
                className={pageNum === paginaActual ? "bg-primary text-primary-foreground" : "border-muted"}
              >
                {pageNum}
              </Button>
            )
          })}
          {totalPaginas > 5 && paginaActual < totalPaginas - 2 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          {totalPaginas > 5 && paginaActual < totalPaginas - 2 && (
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(totalPaginas)} className="border-muted">
              {totalPaginas}
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaginaActual(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="border-muted"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
