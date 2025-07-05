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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      <div className="text-sm text-muted-foreground text-center sm:text-left">
        Página {paginaActual} de {totalPaginas} • {totalItems} pagos
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaginaActual(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="border-muted px-3 sm:px-4"
        >
          <span className="sr-only sm:not-sr-only">Anterior</span>
          <span className="sm:hidden">{"<"}</span>
        </Button>

        <div className="flex items-center gap-1">
          {/* Always show first page */}
          <Button
            variant={1 === paginaActual ? "default" : "outline"}
            size="sm"
            onClick={() => setPaginaActual(1)}
            className={`border-muted px-2 sm:px-3 ${1 === paginaActual ? "bg-primary text-primary-foreground" : ""}`}
          >
            1
          </Button>

          {/* Show ellipsis if current page is not adjacent to first page */}
          {paginaActual > 3 && totalPaginas > 3 && (
            <span className="px-1 text-muted-foreground">...</span>
          )}

          {/* Show current page and adjacent pages */}
          {paginaActual > 1 && paginaActual < totalPaginas && (
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-primary-foreground px-2 sm:px-3"
            >
              {paginaActual}
            </Button>
          )}

          {/* Show ellipsis if current page is not adjacent to last page */}
          {paginaActual < totalPaginas - 2 && totalPaginas > 3 && (
            <span className="px-1 text-muted-foreground">...</span>
          )}

          {/* Always show last page if there's more than one page */}
          {totalPaginas > 1 && (
            <Button
              variant={totalPaginas === paginaActual ? "default" : "outline"}
              size="sm"
              onClick={() => setPaginaActual(totalPaginas)}
              className={`border-muted px-2 sm:px-3 ${totalPaginas === paginaActual ? "bg-primary text-primary-foreground" : ""}`}
            >
              {totalPaginas}
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaginaActual(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="border-muted px-3 sm:px-4"
        >
          <span className="sr-only sm:not-sr-only">Siguiente</span>
          <span className="sm:hidden">{">"}</span>
        </Button>
      </div>
    </div>
  )
}