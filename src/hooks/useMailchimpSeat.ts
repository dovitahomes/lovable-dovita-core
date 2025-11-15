import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type EmailProvider = Database['public']['Enums']['email_provider'];

interface MailchimpSeat {
  id: string;
  user_id: string | null;
  mailchimp_email: string;
  seat_type: 'generic' | 'user';
  is_active: boolean;
  mailchimp_member_id: string | null;
}

export function useMailchimpSeat(userId?: string) {
  return useQuery({
    queryKey: ['mailchimp-seat', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('mailchimp_seats')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('seat_type', 'user')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MailchimpSeat | null;
    },
    enabled: !!userId,
  });
}
