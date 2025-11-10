import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para notificar a colaboradores en tiempo real sobre cambios en eventos
 * - Cliente acepta propuesta
 * - Cliente rechaza propuesta
 * - Cliente solicita nueva cita
 * - Cliente cancela su propia solicitud
 */
export function useCollaboratorEventNotifications(projectId: string | null) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!projectId) return;
    
    const channel = supabase
      .channel(`project-events:${projectId}:collaborators`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'project_events',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const newEvent = payload.new as any;
        const oldEvent = payload.old as any;
        
        // Cliente aceptó propuesta de colaborador
        if (oldEvent.status === 'propuesta' && newEvent.status === 'aceptada') {
          toast.success(`✅ El cliente aceptó la cita "${newEvent.title}"`, {
            description: 'La cita fue confirmada exitosamente',
          });
        }
        
        // Cliente rechazó propuesta de colaborador
        if (oldEvent.status === 'propuesta' && newEvent.status === 'rechazada') {
          toast.error(`❌ El cliente rechazó la cita "${newEvent.title}"`, {
            description: 'Considera proponer una nueva fecha',
          });
        }
        
        // Cliente canceló su propia solicitud
        if (oldEvent.status === 'propuesta' && newEvent.status === 'cancelada') {
          toast.info(`📅 El cliente canceló su solicitud "${newEvent.title}"`, {
            description: 'La cita fue cancelada',
          });
        }
        
        // Invalidar queries para refetch automático
        queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
        queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_events',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const newEvent = payload.new as any;
        
        // Cliente solicitó nueva cita (visibility='client' y created_by != current user)
        if (newEvent.visibility === 'client') {
          toast.info(`📬 Nueva solicitud de cita: "${newEvent.title}"`, {
            description: 'Un cliente solicitó agendar una reunión',
          });
          
          // Invalidar queries
          queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
          queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
