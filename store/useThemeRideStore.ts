import { create } from 'zustand';
import { ThemeRide, ThemeRidesQueryParams, PaginatedResponse } from '@/types/schema';

interface ThemeRideStore {
  // Estado
  themeRides: ThemeRide[];
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
  fetchThemeRides: (params?: ThemeRidesQueryParams) => Promise<void>;
  createThemeRide: (data: Omit<ThemeRide, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ThemeRide | null>;
  updateThemeRide: (id: number, data: Partial<ThemeRide>) => Promise<ThemeRide | null>;
  deleteThemeRide: (id: number) => Promise<boolean>;
  getThemeRide: (id: number) => Promise<ThemeRide | null>;
  clearError: () => void;
  reset: () => void;
}

export const useThemeRideStore = create<ThemeRideStore>((set, get) => ({
  // Estado inicial
  themeRides: [],
  loading: false,
  error: null,
  pagination: null,

  // Acciones
  fetchThemeRides: async (params?: ThemeRidesQueryParams) => {
    set({ loading: true, error: null });
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.periodoId) searchParams.append('periodoId', params.periodoId.toString());
      if (params?.instructorId) searchParams.append('instructorId', params.instructorId.toString());
      if (params?.numero) searchParams.append('numero', params.numero.toString());
      if (params?.busqueda) searchParams.append('busqueda', params.busqueda);

      const response = await fetch(`/api/theme-rides?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener theme rides');
      }

      const data: PaginatedResponse<ThemeRide> = await response.json();
      
      set({
        themeRides: data.data,
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

  createThemeRide: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch('/api/theme-rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear theme ride');
      }

      const themeRide = await response.json();
      
      // Actualizar la lista de theme rides
      set(state => ({
        themeRides: [themeRide, ...state.themeRides],
        loading: false,
      }));

      return themeRide;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return null;
    }
  },

  updateThemeRide: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/theme-rides/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar theme ride');
      }

      const themeRide = await response.json();
      
      // Actualizar la lista de theme rides
      set(state => ({
        themeRides: state.themeRides.map(t => t.id === id ? themeRide : t),
        loading: false,
      }));

      return themeRide;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return null;
    }
  },

  deleteThemeRide: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/theme-rides/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar theme ride');
      }

      // Remover el theme ride de la lista
      set(state => ({
        themeRides: state.themeRides.filter(t => t.id !== id),
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

  getThemeRide: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/theme-rides/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener theme ride');
      }

      const themeRide = await response.json();
      set({ loading: false });
      
      return themeRide;
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
      themeRides: [],
      loading: false,
      error: null,
      pagination: null,
    });
  },
})); 