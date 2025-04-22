import type { Instructor, CategoriaInstructor } from "@/types/schema"
import { CATEGORIAS_CONFIG } from "@/utils/config"
import type { JSX } from "react/jsx-runtime"

interface InstructorWithCategoryProps {
  instructorId: number
  periodoId: number
  instructores: Instructor[]
}

export function InstructorWithCategory({
  instructorId,
  periodoId,
  instructores,
}: InstructorWithCategoryProps): JSX.Element {
  const instructor = instructores.find((i) => i.id === instructorId)
  if (!instructor) return <span>{`Instructor ${instructorId}`}</span>

  // Buscar la categoría más alta del instructor para este periodo
  let categoriaAlta: CategoriaInstructor | null = null
  let disciplinaCategoria: number | null = null

  if (instructor.categorias && instructor.categorias.length > 0) {
    // Filtrar categorías para este periodo
    const categoriasPeriodo = instructor.categorias.filter((c) => c.periodoId === periodoId)

    // Usar el orden de prioridad definido en la configuración
    for (const cat of CATEGORIAS_CONFIG.PRIORIDAD_CATEGORIAS) {
      const categoriaEncontrada = categoriasPeriodo.find((c) => c.categoria === cat)
      if (categoriaEncontrada) {
        categoriaAlta = cat as CategoriaInstructor // Explicitly cast to CategoriaInstructor
        disciplinaCategoria = categoriaEncontrada.disciplinaId
        break
      }
    }
  }

  // Verificar si debemos mostrar la categoría visualmente
  let mostrarCategoria = false

  if (categoriaAlta && categoriaAlta !== "INSTRUCTOR" && disciplinaCategoria) {
    // Buscar la disciplina para verificar si debe mostrarse la categoría
    const disciplina = instructor.disciplinas?.find((d) => d.id === disciplinaCategoria)
    if (disciplina) {
      // Usar la función mostrarCategoriaVisual para determinar si se debe mostrar la categoría
      // Pero siempre retornamos false para ocultar todas las categorías
      mostrarCategoria = false
    }
  }

  // Mostrar el nombre con o sin badge según la categoría
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{instructor.nombre}</span>
      {/* No mostramos ningún badge de categoría */}
    </div>
  )
}
