import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth/AuthProvider';

/**
 * Hook para escuchar notificaciones en tiempo real de presupuestos y proveedores
 * Tipos de notificaciones:
 * - price_alert: Alerta de precio cuando un item se desvía >5% del histórico
 * - budget_shared: Presupuesto compartido con el usuario
 * - budget_updated: Presupuesto actualizado (versión nueva)
 * - provider_updated: Proveedor actualizado
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Invalidar queries de notificaciones para refetch
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications-unread', user.id] });

          // Mostrar toast según el tipo de notificación
          switch (notification.type) {
            case 'price_alert':
              toast.warning(notification.title, {
                description: notification.message,
                duration: 5000,
              });
              break;
            case 'budget_shared':
              toast.info(notification.title, {
                description: notification.message,
                duration: 5000,
              });
              break;
            case 'budget_updated':
              toast.info(notification.title, {
                description: notification.message,
                duration: 4000,
              });
              break;
            case 'provider_updated':
              toast.info(notification.title, {
                description: notification.message,
                duration: 4000,
              });
              break;
            default:
              toast(notification.title, {
                description: notification.message,
                duration: 4000,
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
