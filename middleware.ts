import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

// Rutas que requieren autenticación
const protectedRoutes = ["/configuracion", "/importar", "/formulas", "/pagos", "/instructores", ""]

// Rutas públicas (no requieren autenticación)
const publicRoutes = ["/login", "/register", "/api/auth"]

// Ruta principal para redirigir usuarios autenticados
const mainRoute = "/"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Obtener token de la cookie o del header
  const token = request.cookies.get("auth-token")?.value || request.headers.get("Authorization")?.split(" ")[1]
  
  // Verificar si el usuario está en la página de login
  if (pathname === "/login") {
    // Si tiene token válido, redirigir a la ruta principal
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
        await jwtVerify(token, secret)
        
        // Usuario autenticado, redirigir a la ruta principal
        return NextResponse.redirect(new URL(mainRoute, request.url))
      } catch (error) {
        // Token inválido, permitir acceso al login
        return NextResponse.next()
      }
    }
    // Sin token, permitir acceso al login
    return NextResponse.next()
  }

  // Verificar si la ruta es pública
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  if (!token) {
    // Redirigir a login si no hay token
    const url = new URL("/login", request.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  try {
    // Verificar token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
    await jwtVerify(token, secret)

    return NextResponse.next()
  } catch (error) {
    // Token inválido, redirigir a login
    const url = new URL("/login", request.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos y API routes que no necesitan autenticación
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
}