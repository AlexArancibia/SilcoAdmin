import { create } from 'zustand';
import { Brandeo, BrandeosQueryParams, PaginatedResponse } from '@/types/schema';

interface BrandeoStore {
  // Estado
  brandeos: Brandeo[];
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
  fetchBrandeos: (params?: BrandeosQueryParams) => Promise<void>;
  createBrandeo: (data: Omit<Brandeo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Brandeo | null>;
  updateBrandeo: (id: number, data: Partial<Brandeo>) => Promise<Brandeo | null>;
  deleteBrandeo: (id: number) => Promise<boolean>;
  getBrandeo: (id: number) => Promise<Brandeo | null>;
  clearError: () => void;
  reset: () => void;
}

export const useBrandeoStore = create<BrandeoStore>((set, get) => ({
  // Estado inicial
  brandeos: [],
  loading: false,
  error: null,
  pagination: null,

  // Acciones
  fetchBrandeos: async (params?: BrandeosQueryParams) => {
    set({ loading: true, error: null });
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.periodoId) searchParams.append('periodoId', params.periodoId.toString());
      if (params?.instructorId) searchParams.append('instructorId', params.instructorId.toString());
      if (params?.numero) searchParams.append('numero', params.numero.toString());
      if (params?.busqueda) searchParams.append('busqueda', params.busqueda);

      const response = await fetch(`/api/brandeos?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener brandeos');
      }

      const data: PaginatedResponse<Brandeo> = await response.json();
      
      set({
        brandeos: data.data,
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

  createBrandeo: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch('/api/brandeos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear brandeo');
      }

      const brandeo = await response.json();
      
      // Actualizar la lista de brandeos
      set(state => ({
        brandeos: [brandeo, ...state.brandeos],
        loading: false,
      }));

      return brandeo;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return null;
    }
  },

  updateBrandeo: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/brandeos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar brandeo');
      }

      const brandeo = await response.json();
      
      // Actualizar la lista de brandeos
      set(state => ({
        brandeos: state.brandeos.map(b => b.id === id ? brandeo : b),
        loading: false,
      }));

      return brandeo;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
      return null;
    }
  },

  deleteBrandeo: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/brandeos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar brandeo');
      }

      // Remover el brandeo de la lista
      set(state => ({
        brandeos: state.brandeos.filter(b => b.id !== id),
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

  getBrandeo: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/brandeos/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener brandeo');
      }

      const brandeo = await response.json();
      set({ loading: false });
      
      return brandeo;
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
      brandeos: [],
      loading: false,
      error: null,
      pagination: null,
    });
  },
})); 