import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ExcelImportAPI } from "@/components/import/excel-import-api"

export const metadata: Metadata = {
  title: "Importar Datos | Sistema de Gestión de Instructores",
  description: "Importa datos de clases desde Excel usando las nuevas APIs del backend",
}

export default function ImportPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Importar Datos"
        text="Importa datos de clases desde Excel usando las nuevas APIs del backend. Proceso en 2 pasos: análisis y configuración."
      />
      <div className="grid gap-6">
        <ExcelImportAPI />
      </div>
    </DashboardShell>
  )
}

