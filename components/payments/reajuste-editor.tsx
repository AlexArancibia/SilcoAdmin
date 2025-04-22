"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check, Loader2, X } from "lucide-react"
import type { TipoReajuste } from "@/types/schema"

interface ReajusteEditorProps {
  nuevoReajuste: number
  setNuevoReajuste: (value: number) => void
  tipoReajuste: TipoReajuste
  setTipoReajuste: (value: TipoReajuste) => void
  isActualizandoReajuste: boolean
  pagoId: number
  actualizarReajuste: (pagoId: number) => void
  cancelarEdicionReajuste: () => void
}

export function ReajusteEditor({
  nuevoReajuste,
  setNuevoReajuste,
  tipoReajuste,
  setTipoReajuste,
  isActualizandoReajuste,
  pagoId,
  actualizarReajuste,
  cancelarEdicionReajuste,
}: ReajusteEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={nuevoReajuste}
          onChange={(e) => setNuevoReajuste(Number(e.target.value))}
          className="w-20 h-8 px-2 border rounded text-right"
          step="0.01"
        />
        <div className="flex items-center">
          {isActualizandoReajuste ? (
            <div className="flex items-center justify-center w-8 h-8">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Button size="sm" variant="outline" className="h-8 px-2 py-0" onClick={() => actualizarReajuste(pagoId)}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2 py-0" onClick={cancelarEdicionReajuste}>
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      <RadioGroup
        value={tipoReajuste}
        onValueChange={(value) => setTipoReajuste(value as TipoReajuste)}
        className="flex space-x-2"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="FIJO" id={`fijo-${pagoId}`} className="h-3 w-3" />
          <Label htmlFor={`fijo-${pagoId}`} className="text-xs">
            Fijo
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="PORCENTAJE" id={`porcentaje-${pagoId}`} className="h-3 w-3" />
          <Label htmlFor={`porcentaje-${pagoId}`} className="text-xs">
            %
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
