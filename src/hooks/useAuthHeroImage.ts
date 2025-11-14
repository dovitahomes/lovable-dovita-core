import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthHeroImage {
  id: string;
  image_path: string;
  active: boolean;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Obtener la imagen activa para el login
 */
export function useActiveAuthHeroImage() {
  return useQuery({
    queryKey: ['active-auth-hero-image'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_hero_images')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as AuthHeroImage | null;
    },
  });
}

/**
 * Obtener todas las imágenes (para administración)
 */
export function useAllAuthHeroImages() {
  return useQuery({
    queryKey: ['all-auth-hero-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_hero_images')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AuthHeroImage[];
    },
  });
}

/**
 * Crear nueva imagen hero (desactiva las anteriores)
 */
export function useCreateAuthHeroImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (imagePath: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Desactivar todas las imágenes previas
      await supabase
        .from('auth_hero_images')
        .update({ active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Insertar nueva imagen activa
      const { data, error } = await supabase
        .from('auth_hero_images')
        .insert({
          image_path: imagePath,
          active: true,
          uploaded_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-auth-hero-image'] });
      queryClient.invalidateQueries({ queryKey: ['all-auth-hero-images'] });
      toast.success("Imagen de login actualizada exitosamente");
    },
    onError: (error) => {
      console.error('Error creating auth hero image:', error);
      toast.error("Error al actualizar imagen de login");
    },
  });
}

/**
 * Activar/desactivar imagen
 */
export function useToggleAuthHeroImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      // Si activamos una, desactivar las demás
      if (active) {
        await supabase
          .from('auth_hero_images')
          .update({ active: false })
          .neq('id', id);
      }
      
      const { data, error } = await supabase
        .from('auth_hero_images')
        .update({ active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-auth-hero-image'] });
      queryClient.invalidateQueries({ queryKey: ['all-auth-hero-images'] });
      toast.success("Estado actualizado");
    },
    onError: (error) => {
      console.error('Error toggling image:', error);
      toast.error("Error al actualizar estado");
    },
  });
}

/**
 * Eliminar imagen
 */
export function useDeleteAuthHeroImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, imagePath }: { id: string; imagePath: string }) => {
      // Eliminar archivo del bucket
      const { error: storageError } = await supabase.storage
        .from('auth-hero-images')
        .remove([imagePath]);
      
      if (storageError) throw storageError;
      
      // Eliminar registro de DB
      const { error: dbError } = await supabase
        .from('auth_hero_images')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-auth-hero-image'] });
      queryClient.invalidateQueries({ queryKey: ['all-auth-hero-images'] });
      toast.success("Imagen eliminada");
    },
    onError: (error) => {
      console.error('Error deleting image:', error);
      toast.error("Error al eliminar imagen");
    },
  });
}
