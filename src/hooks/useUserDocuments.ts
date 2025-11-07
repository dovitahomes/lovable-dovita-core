import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useUserDocuments(userId: string | null) {
  return useQuery({
    queryKey: ['user-documents', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserDocument[];
    },
    enabled: !!userId,
  });
}
