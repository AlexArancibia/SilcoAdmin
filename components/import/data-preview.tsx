"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Calendar, Clock, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import type { DatosExcelClase } from "@/types/importacion"

interface DataPreviewProps {
  parsedData: DatosExcelClase[]
  paginatedData: DatosExcelClase[]
  showAllColumns: boolean
  setShowAllColumns: (show: boolean) => void
  currentPage: number
  totalPages: number
  rowsPerPage: number
  handlePrevPage: () => void
  handleNextPage: () => void
  handleRowsPerPageChange: (value: string) => void
  mainColumns: Array<{ key: string; label: string; format: (value: any) => string }>
  additionalColumns: Array<{ key: string; label: string; format: (value: any) => string }>
  formatDateTime: (value: any) => string
  formatTime: (value: any) => string
}

export function DataPreview({
  parsedData,
  paginatedData,
  showAllColumns,
  setShowAllColumns,
  currentPage,
  totalPages,
  rowsPerPage,
  handlePrevPage,
  handleNextPage,
  handleRowsPerPageChange,
  mainColumns,
  additionalColumns,
  formatDateTime,
  formatTime,
}: DataPreviewProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-primary">Vista previa de datos</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="border-muted"
          >
            {showAllColumns ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showAllColumns ? "Mostrar menos columnas" : "Mostrar todas las columnas"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 overflow-x-auto border shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">
            Se encontraron <span className="text-primary">{parsedData.length}</span> registros en el archivo.
          </p>
        </div>
        <div className="min-w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {mainColumns.map((column) => (
                  <th key={column.key} className="text-left py-2.5 px-3 font-medium text-primary">
                    {column.label}
                  </th>
                ))}
                {showAllColumns &&
                  additionalColumns.map((column) => (
                    <th key={column.key} className="text-left py-2.5 px-3 font-medium text-primary">
                      {column.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                  {mainColumns.map((column) => (
                    <td key={column.key} className="py-2.5 px-3">
                      {column.key === "Día" ? (
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                          {column.format
                            ? column.format(row[column.key as keyof DatosExcelClase])
                            : String(row[column.key as keyof DatosExcelClase] || "")}
                        </div>
                      ) : column.key === "Hora" ? (
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                          {column.format
                            ? column.format(row[column.key as keyof DatosExcelClase])
                            : String(row[column.key as keyof DatosExcelClase] || "")}
                        </div>
                      ) : column.format ? (
                        column.format(row[column.key as keyof DatosExcelClase])
                      ) : (
                        String(row[column.key as keyof DatosExcelClase] || "")
                      )}
                    </td>
                  ))}
                  {showAllColumns &&
                    additionalColumns.map((column) => (
                      <td key={column.key} className="py-2.5 px-3">
                        {column.format
                          ? column.format(row[column.key as keyof DatosExcelClase])
                          : String(row[column.key as keyof DatosExcelClase] || "")}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-xs">
              Filas por página:
            </Label>
            <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger id="rows-per-page" className="h-8 w-[70px] border-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-8 w-8 border-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 border-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
