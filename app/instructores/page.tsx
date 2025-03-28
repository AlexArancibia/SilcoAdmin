import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { InstructorsTable } from "@/components/instructors/instructors-table"

export const metadata: Metadata = {
  title: "Instructores | Sistema de Gestión de Instructores",
  description: "Gestiona tus instructores",
}

export default function InstructorsPage() {
  return (
    <DashboardShell>
      <DashboardHeader className="mb-0" heading="Instructores" text="Gestiona tus instructores." />
      <div className="w-full">
        <InstructorsTable />
      </div>
    </DashboardShell>
  )
}

