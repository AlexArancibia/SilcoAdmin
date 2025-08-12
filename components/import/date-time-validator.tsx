"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DateTimeValidatorProps {
  dia: string
  hora: string
  onDiaChange: (dia: string) => void
  onHoraChange: (hora: string) => void
  className?: string
  isISO?: boolean // Indica si la fecha ya está en formato ISO
}

export function DateTimeValidator({ 
  dia, 
  hora, 
  onDiaChange, 
  onHoraChange, 
  className = "",
  isISO = false
}: DateTimeValidatorProps) {
  const [isValid, setIsValid] = useState<boolean>(true)
  const [validationMessage, setValidationMessage] = useState<string>("")
  const [previewDate, setPreviewDate] = useState<string>("")

  // Validar fecha y hora en tiempo real
  useEffect(() => {
    const validateDateTime = () => {
      // Si es fecha ISO, validar directamente
      if (isISO && dia.includes('T')) {
        try {
          const fechaISO = new Date(dia)
          if (!isNaN(fechaISO.getTime())) {
            setIsValid(true)
            setValidationMessage("Fecha y hora válidas")
            setPreviewDate(fechaISO.toLocaleString('es-ES'))
          } else {
            setIsValid(false)
            setValidationMessage("Formato ISO inválido")
            setPreviewDate("")
          }
        } catch (error) {
          setIsValid(false)
          setValidationMessage("Error al validar fecha ISO")
          setPreviewDate("")
        }
        return
      }

      if (!dia || !hora) {
        setIsValid(false)
        setValidationMessage("Fecha y hora son requeridas")
        setPreviewDate("")
        return
      }

      try {
        // Validar formato de fecha
        let fecha: Date | null = null
        
        if (dia.includes("/")) {
          // Formato DD/MM/YYYY
          const parts = dia.split("/")
          if (parts.length === 3) {
            fecha = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
          }
        } else {
          // Formato YYYY-MM-DD
          fecha = new Date(dia)
        }

        if (!fecha || isNaN(fecha.getTime())) {
          setIsValid(false)
          setValidationMessage("Formato de fecha inválido. Use YYYY-MM-DD o DD/MM/YYYY")
          setPreviewDate("")
          return
        }

        // Validar formato de hora
        const horaStr = hora.trim()
        let horas = 0
        let minutos = 0

        // Formato HH:MM:SS a.m./p.m. (hora peruana) - "7:00:00 a. m. (hora peruana)"
        if (horaStr.includes("a. m.") || horaStr.includes("p. m.") || horaStr.includes("(hora peruana)")) {
          // Limpiar texto adicional y convertir a formato estándar
          let horaLimpia = horaStr
            .replace(/\s*\(hora peruana\)/g, "") // Remover "(hora peruana)"
            .replace(/\s*a\.\s*m\./g, " AM") // Normalizar "a. m." a "AM"
            .replace(/\s*p\.\s*m\./g, " PM") // Normalizar "p. m." a "PM"
            .replace(/\s+/g, " ") // Normalizar espacios múltiples
            .trim()
          
          // Extraer horas, minutos y periodo
          const match = horaLimpia.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)
          if (match) {
            let [_, h, m, segundos, periodo] = match
            let horasNum = parseInt(h)
            const minutosNum = parseInt(m)
            
            // Convertir a formato 24 horas
            if (periodo.toUpperCase() === 'PM' && horasNum !== 12) {
              horasNum += 12
            } else if (periodo.toUpperCase() === 'AM' && horasNum === 12) {
              horasNum = 0
            }
            
            horas = horasNum
            minutos = minutosNum
          } else {
            // Fallback: intentar extraer solo horas y minutos
            const matchSimple = horaLimpia.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i)
            if (matchSimple) {
              let [_, h, m, periodo] = matchSimple
              let horasNum = parseInt(h)
              const minutosNum = parseInt(m)
              
              if (periodo.toUpperCase() === 'PM' && horasNum !== 12) {
                horasNum += 12
              } else if (periodo.toUpperCase() === 'AM' && horasNum === 12) {
                horasNum = 0
              }
              
              horas = horasNum
              minutos = minutosNum
            } else {
              setIsValid(false)
              setValidationMessage("Formato de hora peruana inválido")
              setPreviewDate("")
              return
            }
          }
        } else if (horaStr.includes(":")) {
          const [h, m] = horaStr.split(":")
          horas = parseInt(h)
          minutos = parseInt(m)
        } else if (horaStr.match(/^\d{1,2}$/)) {
          horas = parseInt(horaStr)
          minutos = 0
        } else {
          setIsValid(false)
          setValidationMessage("Formato de hora inválido. Use HH:MM, HH, o formato peruano")
          setPreviewDate("")
          return
        }

        if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
          setIsValid(false)
          setValidationMessage("Hora inválida. Horas: 0-23, Minutos: 0-59")
          setPreviewDate("")
          return
        }

        // Aplicar hora a la fecha
        fecha.setHours(horas, minutos, 0, 0)
        
        // Validar que la fecha no sea en el pasado
        const ahora = new Date()
        if (fecha < ahora) {
          setIsValid(false)
          setValidationMessage("La fecha no puede ser en el pasado")
          setPreviewDate("")
          return
        }

        // Todo válido
        setIsValid(true)
        setValidationMessage("Fecha y hora válidas")
        setPreviewDate(fecha.toLocaleString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }))

      } catch (error) {
        setIsValid(false)
        setValidationMessage("Error al validar fecha y hora")
        setPreviewDate("")
      }
    }

    validateDateTime()
  }, [dia, hora])

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="dia" className="text-sm font-medium">
            Fecha
          </Label>
          <Input
            id="dia"
            value={dia}
            onChange={(e) => onDiaChange(e.target.value)}
            placeholder="YYYY-MM-DD"
            className={!isValid && !dia ? "border-red-500" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hora" className="text-sm font-medium">
            Hora
          </Label>
          <Input
            id="hora"
            value={hora}
            onChange={(e) => onHoraChange(e.target.value)}
            placeholder="HH:MM"
            className={!isValid && !hora ? "border-red-500" : ""}
          />
        </div>
      </div>

      {/* Estado de validación */}
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
          {isValid ? "Válido" : "Inválido"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {validationMessage}
        </span>
      </div>

      {/* Vista previa de la fecha */}
      {previewDate && (
        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Vista previa:</strong> {previewDate}
          </AlertDescription>
        </Alert>
      )}

      {/* Sugerencias de formato */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Formatos soportados:</strong></p>
        <p>• Fecha: YYYY-MM-DD (ej: 2024-01-15) o DD/MM/YYYY (ej: 15/01/2024)</p>
        <p>• Hora: HH:MM (ej: 14:30) o HH (ej: 14 para 2:00 PM)</p>
      </div>
    </div>
  )
}
