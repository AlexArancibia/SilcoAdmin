"use client"

import type React from "react"

import { useCallback } from "react"
import { Database, Calculator, Hash, CheckCircle, Scale, Edit2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface SidebarProps {
  formulaNombre: string
  formulaDescripcion: string
  setFormulaNombre: (value: string) => void
  setFormulaDescripcion: (value: string) => void
}

export function Sidebar({ formulaNombre, formulaDescripcion, setFormulaNombre, setFormulaDescripcion }: SidebarProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const onDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }, [])

  return (
    <aside
      className={`w-80 h-full overflow-y-auto border-r ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200"} p-4`}
    >
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Input
            value={formulaNombre}
            onChange={(e) => setFormulaNombre(e.target.value)}
            placeholder="Nombre de la fórmula"
            className={`pr-8 font-medium text-base ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}
          />
          <Edit2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
        </div>

        <div className="relative">
          <Textarea
            value={formulaDescripcion}
            onChange={(e) => setFormulaDescripcion(e.target.value)}
            placeholder="Descripción de la fórmula"
            className={`resize-none h-20 text-sm ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}
          />
          <Edit2 className="absolute right-2 top-4 h-4 w-4 text-muted-foreground opacity-50" />
        </div>
      </div>

      <h3 className="font-medium text-base mb-4">Elementos</h3>

      <div className="grid grid-cols-1 gap-3">
        {/* Variable Node */}
        <div
          className={`p-3 border rounded-md cursor-grab flex items-center gap-3 ${
            isDark
              ? "bg-blue-950/40 border-blue-800 text-blue-100 hover:bg-blue-900/30"
              : "bg-blue-50 border-blue-200 hover:bg-blue-100"
          }`}
          onDragStart={(event) => onDragStart(event, "variableNode")}
          draggable
        >
          <div className={`p-2 rounded-md ${isDark ? "bg-blue-900/50" : "bg-blue-200"}`}>
            <Database className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium">Variable</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Datos de la clase</div>
          </div>
        </div>

        {/* Operation Node */}
        <div
          className={`p-3 border rounded-md cursor-grab flex items-center gap-3 ${
            isDark
              ? "bg-green-950/40 border-green-800 text-green-100 hover:bg-green-900/30"
              : "bg-green-50 border-green-200 hover:bg-green-100"
          }`}
          onDragStart={(event) => onDragStart(event, "operationNode")}
          draggable
        >
          <div className={`p-2 rounded-md ${isDark ? "bg-green-900/50" : "bg-green-200"}`}>
            <Calculator className="h-5 w-5 text-green-500 dark:text-green-400" />
          </div>
          <div>
            <div className="font-medium">Operación</div>
            <div className="text-xs text-green-700 dark:text-green-300">Cálculos matemáticos</div>
          </div>
        </div>

        {/* Number Node */}
        <div
          className={`p-3 border rounded-md cursor-grab flex items-center gap-3 ${
            isDark
              ? "bg-purple-950/40 border-purple-800 text-purple-100 hover:bg-purple-900/30"
              : "bg-purple-50 border-purple-200 hover:bg-purple-100"
          }`}
          onDragStart={(event) => onDragStart(event, "numberNode")}
          draggable
        >
          <div className={`p-2 rounded-md ${isDark ? "bg-purple-900/50" : "bg-purple-200"}`}>
            <Hash className="h-5 w-5 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-medium">Número</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">Valor constante</div>
          </div>
        </div>

        {/* Comparator Node */}
        <div
          className={`p-3 border rounded-md cursor-grab flex items-center gap-3 ${
            isDark
              ? "bg-indigo-950/40 border-indigo-800 text-indigo-100 hover:bg-indigo-900/30"
              : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
          }`}
          onDragStart={(event) => onDragStart(event, "comparatorNode")}
          draggable
        >
          <div className={`p-2 rounded-md ${isDark ? "bg-indigo-900/50" : "bg-indigo-200"}`}>
            <Scale className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <div className="font-medium">Comparador</div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300">Devuelve 1 o 0</div>
          </div>
        </div>

        {/* Result Node */}
        <div
          className={`p-3 border rounded-md cursor-grab flex items-center gap-3 ${
            isDark
              ? "bg-red-950/40 border-red-800 text-red-100 hover:bg-red-900/30"
              : "bg-red-50 border-red-200 hover:bg-red-100"
          }`}
          onDragStart={(event) => onDragStart(event, "resultNode")}
          draggable
        >
          <div className={`p-2 rounded-md ${isDark ? "bg-red-900/50" : "bg-red-200"}`}>
            <CheckCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <div className="font-medium">Resultado</div>
            <div className="text-xs text-red-700 dark:text-red-300">Salida final</div>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="mt-6">
        {/* Sección de ayuda para el comparador */}
        <AccordionItem value="comparator" className="border-indigo-200 dark:border-indigo-800">
          <AccordionTrigger className="text-sm font-medium text-indigo-800 dark:text-indigo-300 py-2">
            Tutorial: Uso del Comparador
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-md border border-indigo-200 dark:border-indigo-800">
              <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4" />
                ¿Cómo funciona?
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-2">
                El nodo Comparador evalúa una condición y devuelve un valor numérico:
              </p>
              <ul className="text-xs text-indigo-700 dark:text-indigo-400 space-y-1 list-disc list-inside">
                <li>
                  Devuelve <strong>1</strong> si la condición se cumple
                </li>
                <li>
                  Devuelve <strong>0</strong> si la condición no se cumple
                </li>
              </ul>

              <div className="mt-3 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded border border-indigo-300 dark:border-indigo-700 text-xs">
                <strong>Uso:</strong> Ideal para usar en operaciones matemáticas donde necesitas incluir una condición
                como parte del cálculo.
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
        <h3 className="text-sm font-medium mb-2">Instrucciones</h3>
        <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
          <li>Arrastra los elementos al área de trabajo</li>
          <li>Conecta los nodos usando los puntos de conexión</li>
          <li>Configura cada nodo haciendo clic en él</li>
          <li>Los comparadores devuelven 1 (verdadero) o 0 (falso)</li>
          <li>Usa los valores de los comparadores en operaciones matemáticas</li>
          <li>Asegúrate de conectar al menos un nodo de resultado</li>
        </ul>
      </div>
    </aside>
  )
}

