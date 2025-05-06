"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Edit, Save, X, MessageSquare, Loader2, Lock } from "lucide-react"
import { usePagosStore } from "@/store/usePagosStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CommentsSectionProps {
  pagoId: number
  comentariosIniciales: string
}

export function CommentsSection({ pagoId, comentariosIniciales }: CommentsSectionProps) {
  const [editando, setEditando] = useState(false)
  const [comentarios, setComentarios] = useState(comentariosIniciales)
  const [comentariosOriginales, setComentariosOriginales] = useState(comentariosIniciales)
  const [isGuardando, setIsGuardando] = useState(false)

  const { actualizarPago, fetchPago } = usePagosStore()

  // Obtener el tipo de usuario del store de autenticación
  const userType = useAuthStore((state) => state.userType)
  const isInstructor = userType === "instructor"

  const handleEditar = () => {
    setComentariosOriginales(comentarios)
    setEditando(true)
  }

  const handleCancelar = () => {
    setComentarios(comentariosOriginales)
    setEditando(false)
  }

  const handleGuardar = async () => {
    setIsGuardando(true)

    try {
      await actualizarPago(pagoId, { comentarios })
      await fetchPago(pagoId)

      toast({
        title: "Comentarios actualizados",
        description: "Los comentarios han sido guardados exitosamente.",
      })

      setEditando(false)
      setComentariosOriginales(comentarios)
    } catch (error) {
      toast({
        title: "Error al guardar comentarios",
        description: error instanceof Error ? error.message : "Error desconocido al guardar comentarios",
        variant: "destructive",
      })
    } finally {
      setIsGuardando(false)
    }
  }

  return (
    <Card className="border overflow-hidden">
      <CardHeader className="bg-muted/10 border-b py-2 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-primary" />
          <CardTitle className="text-lg font-medium">Comentarios</CardTitle>
        </div>

        {!editando ? (
          isInstructor ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Los instructores no pueden editar comentarios</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditar}
              className="h-7 px-2 bg-card border hover:bg-muted/10"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
          )
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelar}
              className="h-7 px-2 hover:bg-muted/10"
              disabled={isGuardando}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancelar
            </Button>

            <Button variant="default" size="sm" onClick={handleGuardar} className="h-7 px-2" disabled={isGuardando}>
              {isGuardando ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3">
        {editando ? (
          <Textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Escribe tus comentarios acerca de este pago..."
            className="min-h-[100px] resize-y"
          />
        ) : (
          <div className="bg-card p-2 rounded-md border min-h-[70px] text-sm">
            {comentarios ? (
              <p className="whitespace-pre-wrap text-foreground">{comentarios}</p>
            ) : (
              <p className="text-muted-foreground italic">No hay comentarios para este pago.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
