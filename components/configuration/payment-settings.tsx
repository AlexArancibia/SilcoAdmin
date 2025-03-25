"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Save } from "lucide-react"

const paymentFormSchema = z.object({
  basePayPerClass: z.string().min(1, {
    message: "El pago base por clase es requerido.",
  }),
  bonusPerReservation: z.string().min(1, {
    message: "El bono por reservación es requerido.",
  }),
  minimumReservationsForBonus: z.string().min(1, {
    message: "El mínimo de reservaciones para bono es requerido.",
  }),
  paymentCurrency: z.string({
    required_error: "Por favor selecciona una moneda.",
  }),
  roundPayments: z.boolean().default(true),
  applyTaxes: z.boolean().default(false),
  taxRate: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentFormSchema>

const defaultValues: Partial<PaymentFormValues> = {
  basePayPerClass: "20",
  bonusPerReservation: "0.50",
  minimumReservationsForBonus: "0",
  paymentCurrency: "USD",
  roundPayments: true,
  applyTaxes: false,
  taxRate: "0",
}

export function PaymentSettings() {
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues,
  })

  const { watch, setValue } = form
  const applyTaxes = watch("applyTaxes")

  function onSubmit(data: PaymentFormValues) {
    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      console.log(data)
      setIsSaving(false)
      toast({
        title: "Configuración guardada",
        description: "La configuración de pagos ha sido actualizada correctamente.",
      })
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Cálculo de Pagos</CardTitle>
        <CardDescription>Configura los parámetros para el cálculo de pagos a instructores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="basePayPerClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pago Base por Clase</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="20.00" {...field} />
                    </FormControl>
                    <FormDescription>Monto base que se paga por cada clase impartida.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bonusPerReservation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bono por Reservación</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.50" {...field} />
                    </FormControl>
                    <FormDescription>Bono adicional por cada reservación en la clase.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="minimumReservationsForBonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mínimo de Reservaciones para Bono</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>Número mínimo de reservaciones para aplicar el bono.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PEN">Soles (PEN)</SelectItem>
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                        <SelectItem value="EUR">Euros (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Moneda utilizada para los pagos.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="roundPayments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Redondear Pagos</FormLabel>
                      <FormDescription className="text-muted-foreground">
                        Redondear los pagos al valor entero más cercano.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applyTaxes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aplicar Impuestos</FormLabel>
                      <FormDescription className="text-muted-foreground">
                        Aplicar impuestos al cálculo de pagos.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {applyTaxes && (
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de Impuesto (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="18.00" {...field} />
                    </FormControl>
                    <FormDescription>Porcentaje de impuesto a aplicar sobre el pago total.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

