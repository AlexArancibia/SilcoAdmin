import { saveAs } from "file-saver"

// Función para exportar datos a Excel
export const exportToExcel = async (data: any[], filename: string): Promise<void> => {
  try {
    // Importar la biblioteca xlsx dinámicamente
    const XLSX = await import("xlsx")

    // Crear una hoja de trabajo
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Crear un libro de trabajo
    const workbook = XLSX.utils.book_new()

    // Añadir la hoja de trabajo al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos")

    // Generar el archivo Excel como un blob
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    // Descargar el archivo
    saveAs(blob, `${filename}.xlsx`)
  } catch (error) {
    console.error("Error al exportar a Excel:", error)
    alert("No se pudo exportar a Excel. Por favor, inténtelo de nuevo.")
  }
}

// Función para formatear datos para exportación con tipo de retorno explícito
export const formatDataForExport = (data: any, includeFormatting = false): any => {
  // Si es un array, formateamos cada elemento
  if (Array.isArray(data)) {
    return data.map((item) => formatDataForExport(item, includeFormatting))
  }

  // Si es un objeto, formateamos sus propiedades
  if (typeof data === "object" && data !== null) {
    const formattedData: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
      // Formatear valores específicos
      if (
        key.toLowerCase().includes("pago") ||
        key.toLowerCase().includes("precio") ||
        key.toLowerCase().includes("monto")
      ) {
        // Formatear valores monetarios
        if (includeFormatting) {
          formattedData[key] =
            typeof value === "number"
              ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
              : value
        } else {
          formattedData[key] = value
        }
      } else if (key.toLowerCase().includes("porcentaje") || key.toLowerCase().includes("ocupacion")) {
        // Formatear porcentajes
        if (includeFormatting) {
          formattedData[key] = typeof value === "number" ? `${value}%` : value
        } else {
          formattedData[key] = value
        }
      } else {
        // Otros valores
        formattedData[key] = value
      }
    }

    return formattedData
  }

  // Si es un valor primitivo, lo devolvemos tal cual
  return data
}
