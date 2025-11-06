import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAppMode() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
  
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Verificar si es colaborador (tiene roles en user_roles)
      const { data } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id)
        .limit(1);
      
      return data && data.length > 0 ? 'collaborator' : 'client';
    },
    enabled: !!user,
  });
  
  const isPreviewMode = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.has('preview');
    const fromStorage = localStorage.getItem('clientapp.previewMode') === 'true';
    const isCollaborator = userRole === 'collaborator';
    
    console.log('[useAppMode] Preview Mode Check:', {
      fromUrl,
      fromStorage,
      userRole,
      isCollaborator,
      willBePreviewMode: (fromUrl || fromStorage) && isCollaborator
    });
    
    // Preview mode solo si es colaborador Y tiene el flag de preview
    return (fromUrl || fromStorage) && isCollaborator;
  }, [userRole]);
  
  return {
    isPreviewMode,
    userRole,
    user,
    isAuthenticated: !!user,
  };
}
