"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  periodoInfo: {
    numero: number
    año: number
  }
  estadisticas: {
    clasesValidas: number
    instructoresNuevos: number
    disciplinasNuevas: number
  }
  isProcessing: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  periodoInfo,
  estadisticas,
  isProcessing
}: ConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState("")

  const handleConfirm = () => {
    if (confirmText === "ELIMINAR") {
      onConfirm()
    }
  }

  const isConfirmButtonDisabled = confirmText !== "ELIMINAR" || isProcessing

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmación Crítica
          </DialogTitle>
          <DialogDescription className="text-sm">
            Esta acción eliminará permanentemente todas las clases del periodo y creará nuevas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del periodo */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Periodo:</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Periodo {periodoInfo.numero} - {periodoInfo.año}
              </Badge>
            </div>
          </div>

          {/* Estadísticas de la importación */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Resumen de la importación:</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-bold text-green-600">{estadisticas.clasesValidas}</div>
                <div className="text-green-600">Clases</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="font-bold text-orange-600">{estadisticas.instructoresNuevos}</div>
                <div className="text-orange-600">Nuevos</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-bold text-yellow-600">{estadisticas.disciplinasNuevas}</div>
                <div className="text-yellow-600">Disciplinas</div>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <Trash2 className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <p className="font-medium mb-1">⚠️ Acción irreversible:</p>
                <ul className="space-y-1">
                  <li>• Se eliminarán TODAS las clases existentes del periodo</li>
                  <li>• Se crearán {estadisticas.clasesValidas} clases nuevas</li>
                  <li>• Esta acción no se puede deshacer</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmación por texto */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Escribe <span className="font-mono bg-gray-100 px-1 rounded">ELIMINAR</span> para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmButtonDisabled}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Eliminación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
