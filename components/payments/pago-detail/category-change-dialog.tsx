"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react"
import type { CategoriaInstructor } from "@/types/schema"

interface CategoryChangeDialogProps {
  showCategoriaDialog: boolean
  setShowCategoriaDialog: (value: boolean) => void
  disciplinaSeleccionada: any
  categoriaPrevia: CategoriaInstructor | null
  categoriaCalculada: CategoriaInstructor | null
  getColorCategoria: (categoria: CategoriaInstructor) => string
  formatearCategoria: (categoria: CategoriaInstructor) => string
  getCategoriaValue: (categoria: CategoriaInstructor) => number
  actualizarCategoriaInstructor: () => void
}

export function CategoryChangeDialog({
  showCategoriaDialog,
  setShowCategoriaDialog,
  disciplinaSeleccionada,
  categoriaPrevia,
  categoriaCalculada,
  getColorCategoria,
  formatearCategoria,
  getCategoriaValue,
  actualizarCategoriaInstructor,
}: CategoryChangeDialogProps) {
  return (
    <AlertDialog open={showCategoriaDialog} onOpenChange={setShowCategoriaDialog}>
      <AlertDialogContent className="bg-card border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-foreground">
            <RefreshCw className="h-5 w-5 mr-2 text-primary" />
            Cambio de Categoría Detectado
          </AlertDialogTitle>
          <div className="mb-2">
            <span className="font-medium text-muted-foreground">Disciplina:</span>{" "}
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {disciplinaSeleccionada?.nombre || "Disciplina"}
            </Badge>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            Basado en los parámetros actuales, la categoría del instructor debería cambiar de{" "}
            <span className="font-medium">{formatearCategoria(categoriaPrevia || "INSTRUCTOR")}</span> a{" "}
            <span className="font-medium">{formatearCategoria(categoriaCalculada || "INSTRUCTOR")}</span>
          </AlertDialogDescription>

          {categoriaCalculada && categoriaPrevia && (
            <div className="mt-2 flex items-center justify-center">
              {getCategoriaValue(categoriaCalculada) > getCategoriaValue(categoriaPrevia) ? (
                <div className="flex items-center text-emerald-600">
                  <ArrowUpCircle className="h-5 w-5 mr-1" />
                  <span>Promoción</span>
                </div>
              ) : (
                <div className="flex items-center text-amber-600">
                  <ArrowDownCircle className="h-5 w-5 mr-1" />
                  <span>Descenso</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 p-3 bg-muted/10 rounded-md border text-sm">
            <p className="text-muted-foreground">Este cambio puede afectar:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>La tarifa de pago por clase para esta disciplina</li>
              <li>El mínimo garantizado</li>
              <li>Los bonos aplicables</li>
              <li>Otros beneficios asociados a la categoría</li>
            </ul>
          </div>

          <AlertDialogDescription className="mt-4 text-muted-foreground">
            ¿Desea actualizar la categoría del instructor para esta disciplina?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border text-muted-foreground hover:bg-muted/10">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => actualizarCategoriaInstructor()}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Actualizar Categoría
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
