"use client"

import { Handle, Position, type NodeProps } from "reactflow"
import { useTheme } from "next-themes"
import { CheckSquare } from "lucide-react"

export function BranchResultNode({ data, isConnectable, id }: NodeProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Determinar el color basado en el tipo (verdadero/falso)
  const isTrue = data.branchType === "true"
  const colorClass = isTrue
    ? isDark
      ? "bg-green-950/30 border-green-700 text-green-100"
      : "bg-green-50 border-green-500"
    : isDark
      ? "bg-red-950/30 border-red-700 text-red-100"
      : "bg-red-50 border-red-500"

  const iconColor = isTrue ? (isDark ? "text-green-400" : "text-green-600") : isDark ? "text-red-400" : "text-red-600"

  return (
    <div className={`p-4 border rounded-md shadow-sm w-48 ${colorClass}`}>
      <div className="flex items-center gap-2">
        <CheckSquare className={`h-5 w-5 ${iconColor}`} />
        <div className="font-medium text-sm">Resultado de Rama</div>
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs">
          {isTrue ? "Resultado si la condición es verdadera" : "Resultado si la condición es falsa"}
        </span>
      </div>

      {/* Entrada para el valor final */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
        className={`w-4 h-4 border-2 ${
          isTrue
            ? isDark
              ? "bg-green-400 border-green-700"
              : "bg-green-500 border-green-700"
            : isDark
              ? "bg-red-400 border-red-700"
              : "bg-red-500 border-red-700"
        } hover:w-5 hover:h-5 transition-all`}
        style={{ left: -8 }}
      />
    </div>
  )
}

