import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export type UnitType = 'casa' | 'departamento' | 'local' | 'terreno' | 'otro';
export type UnitStatus = 'disponible' | 'reservado' | 'vendido' | 'bloqueado';

export interface Unit {
  id: string;
  unit_number: string;
  project_id?: string;
  unit_type: UnitType;
  area_m2?: number;
  bedrooms?: number;
  bathrooms?: number;
  price?: number;
  status: UnitStatus;
  floor_number?: number;
  parking_spaces?: number;
  amenities_json?: any;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useUnits(search: string = "", projectId?: string, status?: UnitStatus) {
  return useQuery({
    queryKey: ['units', search, projectId, status],
    queryFn: async () => {
      let query = supabase
        .from('units')
        .select('*')
        .order('unit_number', { ascending: true });
      
      if (search) {
        query = query.ilike('unit_number', `%${search}%`);
      }
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Unit[];
    },
    ...CACHE_CONFIG.active,
  });
}

export function useUnitById(id: string | null) {
  return useQuery({
    queryKey: ['unit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Unit;
    },
    enabled: !!id,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Unit>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: unit, error } = await supabase
        .from('units')
        .insert({
          ...data,
          created_by: userId
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return unit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success("Unidad creada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al crear unidad: " + error.message);
    }
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Unit> }) => {
      const { error } = await supabase
        .from('units')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success("Unidad actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar unidad: " + error.message);
    }
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success("Unidad eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar unidad: " + error.message);
    }
  });
}
