"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/shell"
 
import { InstructorPaymentHistory } from "@/components/instructors/instructor-payment-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { useInstructorDetail } from "@/hooks/use-instructor-detail"
import { InstructorDetailSkeleton } from "@/components/instructors/instructor-detail-skeleton"
import { InstructorHeader } from "@/components/instructors/instructor-header"
import { InstructorStats } from "@/components/instructors/instructor-stats"
import { InstructorInfo } from "@/components/instructors/instructor-info"
import { InstructorCategories } from "@/components/instructors/instructor-categories"
import { InstructorClasses } from "@/components/instructors/instructor-classes"

export default function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const instructorId = Number.parseInt(resolvedParams.id)

  if (isNaN(instructorId)) notFound()

  const {
    instructor,
    isLoading,
    isEditing,
    isSaving,
    editedInstructor,
    editedPaymentMetrics,
    handleEditToggle,
    handleSaveChanges,
    handleInputChange,
    handleExtraInfoChange,
    handlePaymentMetricChange,
    pagosPeriodo,
    clasesPeriodo,
    paymentDetails,
    currentPage,
    setCurrentPage,
    totalPages,
    currentPayments,
    totalClases,
    clasesCompletadas,

    totalReservas,
    totalLugares,
    totalMonto,
    ocupacionPromedio,
    totalPotentialBonus,
    getCategoriesByDiscipline,
    isLoadingClases,
    isLoadingDisciplinas,
  } = useInstructorDetail(instructorId)

  if (isLoading) {
    return <InstructorDetailSkeleton />
  }

  return (
    <DashboardShell>
      {/* Header Section */}
      <InstructorHeader instructor={instructor} isEditing={isEditing} handleEditToggle={handleEditToggle} />

      {/* Stats Grid */}
      <InstructorStats
        totalClases={totalClases}
        clasesCompletadas={clasesCompletadas}
        ocupacionPromedio={ocupacionPromedio}
        totalMonto={totalMonto}
        totalPotentialBonus={totalPotentialBonus}
        totalReservas={totalReservas}
        totalLugares={totalLugares}
      />

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-5 ">
        {/* Left Column - Instructor Info */}
        <div className="md:col-span-1 space-y-5">
          <InstructorInfo
            instructor={instructor}
            isEditing={isEditing}
            isSaving={isSaving}
            editedInstructor={editedInstructor}
            editedPaymentMetrics={editedPaymentMetrics}
            handleSaveChanges={handleSaveChanges}
            handleInputChange={handleInputChange}
            handleExtraInfoChange={handleExtraInfoChange}
            handlePaymentMetricChange={handlePaymentMetricChange}
            pagosPeriodo={pagosPeriodo}
          />

          {/* Metrics Card */}
          <InstructorCategories getCategoriesByDiscipline={getCategoriesByDiscipline} />
        </div>

        {/* Right Column - Classes and Payments */}
        <div className="md:col-span-2 space-y-5">

        <Card className="border shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Historial de pagos
              </CardTitle>
              <CardDescription>Registro de todos los pagos realizados</CardDescription>
            </CardHeader>

            <CardContent>
              <InstructorPaymentHistory pagos={pagosPeriodo} />
            </CardContent>
          </Card>
          <InstructorClasses
            isLoadingClases={isLoadingClases}
            isLoadingDisciplinas={isLoadingDisciplinas}
            clasesPeriodo={clasesPeriodo}
            paymentDetails={paymentDetails}
            currentPayments={currentPayments}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
          />

          {/* Payment History Card */}
          
        </div>
      </div>
    </DashboardShell>
  )
}
