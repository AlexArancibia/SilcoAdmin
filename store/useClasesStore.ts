import { create } from "zustand";
import { clasesApi } from "@/lib/api/clases-api";
import type { Clase, PaginatedResponse, ClasesQueryParams } from "@/types/schema";

// Define la estructura de la información de paginación
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ClasesState {
  clases: Clase[];
  claseSeleccionada: Clase | null;
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchClases: (params?: ClasesQueryParams) => Promise<void>;
  fetchClase: (id: string) => Promise<void>;
  crearClase: (clase: Omit<Clase, "createdAt" | "updatedAt">) => Promise<Clase>;
  actualizarClase: (id: string, clase: Partial<Clase>) => Promise<Clase>;
  eliminarClase: (id: string) => Promise<void>;
  setClaseSeleccionada: (clase: Clase | null) => void;
  resetClases: () => void;
}

const initialPaginationState: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export const useClasesStore = create<ClasesState>((set, get) => ({
  clases: [],
  claseSeleccionada: null,
  pagination: initialPaginationState,
  isLoading: false,
  error: null,

  fetchClases: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response: PaginatedResponse<Clase> = await clasesApi.getClases(params);
      set({ 
        clases: response.data, 
        pagination: response.pagination, 
        isLoading: false 
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener clases",
        isLoading: false,
      });
      console.error("Error al obtener clases:", error);
    }
  },

  fetchClase: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const clase = await clasesApi.getClaseById(id)
      set({ claseSeleccionada: clase, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al obtener la clase",
        isLoading: false,
      })
      console.error(`Error al obtener la clase con ID ${id}:`, error)
    }
  },

  crearClase: async (clase) => {
    
    try {
      const nuevaClase = await clasesApi.createClase(clase)
      set((state) => ({
        clases: [...state.clases, nuevaClase],
        isLoading: false,
      }))
      return nuevaClase
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al crear la clase",
        isLoading: false,
      })
      console.error("Error al crear la clase:", error)
      throw error
    }
  },

  actualizarClase: async (id, clase) => {
    set({ isLoading: true, error: null })
    try {
      const claseActualizada = await clasesApi.updateClase(id, clase)
      set((state) => ({
        clases: state.clases.map((c) => (c.id === id ? claseActualizada : c)),
        claseSeleccionada: state.claseSeleccionada?.id === id ? claseActualizada : state.claseSeleccionada,
        isLoading: false,
      }))
      return claseActualizada
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al actualizar la clase",
        isLoading: false,
      })
      console.error(`Error al actualizar la clase con ID ${id}:`, error)
      throw error
    }
  },

  eliminarClase: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await clasesApi.deleteClase(id)
      set((state) => ({
        clases: state.clases.filter((c) => c.id !== id),
        claseSeleccionada: state.claseSeleccionada?.id === id ? null : state.claseSeleccionada,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Error desconocido al eliminar la clase",
        isLoading: false,
      })
      console.error(`Error al eliminar la clase con ID ${id}:`, error)
      throw error
    }
  },

  setClaseSeleccionada: (clase) => {
    set({ claseSeleccionada: clase })
  },

  resetClases: () => {
    set({ clases: [], error: null })
  },
}))

