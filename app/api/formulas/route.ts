import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { parametrosPagoEjemplo, requisitosCategoriaEjemplo } from "@/types/schema"

const prisma = new PrismaClient()

interface FormulaRequest {
  disciplinaId: number
  periodoId: number
  parametros?: any
  requisitosCategoria?: any
  parametrosPago?: any
}

interface UpdateFormulaRequest {
  id: number
  parametros?: any
  requisitosCategoria?: any
  parametrosPago?: any
}

interface DeleteFormulaRequest {
  id: number
}

// Obtener todas las fórmulas
export async function GET() {
  try {
    const formulas = await prisma.formula.findMany({
      include: {
        disciplina: true,
        periodo: true,
      },
    })
    return NextResponse.json(formulas)
  } catch (error) {
    console.error("Error al obtener fórmulas:", error)
    return NextResponse.json({ error: "Error obteniendo fórmulas" }, { status: 500 })
  }
}

// Crear una nueva fórmula
export async function POST(req: Request) {
  try {
    const { disciplinaId, periodoId, parametros, requisitosCategoria, parametrosPago }: FormulaRequest =
      await req.json()

    // Si no se proporcionan requisitos o parámetros, usar los valores por defecto
    const requisitos = requisitosCategoria || requisitosCategoriaEjemplo
    const parametrosDePago = parametrosPago || parametrosPagoEjemplo

    const nuevaFormula = await prisma.formula.create({
      data: {
        disciplinaId,
        periodoId,
        parametros: parametros || {},
        requisitosCategoria: requisitos,
        parametrosPago: parametrosDePago,
      },
    })

    return NextResponse.json(nuevaFormula, { status: 201 })
  } catch (error) {
    console.error("Error al crear fórmula:", error)
    return NextResponse.json({ error: "Error creando la fórmula" }, { status: 500 })
  }
}

// Actualizar una fórmula
export async function PUT(req: Request) {
  try {
    const { id, parametros, requisitosCategoria, parametrosPago }: UpdateFormulaRequest = await req.json()

    // Preparar los datos para actualizar
    const updateData: any = {}
    if (parametros !== undefined) updateData.parametros = parametros
    if (requisitosCategoria !== undefined) updateData.requisitosCategoria = requisitosCategoria
    if (parametrosPago !== undefined) updateData.parametrosPago = parametrosPago

    const formulaActualizada = await prisma.formula.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(formulaActualizada)
  } catch (error) {
    console.error("Error al actualizar fórmula:", error)
    return NextResponse.json({ error: "Error actualizando la fórmula" }, { status: 500 })
  }
}

// Eliminar una fórmula
export async function DELETE(req: Request) {
  try {
    const { id }: DeleteFormulaRequest = await req.json()
    await prisma.formula.delete({
      where: { id },
    })
    return NextResponse.json({ message: "Fórmula eliminada" })
  } catch (error) {
    console.error("Error al eliminar fórmula:", error)
    return NextResponse.json({ error: "Error eliminando la fórmula" }, { status: 500 })
  }
}
