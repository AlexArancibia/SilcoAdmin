import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { InstructorsTable } from "@/components/instructors/instructors-table"
import { PeriodSelector } from "@/components/period-selector"

export const metadata: Metadata = {
  title: "Instructores | Sistema de Gestión de Instructores",
  description: "Gestiona tus instructores",
}

// Actualizar el espaciado para mantener consistencia
export default function InstructorsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Instructores" text="Gestiona tus instructores.">
      </DashboardHeader>
      <div className="w-full">
        <InstructorsTable />
      </div>
    </DashboardShell>
  )
}

