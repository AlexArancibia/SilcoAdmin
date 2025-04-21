import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  return (
    <AlertDialog open={showProcessLogsDialog} onOpenChange={setShowProcessLogsDialog}>
      <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Proceso de Cálculo de Pagos</AlertDialogTitle>
          <AlertDialogDescription>Registro detallado del proceso de cálculo de pagos.</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto my-4 p-4 bg-black/5 rounded-md font-mono text-sm">
          {processLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Iniciando proceso...
            </div>
          ) : (
            processLogs.map((log, index) => {
              // Check if this is an instructor section header
              const isInstructorHeader = log.trim().startsWith("\n[INSTRUCTOR:")
              const isInstructorLog = log.includes("[INSTRUCTOR:")

              // Style differently based on log type
              let logClass = "mb-1"

              if (isInstructorHeader) {
                logClass += " mt-4 pt-2 border-t border-muted font-semibold"
              } else if (isInstructorLog) {
                logClass += " pl-4 text-primary/80"
              } else {
                logClass += " text-foreground"
              }

              return (
                <div key={index} className={logClass}>
                  {isInstructorHeader ? log.replace("\n", "") : log}
                </div>
              )
            })
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogAction>Cerrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
