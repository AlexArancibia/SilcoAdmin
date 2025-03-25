import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rol = searchParams.get("rol")
    const nombre = searchParams.get("nombre")
    const email = searchParams.get("email")
    const activo = searchParams.get("activo")

    // Construir filtros
    const where: any = {}

    if (rol) where.rol = rol
    if (nombre) where.nombre = { contains: nombre, mode: "insensitive" }
    if (email) where.email = { contains: email, mode: "insensitive" }
    if (activo !== null) where.activo = activo === "true"

    const usuarios = await prisma.usuario.findMany({
      where,
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar si el cuerpo de la solicitud es válido
    const body = await request.json().catch(() => {
      throw new Error("Error al parsear el cuerpo de la solicitud")
    })

    // Verificar campos requeridos
    if (!body.nombre || !body.email || !body.password || !body.rol) {
      return NextResponse.json(
        {
          error: "Faltan campos requeridos (nombre, email, password, rol)",
        },
        { status: 400 },
      )
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: body.email },
    })

    if (usuarioExistente) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    // Hashear la contraseña
    const hashedPassword = await hash(body.password, 10)

    // Crear el usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        ...body,
        password: hashedPassword,
      },
    })

    // Eliminar la contraseña de la respuesta
    const { password, ...usuarioSinPassword } = nuevoUsuario

    return NextResponse.json(usuarioSinPassword, { status: 201 })
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}

