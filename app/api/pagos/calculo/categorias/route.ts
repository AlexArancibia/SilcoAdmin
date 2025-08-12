import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  determinarCategoria,
  calcularMetricasDisciplina,
} from "../../../../../utils/calculo-helpers";
import {
  CategoriaInstructor,
  FormulaDB,
  Clase,
  Instructor,
} from "@/types/schema";
import { mostrarCategoriaVisual } from "@/utils/config";

export async function POST(req: Request) {
  const logs: string[] = [];
  try {
    logs.push("🚀 Iniciando recálculo de categorías de instructores");
    
    const body = await req.json();
    logs.push(`📋 Body recibido: ${JSON.stringify(body)}`);
    
    const { periodoId, instructorId } = body as { periodoId: number; instructorId?: number };
    
    if (!periodoId) {
      logs.push("❌ Error: periodoId es requerido");
      return NextResponse.json({ error: "periodoId es requerido" }, { status: 400 });
    }

    logs.push(`🎯 Procesando periodo ID: ${periodoId}${instructorId ? ` para instructor ${instructorId}` : ' para todos los instructores'}`);

    // Cargar catálogos
    logs.push("📚 Cargando catálogos de disciplinas...");
    const disciplinasDb = await prisma.disciplina.findMany();
    logs.push(`✅ Cargadas ${disciplinasDb.length} disciplinas`);
    
    logs.push("📐 Cargando fórmulas...");
    const formulas: FormulaDB[] = await prisma.formula.findMany({
      where: { periodoId }
    }) as unknown as FormulaDB[];    
    logs.push(`✅ Cargadas ${formulas.length} fórmulas para el periodo ${periodoId}`);
    
    const disciplinaSiclo = disciplinasDb.find((d) => d.nombre === "Síclo");
    const sicloId = disciplinaSiclo ? disciplinaSiclo.id : null;
    logs.push(`🚴 Disciplina Síclo: ${sicloId ? `ID ${sicloId}` : 'No encontrada'}`);

    // Cargar instructores
    const whereClause = {
      activo: true,
      clases: { some: { periodoId } },
      ...(instructorId && { id: instructorId }),
    };

    logs.push("👥 Cargando instructores...");
    const instructoresConClases = await prisma.instructor.findMany({
      where: whereClause,
      include: {
        clases: { where: { periodoId } },
        categorias: { where: { periodoId } },
      },
    });

    logs.push(`👥 Instructores encontrados: ${instructoresConClases.length}`);

    let categoriasCreadas = 0;
    let categoriasActualizadas = 0;

    for (const instructor of instructoresConClases) {
      logs.push(`\n🔄 PROCESANDO INSTRUCTOR: ${instructor.id} - ${instructor.nombre}`);
      
      const clasesDelInstructor = instructor.clases as Clase[];
      const disciplinasUnicas = [...new Set(clasesDelInstructor.map(clase => clase.disciplinaId))];
      
      logs.push(`📊 Disciplinas únicas del instructor: ${disciplinasUnicas.length} (IDs: ${disciplinasUnicas.join(', ')})`);
      
      for (const disciplinaId of disciplinasUnicas) {
        const disciplina = disciplinasDb.find((d) => d.id === disciplinaId);
        if (!disciplina) {
          logs.push(`❌ Disciplina no encontrada para ID ${disciplinaId}, saltando`);
          continue;
        }
        
        if (!mostrarCategoriaVisual(disciplina.nombre)) {
          logs.push(`⏭️ Saltando disciplina ${disciplina.nombre} (sin categorización visual)`);
          continue;
        }
        
        const formula = formulas.find((f) => f.disciplinaId === disciplinaId && f.periodoId === periodoId);
        if (!formula) {
          logs.push(`❌ No hay fórmula para disciplina ${disciplina.nombre} en periodo ${periodoId}`);
          continue;
        }
        
        logs.push(`📚 Procesando disciplina: ${disciplina.nombre}`);
        
        const clasesDisciplina = clasesDelInstructor.filter((c) => c.disciplinaId === disciplinaId);
        const metricasDisciplina = calcularMetricasDisciplina(clasesDisciplina, disciplinaId, sicloId);
        
        // Crear métricas completas con valores por defecto
        const metricasCompletas = {
          ...metricasDisciplina,
          participacionEventos: true, // Por defecto
          cumpleLineamientos: true, // Por defecto
        };
        
        logs.push(`📊 Métricas para ${disciplina.nombre}: ocupación ${metricasDisciplina.ocupacionPromedio}%, clases ${metricasDisciplina.totalClases}, locales ${metricasDisciplina.totalLocales}, dobleteos ${metricasDisciplina.totalDobleteos}, horarios no prime ${metricasDisciplina.horariosNoPrime}`);
        
        const categoriaCalculada = determinarCategoria(formula, metricasCompletas);
        logs.push(`🎭 Categoría calculada: ${categoriaCalculada}`);
        
        // Verificar si ya existe una categoría para esta disciplina
        const categoriaExistente = instructor.categorias?.find(
          (c) => c.disciplinaId === disciplinaId && c.periodoId === periodoId,
        );
        
        if (categoriaExistente) {
          if (categoriaExistente.categoria !== categoriaCalculada) {
            logs.push(`🔄 Actualizando categoría de ${disciplina.nombre}: ${categoriaExistente.categoria} -> ${categoriaCalculada}`);
            await prisma.categoriaInstructor.update({
              where: { id: categoriaExistente.id },
              data: {
                categoria: categoriaCalculada,
                metricas: metricasCompletas,
                esManual: false,
              },
            });
            categoriasActualizadas++;
          } else {
            logs.push(`✅ Categoría de ${disciplina.nombre} ya está actualizada: ${categoriaCalculada}`);
          }
        } else {
          logs.push(`➕ Creando nueva categoría para ${disciplina.nombre}: ${categoriaCalculada}`);
          await prisma.categoriaInstructor.create({
            data: {
              instructorId: instructor.id,
              disciplinaId: disciplinaId,
              periodoId: periodoId,
              categoria: categoriaCalculada,
              esManual: false,
              metricas: metricasCompletas,
            },
          });
          categoriasCreadas++;
        }
      }
    }
    
    logs.push(`\n🎉 RECÁLCULO DE CATEGORÍAS COMPLETADO`);
    logs.push(`📊 RESUMEN:`);
    logs.push(`👥 Total instructores procesados: ${instructoresConClases.length}`);
    logs.push(`➕ Categorías creadas: ${categoriasCreadas}`);
    logs.push(`🔄 Categorías actualizadas: ${categoriasActualizadas}`);
    logs.push(`📅 Periodo: ${periodoId}`);
    logs.push(`⏰ Fecha: ${new Date().toLocaleString()}`);
    
    return NextResponse.json({ 
      message: "Recálculo de categorías completado exitosamente.", 
      logs,
      summary: {
        instructoresProcesados: instructoresConClases.length,
        categoriasCreadas,
        categoriasActualizadas,
        periodoId,
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    logs.push(`💥 ERROR CRÍTICO: ${errorMessage}`);
    logs.push(`📍 Stack trace: ${error instanceof Error ? error.stack : 'No disponible'}`);
    return NextResponse.json({ error: errorMessage, logs }, { status: 500 });
  }
}
