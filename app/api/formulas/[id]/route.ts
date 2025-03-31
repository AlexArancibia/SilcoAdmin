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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { parametros }: UpdateFormulaRequest = await req.json();
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const formulaActualizada = await prisma.formula.update({
      where: { id },
      data: { parametros },
    });
    return NextResponse.json(formulaActualizada);
  } catch (error) {
    return NextResponse.json({ error: 'Error actualizando la fórmula' }, { status: 500 });
  }
}

// Eliminar una fórmula mediante /api/formulas/:id
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.formula.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Fórmula eliminada' });
  } catch (error) {
    return NextResponse.json({ error: 'Error eliminando la fórmula' }, { status: 500 });
  }
}
