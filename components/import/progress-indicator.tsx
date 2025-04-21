import { CheckCircle2, FileText, UserCheck, BookOpen } from "lucide-react"

interface ProgressIndicatorProps {
  currentStep: number
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {[
          { step: 1, label: "Archivo y Periodo", icon: FileText },
          { step: 2, label: "Instructores", icon: UserCheck },
          { step: 3, label: "Disciplinas", icon: BookOpen },
          { step: 4, label: "Confirmación", icon: CheckCircle2 },
        ].map((item) => (
          <div
            key={item.step}
            className={`flex flex-col items-center ${
              currentStep >= item.step ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                currentStep >= item.step
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <div className="text-xs font-medium">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-3">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted rounded-full"></div>
        <div
          className="absolute top-0 left-0 h-1.5 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}
