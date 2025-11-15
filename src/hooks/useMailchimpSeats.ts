import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type MailchimpSeatType = Database['public']['Enums']['mailchimp_seat_type'];

interface MailchimpSeat {
  id: string;
  user_id: string | null;
  mailchimp_email: string;
  seat_type: MailchimpSeatType;
  is_active: boolean;
  mailchimp_member_id: string | null;
  created_at: string;
}

interface CreateSeatPayload {
  user_id?: string | null;
  mailchimp_email: string;
  seat_type: MailchimpSeatType;
}

export function useMailchimpSeats() {
  const queryClient = useQueryClient();

  // Obtener configuración para límite de asientos
  const { data: config } = useQuery({
    queryKey: ['email-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_config')
        .select('mailchimp_total_seats')
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Listar asientos activos
  const { data: seats, isLoading } = useQuery({
    queryKey: ['mailchimp-seats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mailchimp_seats')
        .select(`
          *,
          profiles!mailchimp_seats_user_id_fkey(full_name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MailchimpSeat[];
    },
  });

  // Crear asiento
  const createSeat = useMutation({
    mutationFn: async (payload: CreateSeatPayload) => {
      // Validar límite de asientos
      const activeSeats = seats?.length || 0;
      const totalSeats = config?.mailchimp_total_seats || 5;

      if (activeSeats >= totalSeats) {
        throw new Error(`Límite de asientos alcanzado (${totalSeats}). Desactiva un asiento existente primero.`);
      }

      // Validar que no haya más de un asiento genérico activo
      if (payload.seat_type === 'generic') {
        const genericSeats = seats?.filter(s => s.seat_type === 'generic') || [];
        if (genericSeats.length > 0) {
          throw new Error('Ya existe un asiento genérico activo. Solo puede haber uno.');
        }
      }

      // Validar que el usuario no tenga ya un asiento
      if (payload.user_id) {
        const userSeats = seats?.filter(s => s.user_id === payload.user_id) || [];
        if (userSeats.length > 0) {
          throw new Error('Este usuario ya tiene un asiento asignado.');
        }
      }

      const { data, error } = await supabase
        .from('mailchimp_seats')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-seats'] });
      toast.success('Asiento Mailchimp creado correctamente');
    },
    onError: (error: Error) => {
      console.error('Error creating Mailchimp seat:', error);
      toast.error(`Error: ${error.message}`);
    },
  });

  // Desactivar asiento
  const deactivateSeat = useMutation({
    mutationFn: async (seatId: string) => {
      const { error } = await supabase
        .from('mailchimp_seats')
        .update({ is_active: false })
        .eq('id', seatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-seats'] });
      toast.success('Asiento desactivado correctamente');
    },
    onError: (error: Error) => {
      console.error('Error deactivating seat:', error);
      toast.error(`Error al desactivar asiento: ${error.message}`);
    },
  });

  return {
    seats: seats || [],
    isLoading,
    activeSeats: seats?.length || 0,
    totalSeats: config?.mailchimp_total_seats || 5,
    createSeat: createSeat.mutate,
    deactivateSeat: deactivateSeat.mutate,
    isCreating: createSeat.isPending,
    isDeactivating: deactivateSeat.isPending,
  };
}
