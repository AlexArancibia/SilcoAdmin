"use client"

import { useState } from "react"
import { Loader2, Download, ChevronDown, ChevronRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ProcessLogsDialogProps {
  showProcessLogsDialog: boolean
  setShowProcessLogsDialog: (show: boolean) => void
  processLogs: string[]
}

export function ProcessLogsDialog({
  showProcessLogsDialog,
  setShowProcessLogsDialog,
  processLogs,
}: ProcessLogsDialogProps) {
  // Function to export logs as text file
  const exportLogs = () => {
    const text = processLogs.join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payment-calculation-logs-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Modificar la función formatLogEntry para mejorar la visualización de los logs
  const formatLogEntry = (log: string) => {
    // Check for different types of log entries and apply appropriate styling
    if (log.includes("✅")) {
      return <div className="text-green-600 dark:text-green-400">{log}</div>
    } else if (log.includes("⚠️")) {
      return <div className="text-amber-600 dark:text-amber-400">{log}</div>
    } else if (log.includes("❌")) {
      return <div className="text-red-600 dark:text-red-400">{log}</div>
    } else if (log.includes("💰 PAGO POR CLASE:")) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded my-1 text-blue-800 dark:text-blue-300 font-mono text-xs">
          {log}
        </div>
      )
    } else if (log.includes("🏆 ANÁLISIS DE CATEGORÍA:")) {
      return (
        <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded my-1 text-purple-800 dark:text-purple-300 font-mono text-xs">
          {log}
        </div>
      )
    } else if (log.includes("⏱️ HORARIO NO PRIME:")) {
      return (
        <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded my-1 text-amber-800 dark:text-amber-300 font-mono text-xs">
          {log}
        </div>
      )
    } else if (log.includes("[INSTRUCTOR:")) {
      // Instructor header
      return (
        <div className="mt-4 pt-2 border-t border-muted font-semibold text-primary dark:text-primary-foreground">
          {log}
        </div>
      )
    } else if (log.includes("🚀") || log.includes("📅") || log.includes("👥") || log.includes("🏁")) {
      // Section headers
      return <div className="font-semibold text-primary dark:text-primary-foreground text-base my-2">{log}</div>
    } else if (log.includes("RESUMEN DE MÉTRICAS:")) {
      return (
        <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded my-1 text-green-800 dark:text-green-300 font-mono text-xs">
          {log}
        </div>
      )
    }

    return <div>{log}</div>
  }

  // Reemplazar la función organizeLogs para mejorar la organización de los logs
  const organizeLogs = () => {
    const generalLogs: string[] = []
    const instructorLogs: Record<string, string[]> = {}

    let currentInstructor: string | null = null

    processLogs.forEach((log) => {
      // Check if this is an instructor header
      const instructorMatch = log.match(/\[INSTRUCTOR: (.*?)\]/)

      if (instructorMatch) {
        // Extract instructor name
        const instructorName = instructorMatch[1]
        currentInstructor = instructorName

        // Initialize array for this instructor if needed
        if (!instructorLogs[instructorName]) {
          instructorLogs[instructorName] = []
        }

        // Add log without the instructor prefix
        const cleanLog = log.replace(`[INSTRUCTOR: ${instructorName}] `, "")
        instructorLogs[instructorName].push(cleanLog)
      } else if (currentInstructor) {
        // Add to current instructor's logs
        instructorLogs[currentInstructor].push(log)
      } else {
        // Add to general logs
        generalLogs.push(log)
      }
    })

    return { generalLogs, instructorLogs }
  }

  const { generalLogs, instructorLogs } = organizeLogs()

  // State to track which instructors are expanded
  const [expandedInstructors, setExpandedInstructors] = useState<Record<string, boolean>>({})

  // Toggle instructor expansion
  const toggleInstructor = (instructor: string) => {
    setExpandedInstructors((prev) => ({
      ...prev,
      [instructor]: !prev[instructor],
    }))
  }

  return (
    <AlertDialog open={showProcessLogsDialog} onOpenChange={setShowProcessLogsDialog}>
      <AlertDialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex justify-between items-center">
            <span>Proceso de Cálculo de Pagos</span>
            <Button variant="outline" size="sm" onClick={exportLogs} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Exportar Logs</span>
            </Button>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Registro detallado del proceso de cálculo de pagos con información sobre pagos por clase, análisis de
            categorías y horarios no prime.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Reemplazar la parte del renderizado de los logs para mejorar la visualización */}
        <div className="flex-1 overflow-y-auto my-4 p-4 bg-black/5 dark:bg-white/5 rounded-md font-mono text-sm">
          {processLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Iniciando proceso...
            </div>
          ) : (
            <div className="space-y-4">
              {/* General logs */}
              {generalLogs.length > 0 && (
                <div className="mb-4 pb-4 border-b border-border/30">
                  <h3 className="text-base font-medium mb-2 text-primary">Información General</h3>
                  <div className="space-y-1">
                    {generalLogs.map((log, index) => (
                      <div key={`general-${index}`}>{formatLogEntry(log)}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor logs as accordions */}
              <div className="space-y-2">
                {Object.entries(instructorLogs).map(([instructor, logs], index) => (
                  <Collapsible
                    key={`instructor-${index}`}
                    open={expandedInstructors[instructor]}
                    onOpenChange={() => toggleInstructor(instructor)}
                    className="border rounded-md overflow-hidden"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="font-medium">{instructor}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{logs.length} entradas</span>
                        {expandedInstructors[instructor] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 bg-card border-t">
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {logs.map((log, logIndex) => (
                          <div key={`log-${index}-${logIndex}`}>{formatLogEntry(log)}</div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogAction>Cerrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
