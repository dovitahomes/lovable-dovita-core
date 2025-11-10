import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/app/auth/AuthProvider';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  propuesta: 'Propuesta',
  aceptada: 'Aceptada ✓',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

/**
 * Hook para escuchar notificaciones en tiempo real de cambios en eventos
 * Muestra toasts cuando colaboradores aceptan/rechazan/modifican citas
 */
export function useEventNotifications(projectId?: string) {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user || !projectId) return;
    
    const channel = supabase
      .channel(`event-notifications:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_events',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Solo notificar si el evento tiene visibility='client' 
          // y el usuario actual NO fue quien hizo el cambio
          if (newRecord.visibility === 'client' && newRecord.created_by !== user.id) {
            // Notificar cambio de status
            if (oldRecord.status !== newRecord.status) {
              const statusLabel = STATUS_LABELS[newRecord.status] || newRecord.status;
              const eventDate = format(new Date(newRecord.start_time), "d 'de' MMMM, HH:mm", { locale: es });
              
              if (newRecord.status === 'aceptada') {
                toast.success('🎉 Cita aceptada', {
                  description: `"${newRecord.title}" el ${eventDate}`,
                  duration: 5000,
                });
              } else if (newRecord.status === 'rechazada') {
                toast.error('Cita rechazada', {
                  description: `"${newRecord.title}" el ${eventDate}. Por favor, propón otra fecha.`,
                  duration: 5000,
                });
              } else if (newRecord.status === 'cancelada') {
                toast.warning('Cita cancelada', {
                  description: `"${newRecord.title}" el ${eventDate}`,
                  duration: 5000,
                });
              } else {
                toast.info(`Cita actualizada: ${statusLabel}`, {
                  description: `"${newRecord.title}" el ${eventDate}`,
                  duration: 4000,
                });
              }
            }
            
            // Notificar cambio de fecha/hora
            else if (
              oldRecord.start_time !== newRecord.start_time ||
              oldRecord.end_time !== newRecord.end_time
            ) {
              const newDate = format(new Date(newRecord.start_time), "d 'de' MMMM, HH:mm", { locale: es });
              toast.info('📅 Cita reprogramada', {
                description: `"${newRecord.title}" ahora es el ${newDate}`,
                duration: 5000,
              });
            }
            
            // Notificar otros cambios significativos
            else if (
              oldRecord.title !== newRecord.title ||
              oldRecord.location !== newRecord.location
            ) {
              toast.info('✏️ Cita modificada', {
                description: `Se actualizaron los detalles de "${newRecord.title}"`,
                duration: 4000,
              });
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);
}
