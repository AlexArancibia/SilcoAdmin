"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TimePickerProps {
  setHour: (hour: string) => void
  hour: string
}

export function TimePickerDemo({ setHour, hour }: TimePickerProps) {
  const [selectedHour, setSelectedHour] = React.useState<number>(Number.parseInt(hour.split(":")[0]) || 0)
  const [selectedMinute, setSelectedMinute] = React.useState<number>(Number.parseInt(hour.split(":")[1]) || 0)
  const [open, setOpen] = React.useState<boolean>(false)

  // Update the hour when selectedHour or selectedMinute changes
  React.useEffect(() => {
    const formattedHour = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`
    setHour(formattedHour)
  }, [selectedHour, selectedMinute, setHour])

  // Update selectedHour and selectedMinute when hour changes
  React.useEffect(() => {
    const [hourPart, minutePart] = hour.split(":")
    setSelectedHour(Number.parseInt(hourPart) || 0)
    setSelectedMinute(Number.parseInt(minutePart) || 0)
  }, [hour])

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHour = Number.parseInt(e.target.value)
    if (!isNaN(newHour) && newHour >= 0 && newHour <= 23) {
      setSelectedHour(newHour)
    }
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinute = Number.parseInt(e.target.value)
    if (!isNaN(newMinute) && newMinute >= 0 && newMinute <= 59) {
      setSelectedMinute(newMinute)
    }
  }

  const handleHourIncrement = () => {
    setSelectedHour((prev) => (prev === 23 ? 0 : prev + 1))
  }

  const handleHourDecrement = () => {
    setSelectedHour((prev) => (prev === 0 ? 23 : prev - 1))
  }

  const handleMinuteIncrement = () => {
    setSelectedMinute((prev) => (prev === 59 ? 0 : prev + 1))
  }

  const handleMinuteDecrement = () => {
    setSelectedMinute((prev) => (prev === 0 ? 59 : prev - 1))
  }

  const commonTimeSlots = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !hour && "text-muted-foreground")}
        >
          <Clock className="mr-2 h-4 w-4" />
          {hour || "Seleccionar hora"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hours" className="text-xs font-medium">
                Horas
              </Label>
              <Label htmlFor="minutes" className="text-xs font-medium">
                Minutos
              </Label>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col">
                <div className="flex">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={handleHourDecrement}
                  >
                    -
                  </Button>
                  <Input
                    id="hours"
                    className="h-8 w-14 rounded-none text-center"
                    value={selectedHour.toString().padStart(2, "0")}
                    onChange={handleHourChange}
                    min={0}
                    max={23}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={handleHourIncrement}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="flex items-center">:</div>
              <div className="flex flex-col">
                <div className="flex">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={handleMinuteDecrement}
                  >
                    -
                  </Button>
                  <Input
                    id="minutes"
                    className="h-8 w-14 rounded-none text-center"
                    value={selectedMinute.toString().padStart(2, "0")}
                    onChange={handleMinuteChange}
                    min={0}
                    max={59}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={handleMinuteIncrement}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-medium">Horarios comunes</Label>
            <div className="grid grid-cols-3 gap-2">
              {commonTimeSlots.map((timeSlot) => (
                <Button
                  key={timeSlot}
                  variant="outline"
                  size="sm"
                  className={cn("text-xs", hour === timeSlot && "bg-primary text-primary-foreground")}
                  onClick={() => {
                    const [h, m] = timeSlot.split(":")
                    setSelectedHour(Number.parseInt(h))
                    setSelectedMinute(Number.parseInt(m))
                    setOpen(false)
                  }}
                >
                  {timeSlot}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
