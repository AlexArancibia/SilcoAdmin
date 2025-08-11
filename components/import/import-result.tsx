"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Info } from "lucide-react"
import type { ResultadoImportacion } from "@/types/importacion"

interface ImportResultProps {
  resultado: ResultadoImportacion
}

export function ImportResult({ resultado }: ImportResultProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Importación Completada
        </CardTitle>
        <CardDescription className="text-green-700">
          Se ha procesado la importación exitosamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {resultado.totalRegistros}
            </div>
            <div className="text-sm text-green-600">Total Registros</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {resultado.registrosImportados}
            </div>
            <div className="text-sm text-green-600">Importados</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              {resultado.registrosConError}
            </div>
            <div className="text-sm text-yellow-600">Con Errores</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {resultado.clasesCreadas}
            </div>
            <div className="text-sm text-blue-600">Clases Creadas</div>
          </div>
        </div>

        {/* Detalles adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resultado.instructoresCreados && resultado.instructoresCreados > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                {resultado.instructoresCreados} instructor(es) nuevo(s) creado(s)
              </span>
            </div>
          )}
          
          {resultado.pagosCreados && resultado.pagosCreados > 0 && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <Info className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-700">
                {resultado.pagosCreados} pago(s) creado(s)
              </span>
            </div>
          )}
          
          {resultado.asignacionesCreadas && resultado.asignacionesCreadas > 0 && (
            <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
              <Info className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-indigo-700">
                {resultado.asignacionesCreadas} asignación(es) creada(s)
              </span>
            </div>
          )}
        </div>

        {/* Errores si los hay */}
        {resultado.errores && resultado.errores.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Errores durante la importación
            </h4>
            <div className="space-y-1">
              {resultado.errores.map((error, index) => (
                <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  <span className="font-medium">Fila {error.fila}:</span> {error.mensaje}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen final */}
        <div className="text-center p-4 bg-white rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">
            La importación se ha completado con {resultado.registrosImportados} de {resultado.totalRegistros} registros procesados exitosamente.
          </p>
          {resultado.registrosConError > 0 && (
            <p className="text-yellow-700 text-sm mt-1">
              {resultado.registrosConError} registro(s) tuvieron errores y requieren atención manual.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
