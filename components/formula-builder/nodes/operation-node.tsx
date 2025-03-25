"use client"

import { useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TipoOperacion } from "@/types/formula"
import { useTheme } from "next-themes"
import { Calculator } from "lucide-react"

export function OperationNode({ data, isConnectable, selected }: NodeProps) {
  const [operacion, setOperacion] = useState<TipoOperacion>(data.operacion || TipoOperacion.SUMA)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Actualizar el estado cuando cambian los datos externos
  useEffect(() => {
    if (data.operacion) {
      setOperacion(data.operacion)
    }
  }, [data.operacion])

  const handleChange = (value: string) => {
    const newOperacion = value as TipoOperacion
    setOperacion(newOperacion)

    // Actualizar los datos del nodo
    data.operacion = newOperacion
  }

  // Mapeo de operaciones a símbolos
  const operacionSimbolos: Record<TipoOperacion, string> = {
    [TipoOperacion.SUMA]: "+",
    [TipoOperacion.RESTA]: "-",
    [TipoOperacion.MULTIPLICACION]: "×",
    [TipoOperacion.DIVISION]: "÷",
    [TipoOperacion.PORCENTAJE]: "%",
    [TipoOperacion.MAYOR_QUE]: ">",
    [TipoOperacion.MENOR_QUE]: "<",
    [TipoOperacion.IGUAL]: "=",
    [TipoOperacion.MAYOR_IGUAL]: "≥",
    [TipoOperacion.MENOR_IGUAL]: "≤",
  }

  // Obtener las etiquetas para las entradas según el tipo de operación
  const getInputLabels = () => {
    switch (operacion) {
      case TipoOperacion.SUMA:
        return { input1: "Sumando A", input2: "Sumando B" }
      case TipoOperacion.RESTA:
        return { input1: "Minuendo", input2: "Sustraendo" }
      case TipoOperacion.MULTIPLICACION:
        return { input1: "Factor A", input2: "Factor B" }
      case TipoOperacion.DIVISION:
        return { input1: "Dividendo", input2: "Divisor" }
      case TipoOperacion.PORCENTAJE:
        return { input1: "Valor", input2: "Porcentaje" }
      default:
        return { input1: "Valor A", input2: "Valor B" }
    }
  }

  const inputLabels = getInputLabels()

  return (
    <div
      className={`p-4 border-2 rounded-md shadow-sm w-60 ${
        selected
          ? "border-blue-500 dark:border-blue-400"
          : isDark
            ? "bg-green-950/40 border-green-800 text-green-100"
            : "bg-green-50 border-green-200"
      }`}
    >
      <div className="font-medium text-sm mb-3 flex items-center gap-2">
        <div className={`p-1 rounded-md ${isDark ? "bg-green-900/50 text-green-300" : "bg-green-200 text-green-700"}`}>
          <Calculator className="h-4 w-4" />
        </div>
        <span>Operación</span>
      </div>

      <Select value={operacion} onValueChange={handleChange}>
        <SelectTrigger className={`w-full h-9 ${isDark ? "bg-green-900/50 border-green-700" : ""}`}>
          <SelectValue placeholder="Selecciona una operación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TipoOperacion.SUMA}>Suma (+)</SelectItem>
          <SelectItem value={TipoOperacion.RESTA}>Resta (-)</SelectItem>
          <SelectItem value={TipoOperacion.MULTIPLICACION}>Multiplicación (×)</SelectItem>
          <SelectItem value={TipoOperacion.DIVISION}>División (÷)</SelectItem>
          <SelectItem value={TipoOperacion.PORCENTAJE}>Porcentaje (%)</SelectItem>
        </SelectContent>
      </Select>

      <div
        className={`mt-3 p-2 rounded text-center text-2xl font-bold ${
          isDark ? "bg-green-900/20 text-green-300" : "bg-green-100 text-green-800"
        }`}
      >
        {operacionSimbolos[operacion]}
      </div>

      {/* Handle para la conexión de salida */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className={`w-6 h-6 border-2 ${isDark ? "bg-green-400 border-green-700" : "bg-green-500 border-green-700"}`}
        style={{ right: -12, zIndex: 20 }}
      />

      {/* Handles para las conexiones de entrada con etiquetas */}
      <div className="absolute" style={{ left: -60, top: "30%" }}>
        <div
          className={`text-xs font-medium px-2 py-1 rounded ${
            isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800"
          }`}
        >
          {inputLabels.input1}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input-1"
        isConnectable={isConnectable}
        className={`w-6 h-6 border-2 ${isDark ? "bg-green-400 border-green-700" : "bg-green-500 border-green-700"}`}
        style={{ left: -12, top: "30%", zIndex: 20 }}
      />

      <div className="absolute" style={{ left: -60, top: "70%" }}>
        <div
          className={`text-xs font-medium px-2 py-1 rounded ${
            isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800"
          }`}
        >
          {inputLabels.input2}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input-2"
        isConnectable={isConnectable}
        className={`w-6 h-6 border-2 ${isDark ? "bg-green-400 border-green-700" : "bg-green-500 border-green-700"}`}
        style={{ left: -12, top: "70%", zIndex: 20 }}
      />
    </div>
  )
}

