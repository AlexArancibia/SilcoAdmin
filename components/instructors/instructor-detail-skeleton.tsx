import { DashboardShell } from "@/components/dashboard/shell"
import { Skeleton } from "@/components/ui/skeleton"

export function InstructorDetailSkeleton() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] md:col-span-1 rounded-lg" />
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[300px] rounded-lg" />
            <Skeleton className="h-[200px] rounded-lg" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
