"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { Hash } from "lucide-react"

export function NumberNode({ data, isConnectable, selected }: NodeProps) {
  const [valor, setValor] = useState<number>(data.valor || 0)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Actualizar el estado cuando cambian los datos externos
  useEffect(() => {
    if (data.valor !== undefined) {
      setValor(data.valor)
    }
  }, [data.valor])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseFloat(e.target.value)
    if (!isNaN(newValue)) {
      setValor(newValue)
      data.valor = newValue
    }
  }

  return (
    <div
      className={`p-4 border-2 rounded-md shadow-sm w-48 ${
        selected
          ? "border-blue-500 dark:border-blue-400"
          : isDark
            ? "bg-purple-950/40 border-purple-800 text-purple-100"
            : "bg-purple-50 border-purple-200"
      }`}
    >
      <div className="font-medium text-sm mb-3 flex items-center gap-2">
        <div
          className={`p-1 rounded-md ${isDark ? "bg-purple-900/50 text-purple-300" : "bg-purple-200 text-purple-700"}`}
        >
          <Hash className="h-4 w-4" />
        </div>
        <span>Número</span>
      </div>

      <Input
        type="number"
        value={valor}
        onChange={handleChange}
        className={`text-center font-medium ${isDark ? "bg-purple-900/50 border-purple-700" : ""}`}
      />

      {/* Handle para la conexión de salida */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        className={`w-6 h-6 border-2 ${isDark ? "bg-purple-400 border-purple-700" : "bg-purple-500 border-purple-700"}`}
        style={{ right: -12, zIndex: 20 }}
      />
    </div>
  )
}

