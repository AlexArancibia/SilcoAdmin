import { Calendar, DollarSign, Sparkles, Users } from "lucide-react"
import { StatCard } from "./stat-card"

interface InstructorStatsProps {
  totalClases: number
  clasesCompletadas: number
  ocupacionPromedio: number
  totalMonto: number
  totalPotentialBonus: number
  totalReservas: number
  totalLugares: number
}

export function InstructorStats({
  totalClases,
  clasesCompletadas,
  ocupacionPromedio,
  totalMonto,
  totalPotentialBonus,
  totalReservas,
  totalLugares,
}: InstructorStatsProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4  ">
      <StatCard
        icon={<Calendar className="h-5 w-5" />}
        title="Clases"
        value={totalClases}
        description={`${clasesCompletadas} completadas`}
        color="text-blue-500"
      />

      <StatCard
        icon={<Users className="h-5 w-5" />}
        title="Ocupación"
        value={`${ocupacionPromedio}%`}
        description="Promedio"
        color="text-green-500"
      />

      <StatCard
        icon={<DollarSign className="h-5 w-5" />}
        title="Total a pagar"
        value={formatAmount(totalMonto)}
        description={totalPotentialBonus > 0 ? `Bono potencial: ${formatAmount(totalPotentialBonus)}` : "Este periodo"}
        color="text-purple-500"
        secondaryIcon={totalPotentialBonus > 0 ? <Sparkles className="h-3.5 w-3.5 text-green-500" /> : undefined}
      />

      <StatCard
        icon={<Users className="h-5 w-5" />}
        title="Reservas"
        value={totalReservas}
        description={`de ${totalLugares} lugares`}
        color="text-teal-500"
      />
    </div>
  )
}
