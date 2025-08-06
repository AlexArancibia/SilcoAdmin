import { create } from 'zustand';
import { Workshop, WorkshopsQueryParams, PaginatedResponse } from '@/types/schema';

interface WorkshopStore {
  // Estado
  workshops: Workshop[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;

  // Acciones
  fetchWorkshops: (params?: WorkshopsQueryParams) => Promise<void>;
  createWorkshop: (data: Omit<Workshop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Workshop | null>;
  updateWorkshop: (id: number, data: Partial<Workshop>) => Promise<Workshop | null>;
  deleteWorkshop: (id: number) => Promise<boolean>;
  getWorkshop: (id: number) => Promise<Workshop | null>;
  clearError: () => void;
  reset: () => void;
}

export const useWorkshopStore = create<WorkshopStore>((set, get) => ({
  // Estado inicial
  workshops: [],
  loading: false,
  error: null,
  pagination: null,

  // Acciones
  fetchWorkshops: async (params?: WorkshopsQueryParams) => {
    set({ loading: true, error: null });
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.periodoId) searchParams.append('periodoId', params.periodoId.toString());
      if (params?.instructorId) searchParams.append('instructorId', params.instructorId.toString());
      if (params?.nombre) searchParams.append('nombre', params.nombre);
      if (params?.busqueda) searchParams.append('busqueda', params.busqueda);
      if (params?.fechaDesde) searchParams.append('fechaDesde', params.fechaDesde);
      if (params?.fechaHasta) searchParams.append('fechaHasta', params.fechaHasta);

      const response = await fetch(`/api/workshops?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener workshops');
      }

      const data: PaginatedResponse<Workshop> = await response.json();
      
      set({
        workshops: data.data,
        pagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
    }
  },

  createWorkshop: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch('/api/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear workshop');
      }

      const workshop = await response.json();
      
      // Actualizar la lista de workshops
      set(state => ({
        workshops: [workshop, ...state.workshops],
        loading: false,
      }));

      return workshop;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return null;
    }
  },

  updateWorkshop: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/workshops/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar workshop');
      }

      const workshop = await response.json();
      
      // Actualizar la lista de workshops
      set(state => ({
        workshops: state.workshops.map(w => w.id === id ? workshop : w),
        loading: false,
      }));

      return workshop;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return null;
    }
  },

  deleteWorkshop: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/workshops/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar workshop');
      }

      // Remover el workshop de la lista
      set(state => ({
        workshops: state.workshops.filter(w => w.id !== id),
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return false;
    }
  },

  getWorkshop: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/workshops/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener workshop');
      }

      const workshop = await response.json();
      set({ loading: false });
      
      return workshop;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      workshops: [],
      loading: false,
      error: null,
      pagination: null,
    });
  },
})); 