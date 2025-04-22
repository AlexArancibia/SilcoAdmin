import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Info, AlertCircle, Clock } from "lucide-react"
import type { ResultadoImportacion } from "@/types/importacion"

interface ImportResultProps {
  resultado: ResultadoImportacion
  detailedLogging?: boolean
  detailedLogs?: Array<{
    type: "success" | "error" | "info"
    message: string
    details?: any
    timestamp: string
  }>
}

export function ImportResult({ resultado, detailedLogging = false, detailedLogs = [] }: ImportResultProps) {
  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium text-primary">Resultado de la importación</h3>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="errores">Errores ({resultado.errores.length})</TabsTrigger>
          {detailedLogging && <TabsTrigger value="detalle">Detalle ({detailedLogs.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground">Total registros</div>
              <div className="text-2xl font-bold text-primary">{resultado.totalRegistros}</div>
            </div>
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground">Importados</div>
              <div className="text-2xl font-bold text-green-600">{resultado.registrosImportados}</div>
            </div>
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground">Con errores</div>
              <div className="text-2xl font-bold text-red-600">{resultado.registrosConError}</div>
            </div>
            <div className="bg-card p-4 rounded-lg border shadow-sm">
              <div className="text-sm text-muted-foreground">Clases creadas</div>
              <div className="text-2xl font-bold text-blue-600">{resultado.clasesCreadas}</div>
            </div>
          </div>

          {/* Mostrar información sobre clases eliminadas, instructores creados y pagos creados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {resultado.clasesEliminadas !== undefined && (
              <div className="bg-card p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-muted-foreground">Clases eliminadas previamente</div>
                <div className="text-2xl font-bold text-amber-600">{resultado.clasesEliminadas}</div>
              </div>
            )}
            {resultado.instructoresCreados !== undefined && (
              <div className="bg-card p-4 rounded-lg border shadow-sm">
                <div className="text-sm text-muted-foreground">Instructores nuevos creados</div>
                <div className="text-2xl font-bold text-purple-600">{resultado.instructoresCreados}</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="errores">
          {resultado.errores.length > 0 ? (
            <div className="bg-card rounded-lg p-4 border shadow-sm max-h-80 overflow-y-auto">
              <ul className="space-y-2">
                {resultado.errores.map((error, index) => (
                  <li key={index} className="text-sm bg-destructive/5 p-3 rounded-md border border-destructive/20">
                    <div className="font-medium text-destructive mb-1">Fila {error.fila}:</div>
                    <div className="text-foreground whitespace-pre-wrap break-words">{error.mensaje}</div>
                    {error.mensaje.includes("JSON enviado:") && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                          Ver datos JSON completos
                        </summary>
                        <pre className="mt-2 p-2 bg-muted/20 rounded text-xs overflow-x-auto">
                          {error.mensaje.substring(error.mensaje.indexOf("JSON enviado:") + 13)}
                        </pre>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-card rounded-lg p-6 border shadow-sm text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium">¡No se encontraron errores!</p>
              <p className="text-sm text-muted-foreground mt-1">La importación se completó sin problemas.</p>
            </div>
          )}
        </TabsContent>

        {detailedLogging && (
          <TabsContent value="detalle">
            {detailedLogs.length > 0 ? (
              <div className="bg-card rounded-lg p-4 border shadow-sm max-h-[500px] overflow-y-auto">
                <ul className="space-y-2">
                  {detailedLogs.map((log, index) => {
                    // Determine the styling based on log type
                    const logStyle =
                      log.type === "success"
                        ? "bg-green-50 border-green-200"
                        : log.type === "error"
                          ? "bg-red-50 border-red-200"
                          : "bg-blue-50 border-blue-200"

                    const iconComponent =
                      log.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : log.type === "error" ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-600" />
                      )

                    return (
                      <li key={index} className={`text-sm p-3 rounded-md border ${logStyle}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 font-medium">
                            {iconComponent}
                            <span>{log.message}</span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {log.timestamp}
                          </div>
                        </div>

                        {log.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                              Ver detalles
                            </summary>
                            <div className="mt-2 p-2 bg-muted/20 rounded text-xs">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex items-start mb-1">
                                  <span className="font-medium min-w-[100px]">{key}:</span>
                                  <span className="ml-2">
                                    {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <div className="bg-card rounded-lg p-6 border shadow-sm text-center">
                <Info className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                <p className="text-lg font-medium">No hay registros detallados</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No se generaron registros detallados durante la importación.
                </p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
