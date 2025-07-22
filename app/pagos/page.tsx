"use client"

import { Suspense } from "react"
import { useSearchParams } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PagosTable } from "@/components/payments/pagos-table"
import { PagosFilter } from "@/components/payments/pagos-filter"
import { DashboardShell } from "@/components/dashboard/shell"

export default function PagosPage() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;
  const estado = searchParams.get("estado") || undefined;
  const instructorId = searchParams.get("instructorId") ? parseInt(searchParams.get("instructorId")!) : undefined;
  const periodoId = searchParams.get("periodoId") ? parseInt(searchParams.get("periodoId")!) : undefined;
  const busqueda = searchParams.get("busqueda") || undefined;

  return (
    <DashboardShell>
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Pagos</h2>
            <p className="text-muted-foreground">
              Gestiona los pagos de los instructores, filtra por estado, instructor, o periodo.
            </p>
          </div>
        </div>

        <PagosFilter
          initialPage={page}
          initialLimit={limit}
          initialEstado={estado}
          initialInstructorId={instructorId}
          initialPeriodoId={periodoId}
          initialBusqueda={busqueda}
        />

        <Suspense
          key={`${page}-${limit}-${estado}-${instructorId}-${periodoId}-${busqueda}`}
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Pagos</CardTitle>
                <CardDescription>Cargando pagos...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: limit }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <PagosTable
            page={page}
            limit={limit}
            estado={estado}
            instructorId={instructorId}
            periodoId={periodoId}
            busqueda={busqueda}
          />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
