"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  type Connection,
  type Node,
  type NodeTypes,
  MarkerType,
  type Edge,
} from "reactflow"
import "reactflow/dist/style.css"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  Save,
  PlayCircle,
  ZoomIn,
  ZoomOut,
  Maximize,
  Trash2,
  Code,
  Moon,
  Sun,
  Trash,
  Beaker,
  HelpCircle,
  CheckCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"

import { VariableNode } from "./nodes/variable-node"
import { OperationNode } from "./nodes/operation-node"
import { NumberNode } from "./nodes/number-node"
import { ResultNode } from "./nodes/result-node"
import { ComparatorNode } from "./nodes/comparator-node"
import { Sidebar } from "./sidebar"
import { type Formula, TipoNodo, TipoVariable, TipoOperacion, type PasoEvaluacion } from "@/types/formula"
import { evaluarFormula } from "@/lib/formula-evaluator"

// Definir los tipos de nodos personalizados
const nodeTypes: NodeTypes = {
  variableNode: VariableNode,
  operationNode: OperationNode,
  numberNode: NumberNode,
  resultNode: ResultNode,
  comparatorNode: ComparatorNode,
}

interface FormulaBuilderProps {
  formula?: Formula
  onSave: (formula: Formula) => void
  isLoading?: boolean
}

// Componente principal que envuelve todo con ReactFlowProvider
export function FormulaBuilder({ formula, onSave, isLoading = false }: FormulaBuilderProps) {
  const [formulaNombre, setFormulaNombre] = useState(formula?.nombre || "")
  const [formulaDescripcion, setFormulaDescripcion] = useState(formula?.descripcion || "")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("builder")
  const [jsonView, setJsonView] = useState<string>("")
  const [showHelp, setShowHelp] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Estado para la pestaña de pruebas
  const [testData, setTestData] = useState({
    reservaciones: 30,
    listaEspera: 5,
    cortesias: 2,
    capacidad: 50,
    reservasPagadas: 28,
    lugares: 20,
  })
  const [testResult, setTestResult] = useState<number | null>(null)
  const [evaluationSteps, setEvaluationSteps] = useState<PasoEvaluacion[]>([])
  const [isTestEvaluating, setIsTestEvaluating] = useState(false)

  // Estado para mantener los nodos y conexiones entre pestañas
  const [currentNodes, setCurrentNodes] = useState<Node[]>([])
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([])
  const [tempFormula, setTempFormula] = useState<Formula | null>(null)

  // Referencias para las funciones del componente interno
  const saveRef = useRef<(() => void) | undefined>(undefined)
  const evaluateRef = useRef<(() => void) | undefined>(undefined)

  // Función para guardar el estado actual antes de cambiar de pestaña
  const handleTabChange = (value: string) => {
    // Si estamos saliendo de la pestaña builder, guardamos el estado
    if (activeTab === "builder" && value !== "builder") {
      if (saveRef.current) {
        // Llamar a la función de guardar para actualizar tempFormula
        saveRef.current()
      }
    }
    setActiveTab(value)
  }

  const handleSave = () => {
    // Esta función será pasada al componente interno
    if (saveRef.current) {
      saveRef.current()
      // Después de guardar, actualizamos el estado global
      if (tempFormula) {
        onSave(tempFormula)
        setLastSaved(new Date())
      }
    }
  }

  const handleEvaluate = () => {
    // Esta función será pasada al componente interno
    if (evaluateRef.current) {
      evaluateRef.current()
    }
  }

  // Función para evaluar la fórmula con los datos de prueba
  const handleTestEvaluate = () => {
    if (!tempFormula && !formula && !saveRef.current) {
      toast({
        title: "Error",
        description: "Primero debes crear una fórmula válida.",
        variant: "destructive",
      })
      return
    }

    setIsTestEvaluating(true)

    try {
      // Usar la fórmula temporal si existe, o la fórmula original
      let formulaToEvaluate: Formula = tempFormula || (formula as Formula)

      // Si no hay fórmula guardada, crear una temporal
      if (!formulaToEvaluate) {
        // Guardar primero para asegurarnos de que la fórmula es válida
        if (saveRef.current) {
          saveRef.current()
          formulaToEvaluate = tempFormula as Formula
        }
      }

      const resultado = evaluarFormula(formulaToEvaluate, testData)
      setTestResult(resultado.valor)
      setEvaluationSteps(resultado.pasos)

      toast({
        title: "Evaluación completada",
        description: `Resultado: S/ ${resultado.valor.toFixed(2)}`,
      })
    } catch (error) {
      toast({
        title: "Error en la evaluación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsTestEvaluating(false)
    }
  }

  // Función para actualizar los datos de prueba
  const handleTestDataChange = (variable: string, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      setTestData((prev) => ({
        ...prev,
        [variable]: numValue,
      }))
    }
  }

  // Función para actualizar la fórmula temporal
  const updateTempFormula = (newFormula: Formula) => {
    setTempFormula(newFormula)
    setLastSaved(new Date())
  }

  // Formatear la fecha de último guardado
  const formattedLastSaved = lastSaved
    ? `Última modificación: ${lastSaved.toLocaleDateString()} ${lastSaved.toLocaleTimeString()}`
    : ""

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Maximize className="h-4 w-4" />
            Constructor
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Pruebas
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            JSON
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <div className="flex items-center text-xs text-muted-foreground mr-2">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              {formattedLastSaved}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Ayuda
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEvaluate}
            disabled={isEvaluating || isLoading}
            className="flex items-center gap-2"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluando...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Probar
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isLoading || formulaNombre === ""}
            className="flex items-center gap-2"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      <TabsContent value="builder" className="mt-0">
        <div className="border rounded-md overflow-hidden dark:border-slate-700">
          <ReactFlowProvider>
            <FlowBuilder
              formula={tempFormula || formula}
              onSave={updateTempFormula}
              isLoading={isLoading}
              formulaNombre={formulaNombre}
              setFormulaNombre={setFormulaNombre}
              formulaDescripcion={formulaDescripcion}
              setFormulaDescripcion={setFormulaDescripcion}
              isEvaluating={isEvaluating}
              setIsEvaluating={setIsEvaluating}
              evaluationResult={evaluationResult}
              setEvaluationResult={setEvaluationResult}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              jsonView={jsonView}
              setJsonView={setJsonView}
              saveRef={saveRef}
              evaluateRef={evaluateRef}
              currentNodes={currentNodes}
              setCurrentNodes={setCurrentNodes}
              currentEdges={currentEdges}
              setCurrentEdges={setCurrentEdges}
              showHelp={showHelp}
              setShowHelp={setShowHelp}
              lastSaved={lastSaved}
              setLastSaved={setLastSaved}
            />
          </ReactFlowProvider>
        </div>
      </TabsContent>

      <TabsContent value="tests" className="mt-0">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Datos de Prueba</h3>
                <div className="border rounded-md dark:border-slate-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Reservaciones</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={testData.reservaciones}
                            onChange={(e) => handleTestDataChange("reservaciones", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Lista de Espera</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={testData.listaEspera}
                            onChange={(e) => handleTestDataChange("listaEspera", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Cortesías</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={testData.cortesias}
                            onChange={(e) => handleTestDataChange("cortesias", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Capacidad</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={testData.capacidad}
                            onChange={(e) => handleTestDataChange("capacidad", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Reservas Pagadas</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={testData.reservasPagadas}
                            onChange={(e) => handleTestDataChange("reservasPagadas", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Lugares</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={testData.lugares}
                            onChange={(e) => handleTestDataChange("lugares", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleTestEvaluate} disabled={isTestEvaluating} className="flex items-center gap-2">
                    {isTestEvaluating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Evaluando...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        Evaluar con estos datos
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Resultado</h3>

                {testResult !== null ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                      <h4 className="font-medium mb-2 text-green-800 dark:text-green-400">
                        Resultado de la evaluación:
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-400">Valor calculado</span>
                        <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                          S/ {testResult.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Pasos de evaluación:</h4>
                      <div className="border rounded-md dark:border-slate-700 overflow-hidden">
                        <Accordion type="single" collapsible className="w-full">
                          {evaluationSteps.map((paso, index) => (
                            <AccordionItem key={index} value={`paso-${index}`}>
                              <AccordionTrigger className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-sm font-medium">
                                    Paso {index + 1}: {paso.descripcion.split(":")[0]}
                                  </span>
                                  <Badge
                                    variant={
                                      typeof paso.valor === "boolean"
                                        ? paso.valor
                                          ? "success"
                                          : "destructive"
                                        : "outline"
                                    }
                                  >
                                    {typeof paso.valor === "boolean"
                                      ? paso.valor
                                        ? "Verdadero"
                                        : "Falso"
                                      : paso.valor.toFixed(2)}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 py-2 bg-slate-50 dark:bg-slate-800">
                                <div className="text-sm">{paso.descripcion}</div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800 rounded-md border dark:border-slate-700">
                    <Beaker className="h-12 w-12 text-slate-400 mb-4" />
                    <h4 className="text-lg font-medium text-slate-600 dark:text-slate-300">Sin resultados</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
                      Ajusta los valores de las variables y haz clic en "Evaluar con estos datos" para ver el resultado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="json" className="mt-0">
        <Card className="dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">Vista JSON de la Fórmula</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(jsonView)
                  toast({
                    title: "Copiado",
                    description: "El JSON de la fórmula ha sido copiado al portapapeles.",
                  })
                }}
                className="dark:border-slate-700"
              >
                Copiar JSON
              </Button>
            </div>

            {jsonView === "" ? (
              <Alert className="dark:border-slate-700 dark:bg-slate-800">
                <AlertTitle>No hay nodos en la fórmula</AlertTitle>
                <AlertDescription>
                  Ve a la pestaña "Constructor" y añade nodos para ver el JSON generado.
                </AlertDescription>
              </Alert>
            ) : (
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto max-h-[500px] text-sm font-mono">
                {jsonView}
              </pre>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// Componente interno que usa los hooks de ReactFlow
function FlowBuilder({
  formula,
  onSave,
  isLoading,
  formulaNombre,
  setFormulaNombre,
  formulaDescripcion,
  setFormulaDescripcion,
  isEvaluating,
  setIsEvaluating,
  evaluationResult,
  setEvaluationResult,
  activeTab,
  setActiveTab,
  jsonView,
  setJsonView,
  saveRef,
  evaluateRef,
  currentNodes,
  setCurrentNodes,
  currentEdges,
  setCurrentEdges,
  showHelp,
  setShowHelp,
  lastSaved,
  setLastSaved,
}: FormulaBuilderProps & {
  formulaNombre: string
  setFormulaNombre: (value: string) => void
  formulaDescripcion: string
  setFormulaDescripcion: (value: string) => void
  isEvaluating: boolean
  setIsEvaluating: (value: boolean) => void
  evaluationResult: number | null
  setEvaluationResult: (value: number | null) => void
  activeTab: string
  setActiveTab: (value: string) => void
  jsonView: string
  setJsonView: (value: string) => void
  saveRef: React.MutableRefObject<(() => void) | undefined>
  evaluateRef: React.MutableRefObject<(() => void) | undefined>
  currentNodes: Node[]
  setCurrentNodes: (nodes: Node[]) => void
  currentEdges: Edge[]
  setCurrentEdges: (edges: Edge[]) => void
  showHelp: boolean
  setShowHelp: (value: boolean) => void
  lastSaved: Date | null
  setLastSaved: (date: Date | null) => void
}) {
  // Solución para el error de ResizeObserver
  useEffect(() => {
    // Prevenir el error de ResizeObserver
    const originalError = console.error
    console.error = (...args) => {
      if (args[0]?.includes?.("ResizeObserver loop")) {
        return
      }
      originalError(...args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(currentNodes.length > 0 ? currentNodes : [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentEdges.length > 0 ? currentEdges : [])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { theme, setTheme } = useTheme()

  // Inicializar con la fórmula existente si se proporciona
  useEffect(() => {
    if (formula && currentNodes.length === 0) {
      setFormulaNombre(formula.nombre || "")
      setFormulaDescripcion(formula.descripcion || "")

      // Convertir los nodos de la fórmula al formato de ReactFlow
      const flowNodes =
        formula.nodos?.map((nodo) => {
          let type = ""
          switch (nodo.tipo) {
            case TipoNodo.VARIABLE:
              type = "variableNode"
              break
            case TipoNodo.OPERACION:
              type = "operationNode"
              break
            case TipoNodo.NUMERO:
              type = "numberNode"
              break
 
            case TipoNodo.RESULTADO:
              type = "resultNode"
              break
            case TipoNodo.COMPARADOR:
              type = "comparatorNode"
              break
          }

          return {
            id: nodo.id,
            type,
            position: nodo.posicion || { x: 100, y: 100 }, // Posición por defecto si no existe
            data: nodo.datos || {},
          }
        }) || []

      // Convertir las conexiones de la fórmula al formato de ReactFlow
      const flowEdges =
        formula.conexiones?.map((conexion) => ({
          id: conexion.id || `e-${conexion.origen}-${conexion.destino}`,
          source: conexion.origen,
          target: conexion.destino,
          sourceHandle: conexion.puntoSalida,
          targetHandle: conexion.puntoEntrada,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            strokeWidth: 2,
          },
          animated: true,
        })) || []

      setNodes(flowNodes)
      setEdges(flowEdges)
      setCurrentNodes(flowNodes)
      setCurrentEdges(flowEdges)

      // Actualizar la vista JSON
      updateJsonView(formula)
    }
  }, [
    formula,
    setNodes,
    setEdges,
    setFormulaNombre,
    setFormulaDescripcion,
    currentNodes.length,
    setCurrentNodes,
    setCurrentEdges,
  ])

  // Actualizar los nodos y conexiones globales cuando cambian localmente
  useEffect(() => {
    setCurrentNodes(nodes)
    setCurrentEdges(edges)
  }, [nodes, edges, setCurrentNodes, setCurrentEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      // Para conexiones normales
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: {
              strokeWidth: 2,
            },
            animated: true,
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow")

      // Verificar si el tipo es válido y si tenemos las coordenadas del contenedor
      if (typeof type === "undefined" || !type || !reactFlowBounds || !reactFlowInstance) {
        return
      }

      // Calcular la posición donde se soltó el elemento
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      // Crear un nuevo nodo según el tipo
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {},
      }

      // Configurar datos específicos según el tipo de nodo
      switch (type) {
        case "variableNode":
          newNode.data = {
            variable: TipoVariable.RESERVACIONES,
            etiqueta: "Reservaciones",
          }
          break
        case "operationNode":
          newNode.data = {
            operacion: TipoOperacion.SUMA,
          }
          break
        case "numberNode":
          newNode.data = { valor: 0 }
          break
        case "comparatorNode":
          newNode.data = {
            condicion: TipoOperacion.MAYOR_QUE,
            etiqueta: "Comparador",
          }
          break
        case "resultNode":
          // Verificar si ya existe un nodo de resultado
          const existingResultNode = nodes.find((n) => n.type === "resultNode")
          if (existingResultNode) {
            // Verificar si ya hay demasiados nodos de resultado
            const resultNodes = nodes.filter((n) => n.type === "resultNode")
            if (resultNodes.length >= 1) {
              toast({
                title: "Error",
                description: "Solo puede haber un nodo de resultado en la fórmula.",
                variant: "destructive",
              })
              return
            }
          }
          newNode.data = { etiqueta: "Resultado" }
          break
      }

      // Añadir el nuevo nodo al flujo
      setNodes((nds) => nds.concat(newNode))

      // Actualizar la vista JSON
      setTimeout(() => {
        updateJsonView()
      }, 100)

      toast({
        title: "Nodo añadido",
        description: `Se ha añadido un nuevo nodo de tipo ${type.replace("Node", "")}.`,
      })
    },
    [reactFlowInstance, nodes, setNodes],
  )

  const handleSave = () => {
    if (!formulaNombre) {
      toast({
        title: "Error",
        description: "La fórmula debe tener un nombre.",
        variant: "destructive",
      })
      return
    }

    // Verificar si hay al menos un nodo de resultado
    const resultNodes = nodes.filter((n) => n.type === "resultNode")
    if (resultNodes.length === 0) {
      toast({
        title: "Error",
        description: "La fórmula debe tener al menos un nodo de resultado.",
        variant: "destructive",
      })
      return
    }

    // Identificar el nodo de resultado principal
    const mainResultNode = resultNodes[0]

    // Convertir los nodos y conexiones al formato de la fórmula
    const formulaNodos = nodes.map((node) => {
      let tipo: TipoNodo
      switch (node.type) {
        case "variableNode":
          tipo = TipoNodo.VARIABLE
          break
        case "operationNode":
          tipo = TipoNodo.OPERACION
          break
        case "numberNode":
          tipo = TipoNodo.NUMERO
          break
        case "comparatorNode":
          tipo = TipoNodo.COMPARADOR
          break
        case "resultNode":
          tipo = TipoNodo.RESULTADO
          break
        default:
          tipo = TipoNodo.VARIABLE
      }

      return {
        id: node.id,
        tipo,
        posicion: node.position,
        datos: node.data,
      }
    })

    const formulaConexiones = edges.map((edge) => ({
      id: edge.id,
      origen: edge.source,
      destino: edge.target,
      puntoSalida: edge.sourceHandle || "",
      puntoEntrada: edge.targetHandle || "",
    }))

    const nuevaFormula: Formula = {
      id: formula?.id || `formula-${Date.now()}`,
      nombre: formulaNombre,
      descripcion: formulaDescripcion,
      nodos: formulaNodos,
      conexiones: formulaConexiones,
      nodoResultado: mainResultNode?.id || "resultado-default", // Aseguramos que siempre haya un valor
      fechaCreacion: formula?.fechaCreacion || new Date(),
      fechaActualizacion: new Date(),
    }

    onSave(nuevaFormula)
    setLastSaved(new Date())

    toast({
      title: "Fórmula guardada",
      description: "Los cambios han sido guardados correctamente.",
    })
  }

  const handleEvaluate = () => {
    setIsEvaluating(true)

    // Datos de ejemplo para la evaluación
    const datosEjemplo = {
      reservaciones: 30,
      listaEspera: 5,
      cortesias: 2,
      capacidad: 50,
      reservasPagadas: 28,
      lugares: 20,
    }

    try {
      // Convertir al formato de fórmula para evaluación
      const formulaTemp: Formula = {
        id: "temp",
        nombre: formulaNombre || "Fórmula temporal",
        descripcion: formulaDescripcion || "",
        nodos: nodes.map((node) => ({
          id: node.id,
          tipo:
            node.type === "variableNode"
              ? TipoNodo.VARIABLE
              : node.type === "operationNode"
                ? TipoNodo.OPERACION
                : node.type === "numberNode"
                  ? TipoNodo.NUMERO
                  : node.type === "comparatorNode"
                    ? TipoNodo.COMPARADOR
                    : TipoNodo.RESULTADO,
          posicion: node.position,
          datos: node.data,
        })),
        conexiones: edges.map((edge) => ({
          id: edge.id,
          origen: edge.source,
          destino: edge.target,
          puntoSalida: edge.sourceHandle || "",
          puntoEntrada: edge.targetHandle || "",
        })),
        nodoResultado: nodes.find((n) => n.type === "resultNode")?.id || "resultado-default",
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      }

      const resultado = evaluarFormula(formulaTemp, datosEjemplo)
      setEvaluationResult(resultado.valor)

      toast({
        title: "Evaluación completada",
        description: `Resultado con datos de ejemplo: S/ ${resultado.valor.toFixed(2)}`,
      })
    } catch (error) {
      toast({
        title: "Error en la evaluación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  // Función para actualizar la vista JSON
  const updateJsonView = (currentFormula?: Formula) => {
    if (!currentFormula) {
      // Si no se proporciona una fórmula, crear una temporal con los nodos y conexiones actuales
      const tempFormula: Formula = {
        id: formula?.id || `formula-${Date.now()}`,
        nombre: formulaNombre,
        descripcion: formulaDescripcion,
        nodos: nodes.map((node) => ({
          id: node.id,
          tipo:
            node.type === "variableNode"
              ? TipoNodo.VARIABLE
              : node.type === "operationNode"
                ? TipoNodo.OPERACION
                : node.type === "numberNode"
                  ? TipoNodo.NUMERO
                  : node.type === "comparatorNode"
                    ? TipoNodo.COMPARADOR
                    : TipoNodo.RESULTADO,
          posicion: node.position,
          datos: node.data,
        })),
        conexiones: edges.map((edge) => ({
          id: edge.id,
          origen: edge.source,
          destino: edge.target,
          puntoSalida: edge.sourceHandle || "",
          puntoEntrada: edge.targetHandle || "",
        })),
        nodoResultado: nodes.find((n) => n.type === "resultNode")?.id || "resultado-default",
        fechaCreacion: formula?.fechaCreacion || new Date(),
        fechaActualizacion: new Date(),
      }

      setJsonView(JSON.stringify(tempFormula, null, 2))
    } else {
      setJsonView(JSON.stringify(currentFormula, null, 2))
    }
  }

  // Función para limpiar el canvas
  const handleClearCanvas = () => {
    if (nodes.length === 0) return

    if (confirm("¿Estás seguro de que deseas eliminar todos los nodos? Esta acción no se puede deshacer.")) {
      setNodes([])
      setEdges([])
      updateJsonView({
        ...formula,
        nodos: [],
        conexiones: [],
        nodoResultado: "resultado-default",
      } as Formula)

      toast({
        title: "Canvas limpiado",
        description: "Se han eliminado todos los nodos y conexiones.",
      })
    }
  }

  // Función para centrar la vista
  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 })

      toast({
        title: "Vista ajustada",
        description: "Se ha centrado la vista en los nodos existentes.",
      })
    }
  }

  // Funciones de zoom
  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut()
    }
  }

  // Función para eliminar un nodo específico
  const handleDeleteNode = (nodeId: string) => {
    // Eliminar el nodo
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))

    // Eliminar todas las conexiones relacionadas con este nodo
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))

    // Actualizar la vista JSON
    setTimeout(() => {
      updateJsonView()
    }, 100)

    // Limpiar el nodo seleccionado
    setSelectedNode(null)

    toast({
      title: "Nodo eliminado",
      description: "Se ha eliminado el nodo y sus conexiones.",
    })
  }

  // Manejar la selección de nodos
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }

  // Manejar el clic en el fondo para deseleccionar
  const onPaneClick = () => {
    setSelectedNode(null)
  }

  // Alternar el tema
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Asignar las referencias a las funciones
  useEffect(() => {
    saveRef.current = handleSave
    evaluateRef.current = handleEvaluate
  }, [nodes, edges, formulaNombre, formulaDescripcion, saveRef, evaluateRef])

  return (
    <div className="flex h-[700px] w-full max-w-[1400px] mx-auto">
      <Sidebar
        formulaNombre={formulaNombre}
        formulaDescripcion={formulaDescripcion}
        setFormulaNombre={setFormulaNombre}
        setFormulaDescripcion={setFormulaDescripcion}
      />
      <div className="flex-grow relative h-full w-[calc(100%-320px)]" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode={["Control", "Meta"]}
          selectionKeyCode={["Shift"]}
          className="dark:bg-slate-900"
          // Aumentar el tamaño de los handles para todos los nodos
          defaultEdgeOptions={{
            style: { strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: true,
          }}
        >
          <Background color={theme === "dark" ? "#334155" : "#aaa"} gap={16} />
          <Controls showInteractive={false} className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />

          {/* Panel superior derecho con controles */}
          <Panel
            position="top-right"
            className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-md border dark:border-slate-700 flex gap-2"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    className="dark:border-slate-700 dark:text-slate-200"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cambiar tema</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 dark:bg-slate-700" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    className="dark:border-slate-700 dark:text-slate-200"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Acercar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    className="dark:border-slate-700 dark:text-slate-200"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alejar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFitView}
                    className="dark:border-slate-700 dark:text-slate-200"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ajustar vista</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-1 dark:bg-slate-700" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClearCanvas}
                    className="dark:border-slate-700 dark:text-slate-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpiar todo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      updateJsonView()
                      setActiveTab("json")
                    }}
                    className="dark:border-slate-700 dark:text-slate-200"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver JSON</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Panel>

          {/* Panel inferior con información */}
          <Panel
            position="bottom-center"
            className="bg-white dark:bg-slate-800 p-2 rounded-t-md shadow-md border dark:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 dark:text-blue-100">
                  Nodos: {nodes.length}
                </Badge>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900 dark:text-green-100">
                  Conexiones: {edges.length}
                </Badge>
              </div>

              {nodes.length === 0 && (
                <span className="text-sm text-muted-foreground dark:text-slate-400">
                  Arrastra elementos desde el panel izquierdo para comenzar
                </span>
              )}

              {nodes.length > 0 && !nodes.some((n) => n.type === "resultNode") && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  No olvides añadir un nodo de Resultado
                </span>
              )}
            </div>
          </Panel>

          {/* Panel para eliminar nodo seleccionado (ahora a la izquierda) */}
          {selectedNode && (
            <Panel position="top-left" className="bg-transparent mt-16">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="rounded-full shadow-md"
                title="Eliminar nodo"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </Panel>
          )}

          {/* Panel de ayuda */}
          {showHelp && (
            <Panel
              position="top-center"
              className="bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-md shadow-md border border-indigo-300 dark:border-indigo-700 max-w-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium text-indigo-800 dark:text-indigo-300">Guía de Uso</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
                  className="h-6 w-6 p-0 rounded-full"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-3 text-sm text-indigo-700 dark:text-indigo-300">
                <p className="font-medium">Cómo construir una fórmula:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Arrastra los componentes desde el panel izquierdo al área de trabajo</li>
                  <li>Conecta los nodos arrastrando desde los puntos de conexión</li>
                  <li>Configura cada nodo haciendo clic en él</li>
                  <li>El nodo Comparador devuelve 1 si la condición se cumple, 0 si no</li>
                  <li>Asegúrate de tener un nodo de Resultado conectado al final</li>
                </ol>
                <div className="bg-indigo-100 dark:bg-indigo-800/50 p-2 rounded-md mt-2">
                  <p className="text-xs font-medium">
                    Consejo: Usa el nodo Comparador para crear condiciones que devuelvan valores numéricos (1 o 0) que
                    puedas usar en cálculos matemáticos.
                  </p>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  )
}

