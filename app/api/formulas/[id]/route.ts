import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface UpdateFormulaRequest {
  parametros?: any
  requisitosCategoria?: any
  parametrosPago?: any
}

// Obtener una fórmula específica por ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const formula = await prisma.formula.findUnique({
      where: { id },
      include: {
        disciplina: true,
        periodo: true,
      },
    })

    if (!formula) {
      return NextResponse.json({ error: "Fórmula no encontrada" }, { status: 404 })
    }

    return NextResponse.json(formula)
  } catch (error) {
    console.error("Error al obtener fórmula:", error)
    return NextResponse.json({ error: "Error obteniendo la fórmula" }, { status: 500 })
  }
}

// Actualizar una fórmula específica por ID
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { parametros, requisitosCategoria, parametrosPago }: UpdateFormulaRequest = await req.json()
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Verificar que la fórmula existe
    const formulaExistente = await prisma.formula.findUnique({
      where: { id },
    })

    if (!formulaExistente) {
      return NextResponse.json({ error: "Fórmula no encontrada" }, { status: 404 })
    }

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

// Eliminar una fórmula mediante /api/formulas/:id
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Verificar que la fórmula existe
    const formulaExistente = await prisma.formula.findUnique({
      where: { id },
    })

    if (!formulaExistente) {
      return NextResponse.json({ error: "Fórmula no encontrada" }, { status: 404 })
    }

    await prisma.formula.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Fórmula eliminada" })
  } catch (error) {
    console.error("Error al eliminar fórmula:", error)
    return NextResponse.json({ error: "Error eliminando la fórmula" }, { status: 500 })
  }
}
