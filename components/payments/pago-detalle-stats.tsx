"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { CreditCard, DollarSign, Calendar } from "lucide-react"
import type {   Instructor, PagoInstructor, Periodo } from "@/types/schema"

interface PagoDetalleStatsProps {
  pago: PagoInstructor
  instructor: Instructor
  periodo: Periodo
  clases: any[]
}

export function PagoDetalleStats({ pago, instructor, periodo, clases }: PagoDetalleStatsProps) {
  // Calcular estadísticas
  const totalClases = clases.length
  const totalReservas = clases.reduce((sum, clase) => sum + clase.reservasTotales, 0)
  const totalCapacidad = clases.reduce((sum, clase) => sum + clase.lugares, 0)
  const ocupacionPromedio = totalCapacidad > 0 ? Math.round((totalReservas / totalCapacidad) * 100) : 0

  // Datos para el gráfico de ocupación por día
  const ocupacionPorDia = clases.map((clase) => {
    const fecha = new Date(clase.fecha)
    const dia = fecha.toLocaleDateString("es-ES", { weekday: "short" })
    const ocupacion = Math.round((clase.reservasTotales / clase.lugares) * 100)

    return {
      dia,
      fecha: fecha.toLocaleDateString(),
      ocupacion,
      reservas: clase.reservasTotales,
      capacidad: clase.lugares,
    }
  })

  // Datos para el gráfico de distribución de clases por estudio
  const clasesPorEstudio = clases.reduce((acc: any, clase) => {
    const estudio = clase.estudio
    if (!acc[estudio]) {
      acc[estudio] = 0
    }
    acc[estudio]++
    return acc
  }, {})

  const estudioData = Object.entries(clasesPorEstudio).map(([estudio, cantidad]) => ({
    name: estudio,
    value: cantidad as number,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
  }))

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
          <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pago.monto)}</div>
          <p className="text-xs text-muted-foreground">{totalClases} clases impartidas</p>
          <div className="mt-4 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocupacionPorDia.slice(-5)}>
                <Bar dataKey="ocupacion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ocupacionPromedio}%</div>
          <p className="text-xs text-muted-foreground">
            {totalReservas} reservas de {totalCapacidad} lugares
          </p>
          <div className="mt-4 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Ocupado", value: totalReservas, color: "#3b82f6" },
                    { name: "Disponible", value: totalCapacidad - totalReservas, color: "#e5e7eb" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={15}
                  outerRadius={30}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: "Ocupado", value: totalReservas, color: "#3b82f6" },
                    { name: "Disponible", value: totalCapacidad - totalReservas, color: "#e5e7eb" },
                  ].map((entry, index) => (
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
          <CardTitle className="text-sm font-medium">Distribución de Clases</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClases}</div>
          <p className="text-xs text-muted-foreground">Clases en {estudioData.length} estudios diferentes</p>
          <div className="mt-4 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estudioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={15}
                  outerRadius={30}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {estudioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

