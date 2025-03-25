import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

// GET all instructors
export async function GET() {
  console.log("GET /api/instructors - Iniciando solicitud")
  try {
    console.log("GET /api/instructors - Intentando obtener instructores de la base de datos")
    const instructors = await prisma.instructor.findMany({
      include: {
        disciplinas: true,
      },
    })

    console.log(`GET /api/instructors - Éxito: Se encontraron ${instructors.length} instructores`)
    return NextResponse.json(instructors)
  } catch (error: unknown) {
    console.error("GET /api/instructors - Error:", error)
    // Verificar si el error es un objeto con propiedad stack
    if (error instanceof Error) {
      console.error("GET /api/instructors - Stack:", error.stack)
    }
    return NextResponse.json({ error: "Error fetching instructors" }, { status: 500 })
  }
}

// POST create a new instructor
export async function POST(request: NextRequest) {
  console.log("POST /api/instructors - Iniciando solicitud")
  try {
    console.log("POST /api/instructors - Intentando parsear el cuerpo de la solicitud")
    const body = await request.json()
    console.log("POST /api/instructors - Cuerpo de la solicitud:", JSON.stringify(body, null, 2))

    const { nombre, password, extrainfo, disciplinaIds } = body
    console.log("POST /api/instructors - Datos extraídos:", {
      nombre,
      password: password ? "***" : undefined,
      extrainfo: extrainfo ? JSON.stringify(extrainfo) : undefined,
      disciplinaIds,
    })

    // Verificar si ya existe un instructor con el mismo nombre
    console.log(`POST /api/instructors - Verificando si ya existe un instructor con nombre: ${nombre}`)
    const existingInstructor = await prisma.instructor.findUnique({
      where: { nombre },
    })

    if (existingInstructor) {
      console.log(`POST /api/instructors - Error: Ya existe un instructor con el nombre ${nombre}`)
      return NextResponse.json({ error: "An instructor with this name already exists" }, { status: 400 })
    }

    // Preparar los datos para la creación
    console.log("POST /api/instructors - Preparando datos para crear instructor")
    const createData: any = {
      nombre,
      password,
      extrainfo,
    }

    // Agregar disciplinas si se proporcionaron
    if (disciplinaIds && Array.isArray(disciplinaIds) && disciplinaIds.length > 0) {
      console.log(`POST /api/instructors - Conectando con ${disciplinaIds.length} disciplinas:`, disciplinaIds)
      createData.disciplinas = {
        connect: disciplinaIds.map((id: number) => ({ id })),
      }
    } else {
      console.log("POST /api/instructors - No se proporcionaron disciplinas para conectar")
    }

    console.log("POST /api/instructors - Datos de creación preparados:", JSON.stringify(createData, null, 2))

    // Crear el instructor
    console.log("POST /api/instructors - Intentando crear el instructor en la base de datos")
    const instructor = await prisma.instructor.create({
      data: createData,
      include: {
        disciplinas: true,
      },
    })

    console.log("POST /api/instructors - Instructor creado exitosamente:", JSON.stringify(instructor, null, 2))
    return NextResponse.json(instructor, { status: 201 })
  } catch (error: unknown) {
    console.error("POST /api/instructors - Error:", error)

    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      console.error("POST /api/instructors - Mensaje de error:", error.message)
      console.error("POST /api/instructors - Stack:", error.stack)

      // Verificar si es un error de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("POST /api/instructors - Código de error Prisma:", error.code)
        console.error("POST /api/instructors - Meta información del error:", error.meta)

        if (error.code === "P2002") {
          return NextResponse.json({ error: "An instructor with this name already exists" }, { status: 400 })
        }
      }

      return NextResponse.json({ error: `Error creating instructor: ${error.message}` }, { status: 500 })
    }

    // Si no es un Error estándar
    return NextResponse.json({ error: "Unknown error creating instructor" }, { status: 500 })
  }
}

