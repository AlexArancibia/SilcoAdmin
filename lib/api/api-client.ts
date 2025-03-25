// Cliente base para todas las APIs
export class ApiClient {
  protected baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  protected async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(`${window.location.origin}${this.baseUrl}${endpoint}`)

    // Añadir parámetros de consulta si existen
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }

  protected async post<T, U>(endpoint: string, data: T): Promise<U> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<U>
  }

  protected async put<T, U>(endpoint: string, data: T): Promise<U> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<U>
  }

  protected async delete<T = { success: boolean }>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }
}

