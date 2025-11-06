import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * AuthStateListener - Componente que escucha cambios en el estado de autenticación
 * 
 * IMPORTANTE: Siguiendo las mejores prácticas de Supabase:
 * - NO usar async directamente en el callback
 * - NO hacer llamadas a Supabase dentro del callback
 * - Usar setTimeout(0) para diferir operaciones asíncronas
 */
export function AuthStateListener() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Configurar el listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthStateListener] Event:', event, 'Session:', !!session);

        // Solo actualizaciones síncronas aquí
        if (event === 'SIGNED_IN') {
          // Diferir invalidación de queries con setTimeout
          setTimeout(() => {
            // Invalidar todas las queries relacionadas con auth
            queryClient.invalidateQueries({ queryKey: ['session'] });
            queryClient.invalidateQueries({ queryKey: ['current-user'] });
            queryClient.invalidateQueries({ queryKey: ['user-role'] });
            queryClient.invalidateQueries({ queryKey: ['auth-client-id'] });
            queryClient.invalidateQueries({ queryKey: ['client-projects'] });
            queryClient.invalidateQueries({ queryKey: ['preview-clients'] });

            // Mostrar toast de bienvenida
            toast({
              title: 'Sesión iniciada',
              description: 'Bienvenido a tu portal de cliente',
            });

            // Redirigir a la página principal si está en login
            if (window.location.pathname.includes('/login')) {
              navigate('/', { replace: true });
            }
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            // Limpiar todas las queries
            queryClient.clear();

            // Limpiar localStorage
            localStorage.removeItem('currentProjectId');
            localStorage.removeItem('clientapp.forceClientId');

            toast({
              title: 'Sesión cerrada',
              description: 'Has cerrado sesión correctamente',
            });

            // Redirigir a login
            navigate('/login', { replace: true });
          }, 0);
        }

        if (event === 'TOKEN_REFRESHED') {
          setTimeout(() => {
            console.log('[AuthStateListener] Token refreshed');
            queryClient.invalidateQueries({ queryKey: ['session'] });
          }, 0);
        }

        if (event === 'USER_UPDATED') {
          setTimeout(() => {
            console.log('[AuthStateListener] User updated');
            queryClient.invalidateQueries({ queryKey: ['current-user'] });
            queryClient.invalidateQueries({ queryKey: ['auth-client-id'] });
          }, 0);
        }
      }
    );

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('[AuthStateListener] Initial session found');
        // Asegurar que las queries se invaliden en la carga inicial
        queryClient.invalidateQueries({ queryKey: ['session'] });
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
      }
    });

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, queryClient]);

  // Este componente no renderiza nada
  return null;
}
