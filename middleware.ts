import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromToken } from '@/lib/api/auth-api'

// Rutas que requieren autenticación
const protectedApiRoutes = [
  '/api/covers',
  '/api/penalizaciones',
  '/api/brandeos',
  '/api/theme-rides',
  '/api/workshops',
  '/api/pagos',
  '/api/instructores',
  '/api/clases',
  '/api/formulas',
  '/api/usuarios',
  '/api/importar',
  '/api/statistics'
]

// Rutas que requieren roles específicos para operaciones de modificación
const roleBasedApiRoutes = {
  '/api/covers': {
    // Solo MANAGER, ADMIN, SUPER_ADMIN pueden aprobar/rechazar covers
    PUT: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    DELETE: ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
  },
  '/api/penalizaciones': {
    POST: ['MANAGER', 'ADMIN', 'SUPER_ADMIN', 'OPERADOR'],
    PUT: ['MANAGER', 'ADMIN', 'SUPER_ADMIN', 'OPERADOR'],
    DELETE: ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
  },
  '/api/brandeos': {
    POST: ['MANAGER', 'ADMIN', 'SUPER_ADMIN', 'RH'],
    PUT: ['MANAGER', 'ADMIN', 'SUPER_ADMIN', 'RH'],
    DELETE: ['ADMIN', 'SUPER_ADMIN']
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, method } = request

  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Obtener el token de autorización
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Token de autorización requerido' },
      { status: 401 }
    )
  }

  const token = authHeader.split(' ')[1]
  
  try {
    // Verificar el token y obtener el usuario
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    // Verificar permisos específicos por rol para operaciones de modificación
    const routePermissions = roleBasedApiRoutes[pathname.split('/').slice(0, 3).join('/') as keyof typeof roleBasedApiRoutes]
    
    if (routePermissions && routePermissions[method as keyof typeof routePermissions]) {
      const allowedRoles = routePermissions[method as keyof typeof routePermissions]
      
      // Para instructores, permitir acceso a sus propios datos
      if (user.userType === 'instructor') {
        // Los instructores pueden acceder a covers donde son reemplazo
        if (pathname.startsWith('/api/covers') && method === 'GET') {
          return NextResponse.next()
        }
        // Permitir otras operaciones básicas para instructores
        if (['GET', 'POST'].includes(method)) {
          return NextResponse.next()
        }
      }
      
      // Verificar si el rol del usuario está permitido
      if (user.userType === 'usuario' && user.rol && !allowedRoles.includes(user.rol)) {
        return NextResponse.json(
          { error: 'No tienes permisos para realizar esta operación' },
          { status: 403 }
        )
      }
    }

    // Agregar información del usuario a los headers para uso en las rutas
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id.toString())
    requestHeaders.set('x-user-type', user.userType)
    if (user.rol) {
      requestHeaders.set('x-user-role', user.rol)
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.error('Error en middleware de autenticación:', error)
    return NextResponse.json(
      { error: 'Error de autenticación' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    '/api/((?!auth).)*',
  ],
}
