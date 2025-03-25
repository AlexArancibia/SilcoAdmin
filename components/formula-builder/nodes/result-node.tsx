"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { DollarSign } from "lucide-react"

export function ResultNode({ data, isConnectable, selected }: NodeProps) {
  const [etiqueta, setEtiqueta] = useState<string>(data.etiqueta || "Resultado")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Actualizar el estado cuando cambian los datos externos
  useEffect(() => {
    if (data.etiqueta) {
      setEtiqueta(data.etiqueta)
    }
  }, [data.etiqueta])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEtiqueta = e.target.value
    setEtiqueta(newEtiqueta)
    data.etiqueta = newEtiqueta
  }

  return (
    <div
      className={`p-4 border-2 rounded-md shadow-sm w-60 ${
        selected
          ? "border-blue-500 dark:border-blue-400"
          : isDark
            ? "bg-red-950/40 border-red-700 text-red-100"
            : "bg-red-50 border-red-300 text-red-900"
      }`}
    >
      <div className="font-medium text-sm mb-3 flex items-center gap-2">
        <div className={`p-1 rounded-md ${isDark ? "bg-red-900/50 text-red-300" : "bg-red-200 text-red-700"}`}>
          <DollarSign className="h-4 w-4" />
        </div>
        <span>Resultado</span>
      </div>

      <Input
        value={etiqueta}
        onChange={handleChange}
        className={`text-center font-medium ${isDark ? "bg-red-900/50 border-red-700" : ""}`}
      />

      {/* <div
        className={`mt-3 p-3 rounded text-center text-lg font-bold ${
          isDark ? "bg-red-900/20 text-red-300" : "bg-red-100 text-red-800"
        }`}
      >
        <DollarSign className="inline-block h-5 w-5 mr-1" />
        <span>VALOR FINAL</span>
      </div> */}

      {/* Handle para la conexión de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className={`w-6 h-6 border-2 ${isDark ? "bg-red-400 border-red-700" : "bg-red-500 border-red-700"}`}
        style={{ left: -12, zIndex: 20 }}
      />
    </div>
  )
}

