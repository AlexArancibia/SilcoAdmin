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

const importFormSchema = z.object({
  defaultDateFormat: z.string({
    required_error: "Por favor selecciona un formato de fecha.",
  }),
  autoProcessImport: z.boolean().default(false),
  validateDataBeforeImport: z.boolean().default(true),
  requiredColumns: z.string().min(1, {
    message: "Por favor especifica las columnas requeridas.",
  }),
  maxFileSize: z.string().min(1, {
    message: "Por favor especifica el tamaño máximo de archivo.",
  }),
})

type ImportFormValues = z.infer<typeof importFormSchema>

const defaultValues: Partial<ImportFormValues> = {
  defaultDateFormat: "DD/MM/YYYY",
  autoProcessImport: false,
  validateDataBeforeImport: true,
  requiredColumns: "id,date,instructor,studio,reservations",
  maxFileSize: "5",
}

export function ImportSettings() {
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
    defaultValues,
  })

  function onSubmit(data: ImportFormValues) {
    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      console.log(data)
      setIsSaving(false)
      toast({
        title: "Configuración guardada",
        description: "La configuración de importación ha sido actualizada correctamente.",
      })
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Importación de Datos</CardTitle>
        <CardDescription>Configura los parámetros para la importación de datos desde archivos Excel.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultDateFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato de Fecha Predeterminado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un formato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Formato de fecha utilizado en los archivos de importación.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxFileSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño Máximo de Archivo (MB)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormDescription>Tamaño máximo permitido para archivos de importación.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requiredColumns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Columnas Requeridas</FormLabel>
                  <FormControl>
                    <Input placeholder="id,date,instructor,studio,reservations" {...field} />
                  </FormControl>
                  <FormDescription>
                    Lista de columnas requeridas en el archivo de importación (separadas por comas).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="validateDataBeforeImport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border-input p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Validar Datos Antes de Importar</FormLabel>
                      <FormDescription>Verificar la integridad de los datos antes de procesarlos.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoProcessImport"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border-input p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Procesar Automáticamente</FormLabel>
                      <FormDescription>Procesar automáticamente los datos después de la importación.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

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

