import { Suspense } from "react"
import { ClassesTable } from "@/components/classes/classes-table"
import { ClassesFilter } from "@/components/classes/classes-filter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExcelImport } from "@/components/import/excel-import"

export const metadata = {
  title: "Clases | Siclo Platform",
  description: "Gestión de clases de instructores",
}

export default function ClassesPage({
  searchParams,
}: {
  searchParams: { periodoId?: string; instructorId?: string; disciplinaId?: string; semana?: string }
}) {
  // Parse search params
  const periodoId = searchParams.periodoId ? Number.parseInt(searchParams.periodoId) : undefined
  const instructorId = searchParams.instructorId ? Number.parseInt(searchParams.instructorId) : undefined
  const disciplinaId = searchParams.disciplinaId ? Number.parseInt(searchParams.disciplinaId) : undefined
  const semana = searchParams.semana ? Number.parseInt(searchParams.semana) : undefined

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Clases</h1>
        <p className="text-muted-foreground">
          Gestiona las clases de los instructores, filtra por periodo, semana, instructor o disciplina.
        </p>
      </div>

      <Tabs defaultValue="listado" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listado">Listado de Clases</TabsTrigger>
          <TabsTrigger value="importar">Importar Clases</TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtra las clases por diferentes criterios</CardDescription>
            </CardHeader>
            <CardContent>
              <ClassesFilter
                initialPeriodoId={periodoId}
                initialInstructorId={instructorId}
                initialDisciplinaId={disciplinaId}
                initialSemana={semana}
              />
            </CardContent>
          </Card>

          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Clases</CardTitle>
                  <CardDescription>Cargando clases...</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ClassesTable
              periodoId={periodoId}
              instructorId={instructorId}
              disciplinaId={disciplinaId}
              semana={semana}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="importar">
          <ExcelImport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

