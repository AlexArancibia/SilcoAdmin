"use client"

import { useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TipoVariable } from "@/types/formula"
import { useTheme } from "next-themes"
import { Variable } from "lucide-react"

export function VariableNode({ data, isConnectable, selected }: NodeProps) {
  const [variable, setVariable] = useState<TipoVariable>(data.variable || TipoVariable.RESERVACIONES)
  const [etiqueta, setEtiqueta] = useState<string>(data.etiqueta || "Reservaciones")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Actualizar el estado cuando cambian los datos externos
  useEffect(() => {
    if (data.variable) {
      setVariable(data.variable)
    }
    if (data.etiqueta) {
      setEtiqueta(data.etiqueta)
    }
  }, [data.variable, data.etiqueta])

  const handleChange = (value: string) => {
    const newVariable = value as TipoVariable
    setVariable(newVariable)

    // Actualizar la etiqueta según la variable seleccionada
    let newEtiqueta = ""
    switch (newVariable) {
      case TipoVariable.RESERVACIONES:
        newEtiqueta = "Reservaciones"
        break
      case TipoVariable.LISTA_ESPERA:
        newEtiqueta = "Lista de Espera"
        break
      case TipoVariable.CORTESIAS:
        newEtiqueta = "Cortesías"
        break
      case TipoVariable.CAPACIDAD:
        newEtiqueta = "Capacidad"
        break
      case TipoVariable.RESERVAS_PAGADAS:
        newEtiqueta = "Reservas Pagadas"
        break
      case TipoVariable.LUGARES:
        newEtiqueta = "Lugares"
        break
    }

    setEtiqueta(newEtiqueta)

    // Actualizar los datos del nodo
    data.variable = newVariable
    data.etiqueta = newEtiqueta
  }

  return (
    <div
      className={`p-4 border-2 rounded-md shadow-sm w-60 ${
        selected
          ? "border-blue-500 dark:border-blue-400"
          : isDark
            ? "bg-blue-950/40 border-blue-800 text-blue-100"
            : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="font-medium text-sm mb-3 flex items-center gap-2">
        <div className={`p-1 rounded-md ${isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-200 text-blue-700"}`}>
          <Variable className="h-4 w-4" />
        </div>
        <span>Variable</span>
      </div>

      <Select value={variable} onValueChange={handleChange}>
        <SelectTrigger className={`w-full h-9 ${isDark ? "bg-blue-900/50 border-blue-700" : ""}`}>
          <SelectValue placeholder="Selecciona una variable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TipoVariable.RESERVACIONES}>Reservaciones</SelectItem>
          <SelectItem value={TipoVariable.LISTA_ESPERA}>Lista de Espera</SelectItem>
          <SelectItem value={TipoVariable.CORTESIAS}>Cortesías</SelectItem>
          <SelectItem value={TipoVariable.CAPACIDAD}>Capacidad</SelectItem>
          <SelectItem value={TipoVariable.RESERVAS_PAGADAS}>Reservas Pagadas</SelectItem>
          <SelectItem value={TipoVariable.LUGARES}>Lugares</SelectItem>
        </SelectContent>
      </Select>

      {/*  */}

      {/* Handle para la conexión de salida */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className={`w-6 h-6 border-2 ${isDark ? "bg-blue-400 border-blue-700" : "bg-blue-500 border-blue-700"}`}
        style={{ right: -12, zIndex: 20 }}
      />
    </div>
  )
}

