import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ExcelImport } from "@/components/import/excel-import"

export const metadata: Metadata = {
  title: "Importar Datos | Sistema de Gestión de Instructores",
  description: "Importa datos de clases desde Excel con mapeo automático de semanas",
}

export default function ImportPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Importar Datos"
        text="Importa datos de clases desde Excel con mapeo automático de semanas. Proceso simplificado en 3 pasos."
      />
      <div className="grid gap-6">
        <ExcelImport />
      </div>
    </DashboardShell>
  )
}

