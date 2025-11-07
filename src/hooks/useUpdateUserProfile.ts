import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  fecha_nacimiento?: string | null;
  avatar_url?: string | null;
  rfc?: string | null;
  imss_number?: string | null;
  fecha_ingreso?: string | null;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
  sucursal_id?: string | null;
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateProfileData }) => {
      const { sucursal_id, ...profileData } = data;
      
      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Update user_metadata if sucursal_id is provided
      if (sucursal_id !== undefined) {
        const { error: metaError } = await supabase
          .from('user_metadata')
          .upsert({
            user_id: userId,
            sucursal_id: sucursal_id,
          }, {
            onConflict: 'user_id'
          });
        
        if (metaError) throw metaError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Perfil actualizado exitosamente');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    },
  });
}
