"use client"

import { useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { TipoOperacion } from "@/types/formula"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Scale } from "lucide-react"

// Mapeo de operaciones a símbolos para mostrar
const operacionesMap: Record<TipoOperacion, string> = {
  [TipoOperacion.MAYOR_QUE]: ">",
  [TipoOperacion.MENOR_QUE]: "<",
  [TipoOperacion.IGUAL]: "=",
  [TipoOperacion.MAYOR_IGUAL]: "≥",
  [TipoOperacion.MENOR_IGUAL]: "≤",
  // Incluir el resto de operaciones aunque no se usen en este nodo
  [TipoOperacion.SUMA]: "+",
  [TipoOperacion.RESTA]: "-",
  [TipoOperacion.MULTIPLICACION]: "×",
  [TipoOperacion.DIVISION]: "÷",
  [TipoOperacion.PORCENTAJE]: "%",
}

export function ComparatorNode({ data, isConnectable, selected }: NodeProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [condicion, setCondicion] = useState<TipoOperacion>(data.condicion || TipoOperacion.MAYOR_QUE)

  // Actualizar los datos del nodo cuando cambia la condición
  useEffect(() => {
    if (data.condicion !== condicion) {
      data.condicion = condicion
    }
  }, [condicion, data])

  // Actualizar el estado local cuando cambian los datos externos
  useEffect(() => {
    if (data.condicion && data.condicion !== condicion) {
      setCondicion(data.condicion)
    }
  }, [data.condicion])

  return (
    <div
      className={`relative p-4 border-2 rounded-md ${
        selected
          ? "border-blue-500 dark:border-blue-400"
          : isDark
            ? "border-indigo-800 bg-indigo-950/40 text-indigo-100"
            : "border-indigo-200 bg-indigo-50"
      } min-w-[180px]`}
    >
      {/* Título del nodo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded-md ${
              isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-200 text-indigo-700"
            }`}
          >
            <Scale className="h-4 w-4" />
          </div>
          <span className={`font-medium text-sm ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>Comparador</span>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${
            isDark ? "bg-indigo-900/50 text-indigo-300 border-indigo-700" : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {condicion ? operacionesMap[condicion] : "?"}
        </Badge>
      </div>

      {/* Selector de condición */}
      <div className="mb-3">
        <Select value={condicion} onValueChange={(value) => setCondicion(value as TipoOperacion)}>
          <SelectTrigger
            className={`w-full ${
              isDark
                ? "bg-indigo-900/30 border-indigo-700 text-indigo-300"
                : "bg-white border-indigo-200 text-indigo-700"
            }`}
          >
            <SelectValue placeholder="Seleccionar condición" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TipoOperacion.MAYOR_QUE}>Mayor que (&gt;)</SelectItem>
            <SelectItem value={TipoOperacion.MENOR_QUE}>Menor que (&lt;)</SelectItem>
            <SelectItem value={TipoOperacion.IGUAL}>Igual (=)</SelectItem>
            <SelectItem value={TipoOperacion.MAYOR_IGUAL}>Mayor o igual (≥)</SelectItem>
            <SelectItem value={TipoOperacion.MENOR_IGUAL}>Menor o igual (≤)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className={`mt-3 p-2 rounded text-center text-sm ${
          isDark ? "bg-indigo-900/20 text-indigo-300" : "bg-indigo-100 text-indigo-800"
        }`}
      >
        Devuelve 1 si se cumple, 0 si no
      </div>

      {/* Handles de entrada y salida */}
      <div className="absolute" style={{ left: -60, top: "30%" }}>
        <div
          className={`text-xs font-medium px-2 py-1 rounded ${
            isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-800"
          }`}
        >
          Valor A
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="valueA"
        className="w-6 h-6 border-2 bg-indigo-500 border-indigo-700"
        isConnectable={isConnectable}
        style={{ left: -12, top: "30%", zIndex: 20 }}
      />

      <div className="absolute" style={{ left: -60, top: "70%" }}>
        <div
          className={`text-xs font-medium px-2 py-1 rounded ${
            isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-800"
          }`}
        >
          Valor B
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="valueB"
        className="w-6 h-6 border-2 bg-indigo-500 border-indigo-700"
        isConnectable={isConnectable}
        style={{ left: -12, top: "70%", zIndex: 20 }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-6 h-6 border-2 bg-indigo-500 border-indigo-700"
        isConnectable={isConnectable}
        style={{ right: -12, top: "50%", zIndex: 20 }}
      />
    </div>
  )
}

