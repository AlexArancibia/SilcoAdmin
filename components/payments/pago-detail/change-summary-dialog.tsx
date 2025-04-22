import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowDownCircle, ArrowRight, ArrowUpCircle, RefreshCw, RotateCw } from "lucide-react"
import type { CategoriaInstructor } from "@/types/schema"

interface ChangeSummaryDialogProps {
  showResumenDialog: boolean
  setShowResumenDialog: (value: boolean) => void
  cambiosCategorias: Array<{
    disciplina: string
    categoriaAnterior: CategoriaInstructor
    categoriaNueva: CategoriaInstructor
  }>
  getColorCategoria: (categoria: CategoriaInstructor) => string
  formatearCategoria: (categoria: CategoriaInstructor) => string
  getCategoriaValue: (categoria: CategoriaInstructor) => number
}

export function ChangeSummaryDialog({
  showResumenDialog,
  setShowResumenDialog,
  cambiosCategorias,
  getColorCategoria,
  formatearCategoria,
  getCategoriaValue,
}: ChangeSummaryDialogProps) {
  return (
    <AlertDialog open={showResumenDialog} onOpenChange={setShowResumenDialog}>
      <AlertDialogContent className="bg-card border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-foreground">
            <RotateCw className="h-5 w-5 mr-2 text-primary" />
            Resumen de Cambios en Categorías
          </AlertDialogTitle>
          <div className="text-muted-foreground">
            Se han realizado los siguientes cambios en las categorías del instructor:
          </div>
        </AlertDialogHeader>
        <div className="py-4">
          {cambiosCategorias.length > 0 ? (
            <div className="space-y-3">
              {cambiosCategorias.map((cambio, index) => (
                <div key={index} className="bg-muted/10 p-3 rounded-md border">
                  <div className="font-medium mb-1 text-foreground">{cambio.disciplina}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium">{formatearCategoria(cambio.categoriaAnterior)}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                    <div className="flex items-center">
                      <span className="font-medium">{formatearCategoria(cambio.categoriaNueva)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {getCategoriaValue(cambio.categoriaNueva) > getCategoriaValue(cambio.categoriaAnterior) ? (
                      <div className="flex items-center text-emerald-600">
                        <ArrowUpCircle className="h-4 w-4 mr-1" />
                        <span>Promoción</span>
                      </div>
                    ) : getCategoriaValue(cambio.categoriaNueva) < getCategoriaValue(cambio.categoriaAnterior) ? (
                      <div className="flex items-center text-amber-600">
                        <ArrowDownCircle className="h-4 w-4 mr-1" />
                        <span>Descenso</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-blue-600">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        <span>Sin cambio</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-muted-foreground">No se realizaron cambios en las categorías</div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction className="bg-accent text-accent-foreground hover:bg-accent/90">Aceptar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
