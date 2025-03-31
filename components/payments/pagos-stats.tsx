"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { CreditCard, DollarSign, Users } from "lucide-react"
import type { PagoInstructor, Instructor, Periodo } from "@/types/schema"

interface PagosStatsProps {
  pagos: PagoInstructor[]
  instructores: Instructor[]
  periodos: Periodo[]
}

export function PagosStats({ pagos, instructores, periodos }: PagosStatsProps) {
  // Calcular estadísticas
  const totalPagos = pagos.length
  const totalMonto = pagos.reduce((sum, pago) => {
    // Calcular monto final con ajustes
    let montoFinal = pago.monto

    // Aplicar retención si existe
    if (pago.retencion && pago.retencion > 0) {
      montoFinal -= pago.retencion
    }

    // Aplicar reajuste si existe
    if (pago.reajuste && pago.reajuste > 0) {
      if (pago.tipoReajuste === "PORCENTAJE") {
        montoFinal += (montoFinal * pago.reajuste) / 100
      } else {
        // FIJO
        montoFinal += pago.reajuste
      }
    }

    return sum + montoFinal
  }, 0)

  const pagosPendientes = pagos.filter((pago) => pago.estado === "PENDIENTE").length
  const pagosAprobados = pagos.filter((pago) => pago.estado === "APROBADO").length

  // Datos para el gráfico de estados
  const estadosData = [
    { name: "Pendientes", value: pagosPendientes, color: "#FBBF24" },
    { name: "Aprobados", value: pagosAprobados, color: "#10B981" },
  ]

  // Datos para el gráfico de montos por periodo
  const montosPorPeriodo = periodos.map((periodo) => {
    const pagosPeriodo = pagos.filter((pago) => pago.periodoId === periodo.id)
    const montoPeriodo = pagosPeriodo.reduce((sum, pago) => {
      // Calcular monto final con ajustes
      let montoFinal = pago.monto

      // Aplicar retención si existe
      if (pago.retencion && pago.retencion > 0) {
        montoFinal -= pago.retencion
      }

      // Aplicar reajuste si existe
      if (pago.reajuste && pago.reajuste > 0) {
        if (pago.tipoReajuste === "PORCENTAJE") {
          montoFinal += (montoFinal * pago.reajuste) / 100
        } else {
          // FIJO
          montoFinal += pago.reajuste
        }
      }

      return sum + montoFinal
    }, 0)

    return {
      name: `P${periodo.numero}-${periodo.año}`,
      monto: montoPeriodo,
    }
  })

  // Formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalMonto)}</div>
          <p className="text-xs text-muted-foreground">{totalPagos} pagos registrados</p>
          <div className="mt-4 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={montosPorPeriodo.slice(-4)}>
                <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado de Pagos</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pagosPendientes}</div>
          <p className="text-xs text-muted-foreground">Pagos pendientes por aprobar</p>
          <div className="mt-4 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estadosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={15}
                  outerRadius={30}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {estadosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Instructores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{instructores.length}</div>
          <p className="text-xs text-muted-foreground">
            {instructores.filter((i) => pagos.some((p) => p.instructorId === i.id && p.estado === "PENDIENTE")).length}{" "}
            con pagos pendientes
          </p>
          <div className="mt-4 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Con pagos",
                    value: instructores.filter((i) => pagos.some((p) => p.instructorId === i.id)).length,
                  },
                  {
                    name: "Sin pagos",
                    value: instructores.filter((i) => !pagos.some((p) => p.instructorId === i.id)).length,
                  },
                ]}
              >
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

