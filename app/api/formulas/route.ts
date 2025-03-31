import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FormulaRequest {
  disciplinaId: number;
  periodoId: number;
  parametros: any;
}

interface UpdateFormulaRequest {
  id: number;
  parametros: any;
}

interface DeleteFormulaRequest {
  id: number;
}

// Obtener todas las fórmulas
export async function GET() {
  try {
    const formulas = await prisma.formula.findMany({
      include: {
        disciplina: true,
        periodo: true,
      },
    });
    return NextResponse.json(formulas);
  } catch (error) {
    return NextResponse.json({ error: 'Error obteniendo fórmulas' }, { status: 500 });
  }
}

// Crear una nueva fórmula
export async function POST(req: Request) {
  try {
    const { disciplinaId, periodoId, parametros }: FormulaRequest = await req.json();
    const nuevaFormula = await prisma.formula.create({
      data: {
        disciplinaId,
        periodoId,
        parametros,
      },
    });
    return NextResponse.json(nuevaFormula, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creando la fórmula' }, { status: 500 });
  }
}

// Actualizar una fórmula
export async function PUT(req: Request) {
  try {
    const { id, parametros }: UpdateFormulaRequest = await req.json();
    const formulaActualizada = await prisma.formula.update({
      where: { id },
      data: { parametros },
    });
    return NextResponse.json(formulaActualizada);
  } catch (error) {
    return NextResponse.json({ error: 'Error actualizando la fórmula' }, { status: 500 });
  }
}

// Eliminar una fórmula
export async function DELETE(req: Request) {
  try {
    const { id }: DeleteFormulaRequest = await req.json();
    await prisma.formula.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Fórmula eliminada' });
  } catch (error) {
    return NextResponse.json({ error: 'Error eliminando la fórmula' }, { status: 500 });
  }
}