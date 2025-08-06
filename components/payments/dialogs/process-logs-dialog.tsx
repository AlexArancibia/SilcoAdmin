"use client"

import { useState } from "react"
import { Loader2, Download, ChevronDown, ChevronRight, User, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Award, Zap, GraduationCap } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProcessLogsDialogProps {
  showProcessLogsDialog: boolean
  setShowProcessLogsDialog: (show: boolean) => void
  processLogs: string[]
}

interface InstructorLogData {
  instructorId: string
  instructorName: string
  logs: string[]
  summary: {
    totalClases: number
    totalMonto: number
    covers: number
    brandeos: number
    themeRides: number
    workshops: number
    penalizaciones: number
    horariosNoPrime: number
  }
}

interface GeneralData {
  totalInstructores: number
  periodoId: number
  fechaHora: string
  estado: string
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

  // Function to format log entry with better styling
  const formatLogEntry = (log: string) => {
    if (log.includes("✅")) {
      return <div className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" />{log}</div>
    } else if (log.includes("⚠️")) {
      return <div className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{log}</div>
    } else if (log.includes("❌")) {
      return <div className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{log}</div>
    } else if (log.includes("💰 PAGO POR CLASE:")) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-800 dark:text-blue-300 text-xs border-l-2 border-blue-500">
          {log}
        </div>
      )
    } else if (log.includes("⏱️ HORARIO NO PRIME:")) {
      return (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-amber-800 dark:text-amber-300 text-xs border-l-2 border-amber-500">
          {log}
        </div>
      )
    } else if (log.includes("🔄 PROCESANDO INSTRUCTOR:")) {
      return (
        <div className="font-semibold text-primary dark:text-primary-foreground text-sm flex items-center gap-2 bg-muted/30 p-2 rounded">
          <User className="h-4 w-4" />
          {log}
        </div>
      )
    } else if (log.includes("💰 Cálculos finales:")) {
      return (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-emerald-800 dark:text-emerald-300 text-xs border-l-2 border-emerald-500">
          {log}
        </div>
      )
    }

    return <div className="text-xs">{log}</div>
  }

  // Function to extract instructor summary from logs - FIXED VERSION
  const extractInstructorSummary = (logs: string[]): InstructorLogData['summary'] => {
    const summary = {
      totalClases: 0,
      totalMonto: 0,
      covers: 0,
      brandeos: 0,
      themeRides: 0,
      workshops: 0,
      penalizaciones: 0,
      horariosNoPrime: 0
    }

    logs.forEach(log => {
      // Extract total classes - multiple patterns
      const clasesMatch1 = log.match(/Total de clases: (\d+)/)
      const clasesMatch2 = log.match(/Clases del instructor: (\d+)/)
      if (clasesMatch1) {
        summary.totalClases = parseInt(clasesMatch1[1])
      } else if (clasesMatch2) {
        summary.totalClases = parseInt(clasesMatch2[1])
      }

      // Extract covers - multiple patterns
      const coversMatch1 = log.match(/Covers como reemplazo: (\d+)/)
      const coversMatch2 = log.match(/Covers aplicados: (\d+)/)
      if (coversMatch1) {
        summary.covers = parseInt(coversMatch1[1])
      } else if (coversMatch2) {
        summary.covers = parseInt(coversMatch2[1])
      }

      // Extract brandeos - multiple patterns
      const brandeosMatch1 = log.match(/Brandeos: (\d+)/)
      const brandeosMatch2 = log.match(/Brandeos aplicados: (\d+)/)
      const brandeosMatch3 = log.match(/Brandeos del instructor: (\d+)/)
      if (brandeosMatch1) {
        summary.brandeos = parseInt(brandeosMatch1[1])
      } else if (brandeosMatch2) {
        summary.brandeos = parseInt(brandeosMatch2[1])
      } else if (brandeosMatch3) {
        summary.brandeos = parseInt(brandeosMatch3[1])
      }

      // Extract theme rides - multiple patterns
      const themeRidesMatch1 = log.match(/Theme Rides: (\d+)/)
      const themeRidesMatch2 = log.match(/Theme Rides aplicados: (\d+)/)
      const themeRidesMatch3 = log.match(/Theme Rides del instructor: (\d+)/)
      if (themeRidesMatch1) {
        summary.themeRides = parseInt(themeRidesMatch1[1])
      } else if (themeRidesMatch2) {
        summary.themeRides = parseInt(themeRidesMatch2[1])
      } else if (themeRidesMatch3) {
        summary.themeRides = parseInt(themeRidesMatch3[1])
      }

      // Extract workshops - multiple patterns
      const workshopsMatch1 = log.match(/Workshops: (\d+)/)
      const workshopsMatch2 = log.match(/Workshops aplicados: (\d+)/)
      const workshopsMatch3 = log.match(/Workshops del instructor: (\d+)/)
      if (workshopsMatch1) {
        summary.workshops = parseInt(workshopsMatch1[1])
      } else if (workshopsMatch2) {
        summary.workshops = parseInt(workshopsMatch2[1])
      } else if (workshopsMatch3) {
        summary.workshops = parseInt(workshopsMatch3[1])
      }

      // Extract penalizaciones - multiple patterns
      const penalizacionesMatch1 = log.match(/Penalizaciones: (\d+)/)
      const penalizacionesMatch2 = log.match(/Penalizaciones del instructor: (\d+)/)
      if (penalizacionesMatch1) {
        summary.penalizaciones = parseInt(penalizacionesMatch1[1])
      } else if (penalizacionesMatch2) {
        summary.penalizaciones = parseInt(penalizacionesMatch2[1])
      }

      // Extract total monto from final calculations - multiple patterns
      const montoMatch1 = log.match(/Pago final: S\/\. ([\d.]+)/)
      const montoMatch2 = log.match(/Pago final: ([\d.]+)/)
      if (montoMatch1) {
        summary.totalMonto = parseFloat(montoMatch1[1])
      } else if (montoMatch2) {
        summary.totalMonto = parseFloat(montoMatch2[1])
      }

      // Count horarios no prime
      if (log.includes("⏱️ HORARIO NO PRIME:")) {
        summary.horariosNoPrime++
      }
    })

    return summary
  }

  // Function to extract general data from logs - FIXED VERSION
  const extractGeneralData = (logs: string[]): GeneralData => {
    const generalData: GeneralData = {
      totalInstructores: 0,
      periodoId: 0,
      fechaHora: '',
      estado: 'Completado'
    }

    // Look for the general summary section specifically
    const generalSummaryStart = logs.findIndex(log => log.includes('📊 RESUMEN GENERAL DEL PROCESO:'))
    
    if (generalSummaryStart !== -1) {
      // Extract data from the general summary section
      for (let i = generalSummaryStart; i < logs.length; i++) {
        const log = logs[i]
        
        // Extract total instructors
        const instructoresMatch = log.match(/👥 Total instructores procesados: (\d+)/)
        if (instructoresMatch) {
          generalData.totalInstructores = parseInt(instructoresMatch[1])
        }

        // Extract periodo ID
        const periodoMatch = log.match(/📅 Periodo procesado: (\d+)/)
        if (periodoMatch) {
          generalData.periodoId = parseInt(periodoMatch[1])
        }

        // Extract fecha y hora
        const fechaMatch = log.match(/⏰ Fecha y hora: (.+)/)
        if (fechaMatch) {
          generalData.fechaHora = fechaMatch[1]
        }

        // Extract estado
        const estadoMatch = log.match(/🎯 Estado: (.+)/)
        if (estadoMatch) {
          generalData.estado = estadoMatch[1]
        }
      }
    } else {
      // Fallback: search through all logs
      logs.forEach(log => {
        // Extract total instructors - multiple patterns
        const instructoresMatch1 = log.match(/Total instructores procesados: (\d+)/)
        const instructoresMatch2 = log.match(/Instructores encontrados: (\d+)/)
        if (instructoresMatch1) {
          generalData.totalInstructores = parseInt(instructoresMatch1[1])
        } else if (instructoresMatch2) {
          generalData.totalInstructores = parseInt(instructoresMatch2[1])
        }

        // Extract periodo ID - multiple patterns
        const periodoMatch1 = log.match(/Periodo procesado: (\d+)/)
        const periodoMatch2 = log.match(/procesando periodo ID: (\d+)/)
        const periodoMatch3 = log.match(/periodo (\d+)/)
        if (periodoMatch1) {
          generalData.periodoId = parseInt(periodoMatch1[1])
        } else if (periodoMatch2) {
          generalData.periodoId = parseInt(periodoMatch2[1])
        } else if (periodoMatch3) {
          generalData.periodoId = parseInt(periodoMatch3[1])
        }

        // Extract fecha y hora - multiple patterns
        const fechaMatch1 = log.match(/Fecha y hora: (.+)/)
        const fechaMatch2 = log.match(/fecha y hora: (.+)/)
        if (fechaMatch1) {
          generalData.fechaHora = fechaMatch1[1]
        } else if (fechaMatch2) {
          generalData.fechaHora = fechaMatch2[1]
        }

        // Extract estado - multiple patterns
        const estadoMatch1 = log.match(/Estado: (.+)/)
        const estadoMatch2 = log.match(/estado: (.+)/)
        if (estadoMatch1) {
          generalData.estado = estadoMatch1[1]
        } else if (estadoMatch2) {
          generalData.estado = estadoMatch2[1]
        }
      })
    }

    // Debug: Log what we found
    console.log('Extracted general data:', generalData)
    console.log('General summary start index:', generalSummaryStart)

    return generalData
  }

  // Function to organize logs by instructor with better structure
  const organizeLogs = () => {
    const generalLogs: string[] = []
    const instructorLogs: Record<string, InstructorLogData> = {}

    let currentInstructor: string | null = null
    let currentInstructorId: string | null = null

    processLogs.forEach((log) => {
      // Check if this is an instructor header
      const instructorMatch = log.match(/🔄 PROCESANDO INSTRUCTOR: (\d+) - (.+)/)

      if (instructorMatch) {
        // Extract instructor ID and name
        const instructorId = instructorMatch[1]
        const instructorName = instructorMatch[2]
        currentInstructor = instructorName
        currentInstructorId = instructorId

        // Initialize data for this instructor if needed
        if (!instructorLogs[instructorName]) {
          instructorLogs[instructorName] = {
            instructorId,
            instructorName,
            logs: [],
            summary: {
              totalClases: 0,
              totalMonto: 0,
              covers: 0,
              brandeos: 0,
              themeRides: 0,
              workshops: 0,
              penalizaciones: 0,
              horariosNoPrime: 0
            }
          }
        }

        // Add log to instructor's logs
        instructorLogs[instructorName].logs.push(log)
      } else if (currentInstructor && currentInstructorId) {
        // Add to current instructor's logs
        instructorLogs[currentInstructor].logs.push(log)
      } else {
        // Add to general logs
        generalLogs.push(log)
      }
    })

    // Extract summaries for each instructor
    Object.values(instructorLogs).forEach(instructorData => {
      instructorData.summary = extractInstructorSummary(instructorData.logs)
    })

    return { generalLogs, instructorLogs }
  }

  const { generalLogs, instructorLogs } = organizeLogs()
  const generalData = extractGeneralData(processLogs)

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
      <AlertDialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <AlertDialogHeader className="pb-3">
          <AlertDialogTitle className="flex justify-between items-center text-lg">
            <span>Proceso de Cálculo de Pagos</span>
            <Button variant="outline" size="sm" onClick={exportLogs} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Registro detallado del proceso de cálculo organizado por instructor.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto p-4 bg-muted/20 rounded-md">
          {processLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Iniciando proceso...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Compact General Data Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-card rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {generalData.totalInstructores > 0 ? generalData.totalInstructores : Object.keys(instructorLogs).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Instructores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {generalData.periodoId > 0 ? generalData.periodoId : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Periodo</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">
                    {generalData.fechaHora || new Date().toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Fecha</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600">
                    {generalData.estado || 'Completado'}
                  </div>
                  <div className="text-xs text-muted-foreground">Estado</div>
                </div>
              </div>

              {/* Compact Instructor List */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Instructores ({Object.keys(instructorLogs).length})
                </h3>
                
                {Object.entries(instructorLogs).map(([instructorName, instructorData], index) => (
                  <Collapsible
                    key={`instructor-${index}`}
                    open={expandedInstructors[instructorName]}
                    onOpenChange={() => toggleInstructor(instructorName)}
                    className="border rounded-lg overflow-hidden bg-card"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="font-medium text-sm">{instructorName}</div>
                          <div className="text-xs text-muted-foreground">ID: {instructorData.instructorId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Compact Summary Badges */}
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            <Calendar className="h-3 w-3 mr-1" />
                            {instructorData.summary.totalClases}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            <DollarSign className="h-3 w-3 mr-1" />
                            S/. {instructorData.summary.totalMonto.toFixed(0)}
                          </Badge>
                          {instructorData.summary.covers > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              🔄 {instructorData.summary.covers}
                            </Badge>
                          )}
                          {instructorData.summary.brandeos > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              🏆 {instructorData.summary.brandeos}
                            </Badge>
                          )}
                          {instructorData.summary.themeRides > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              ⚡ {instructorData.summary.themeRides}
                            </Badge>
                          )}
                          {instructorData.summary.workshops > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              🎓 {instructorData.summary.workshops}
                            </Badge>
                          )}
                        </div>
                        {expandedInstructors[instructorName] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border-t">
                      <div className="p-3 bg-muted/10">
                        {/* Compact Instructor Summary */}
                        <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-blue-600" />
                            <span className="text-muted-foreground">Clases:</span>
                            <span className="font-semibold">{instructorData.summary.totalClases}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600" />
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold">S/. {instructorData.summary.totalMonto.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span className="text-muted-foreground">No Prime:</span>
                            <span className="font-semibold">{instructorData.summary.horariosNoPrime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-purple-600" />
                            <span className="text-muted-foreground">Bonos:</span>
                            <span className="font-semibold">{instructorData.summary.covers + instructorData.summary.brandeos + instructorData.summary.themeRides + instructorData.summary.workshops}</span>
                          </div>
                        </div>

                        {/* Detailed Logs - Compact */}
                        <div className="space-y-1 max-h-[300px] overflow-y-auto bg-black/5 dark:bg-white/5 rounded p-2">
                          {instructorData.logs.map((log, logIndex) => (
                            <div key={`log-${index}-${logIndex}`}>{formatLogEntry(log)}</div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="pt-3">
          <AlertDialogAction>Cerrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
