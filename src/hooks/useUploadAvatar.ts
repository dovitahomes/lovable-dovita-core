import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      // 1. Subir archivo a bucket 'avatars'
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // 2. Obtener URL pública (avatars es bucket público)
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // 3. Actualizar profiles.avatar_url con ruta relativa
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      return publicUrl;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', variables.userId] });
      toast.success('Foto de perfil actualizada');
    },
    onError: (error) => {
      console.error('Error al subir avatar:', error);
      toast.error('Error al actualizar la foto');
    },
  });
}
