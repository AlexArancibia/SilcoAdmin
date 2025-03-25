import { ApiClient } from "./api-client"
import type { DatosExcelClase, ResultadoImportacion } from "@/types/importacion"

export class ImportarApi extends ApiClient {
  constructor() {
    super("/api")
  }

  async importarDatos(datos: DatosExcelClase[], periodoId: number, semana: number): Promise<ResultadoImportacion> {
    return this.post<{ datos: DatosExcelClase[]; periodoId: number; semana: number }, ResultadoImportacion>(
      "/importar",
      {
        datos,
        periodoId,
        semana,
      },
    )
  }
}

// Instancia singleton para usar en toda la aplicación
export const importarApi = new ImportarApi()

