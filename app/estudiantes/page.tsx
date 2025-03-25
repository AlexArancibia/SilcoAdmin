import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { StudentsTable } from "@/components/students/students-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Estudiantes | Sistema de Gestión de Instructores",
  description: "Gestiona tus estudiantes",
}

export default function StudentsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Estudiantes" text="Gestiona tus estudiantes.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Estudiante
        </Button>
      </DashboardHeader>
      <div className="w-full">
        <StudentsTable />
      </div>
    </DashboardShell>
  )
}

