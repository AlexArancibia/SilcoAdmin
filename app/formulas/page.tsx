"use client"

import { useState, useEffect } from "react"
import { AlertCircle, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"

import { useDisciplinasStore } from "@/store/useDisciplinasStore"
import { usePeriodosStore } from "@/store/usePeriodosStore"
import { useFormulasStore } from "@/store/useFormulaStore"
import { FormulaDB } from "@/types/schema"
import { FormulasTable } from "@/components/formulas/formulas-table"
import { NewFormulaDialog } from "@/components/formulas/new-formula-dialog"
import { EditParametersDialog } from "@/components/formulas/edit-parameters-dialog"
import { DeleteFormulaDialog } from "@/components/formulas/delete-formula-dialog"
import { TestFormulaDialog } from "@/components/formulas/test-formula-dialog"
import { DuplicateFormulaDialog } from "@/components/formulas/duplicate-formula-dialog"

 
export default function FormulasPage() {
  const { disciplinas, isLoading: isLoadingDisciplinas, fetchDisciplinas } = useDisciplinasStore()
  const { periodos, fetchPeriodos } = usePeriodosStore()
  const {
    formulas,
    formulaSeleccionada,
    isLoading: isLoadingFormulas,
    error,
    fetchFormulas,
    fetchFormulasPorDisciplina,
    fetchFormulaPorDisciplinaYPeriodo,
    crearFormula,
    actualizarFormula,
    eliminarFormula,
    seleccionarFormula,
  } = useFormulasStore()

  // Dialog states
  const [isNewFormulaDialogOpen, setIsNewFormulaDialogOpen] = useState(false)
  const [isParametersDialogOpen, setIsParametersDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTestFormulaDialogOpen, setIsTestFormulaDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load initial data
  useEffect(() => {
    fetchDisciplinas()
    fetchPeriodos()
    fetchFormulas()
  }, [fetchDisciplinas, fetchPeriodos, fetchFormulas])

  // Handler functions
  const handleCreateFormula = () => {
    setIsNewFormulaDialogOpen(true)
  }

  const handleEditParameters = (formula: FormulaDB | null) => {
    seleccionarFormula(formula)
    setIsParametersDialogOpen(true)
  }

  const handleDeleteFormula = (formula: FormulaDB | null) => {
    seleccionarFormula(formula)
    setIsDeleteDialogOpen(true)
  }

  const handleTestFormula = (formula: FormulaDB | null) => {
    seleccionarFormula(formula)
    setIsTestFormulaDialogOpen(true)
  }

  const handleDuplicateFormula = (formula: FormulaDB | null) => {
    seleccionarFormula(formula)
    setIsDuplicateDialogOpen(true)
  }

  const isLoading = isLoadingDisciplinas || isLoadingFormulas

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Fórmulas de Cálculo"
        text="Gestiona las fórmulas y parámetros para el cálculo de pagos a instructores por disciplina y período."
      >
        <Button onClick={handleCreateFormula}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Fórmula
        </Button>
      </DashboardHeader>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-8 w-full bg-muted animate-pulse rounded"></div>
          <div className="h-64 w-full bg-muted animate-pulse rounded"></div>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}. Por favor, intenta recargar la página.</AlertDescription>
        </Alert>
      ) : (
        <Card className="bg-transparent border-none shadow-none p-0 m-0">
          <FormulasTable
            formulas={formulas}
            disciplinas={disciplinas}
            periodos={periodos}
            onEditParameters={handleEditParameters}
            onDeleteFormula={handleDeleteFormula}
            onTestFormula={handleTestFormula}
            onDuplicateFormula={handleDuplicateFormula}
            onCreateFormula={handleCreateFormula}
          />
        </Card>
      )}

      {/* Dialogs */}
      <NewFormulaDialog
        open={isNewFormulaDialogOpen}
        onOpenChange={setIsNewFormulaDialogOpen}
        disciplinas={disciplinas}
        periodos={periodos}
        formulas={formulas}
        fetchFormulaPorDisciplinaYPeriodo={fetchFormulaPorDisciplinaYPeriodo}
        onContinue={setIsParametersDialogOpen}
      />

      <EditParametersDialog
        open={isParametersDialogOpen}
        onOpenChange={setIsParametersDialogOpen}
        formula={formulaSeleccionada}
        disciplinas={disciplinas}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        crearFormula={crearFormula}
        actualizarFormula={actualizarFormula}
        fetchFormulas={fetchFormulas}
        seleccionarFormula={seleccionarFormula}
      />

      <DeleteFormulaDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        formula={formulaSeleccionada}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        eliminarFormula={eliminarFormula}
        fetchFormulas={fetchFormulas}
        seleccionarFormula={seleccionarFormula}
      />

      <TestFormulaDialog
        open={isTestFormulaDialogOpen}
        onOpenChange={setIsTestFormulaDialogOpen}
        formula={formulaSeleccionada}
      />

      <DuplicateFormulaDialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        formula={formulaSeleccionada}
        periodos={periodos}
        formulas={formulas}
        fetchFormulaPorDisciplinaYPeriodo={fetchFormulaPorDisciplinaYPeriodo}
        crearFormula={crearFormula}
        fetchFormulas={fetchFormulas}
        seleccionarFormula={seleccionarFormula}
      />
    </DashboardShell>
  )
}
