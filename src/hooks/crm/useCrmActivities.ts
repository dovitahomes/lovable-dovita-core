import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export type ActivityType = 'created' | 'updated' | 'deleted' | 'status_changed' | 'note_added' | 'email_sent' | 'call_made' | 'meeting_held';
export type EntityType = 'lead' | 'account' | 'contact' | 'opportunity' | 'task';

export interface CrmActivity {
  id: string;
  activity_type: ActivityType;
  entity_type: EntityType;
  entity_id: string;
  description: string;
  metadata_json?: any;
  performed_by: string;
  created_at: string;
}

export function useCrmActivities(entityType?: EntityType, entityId?: string) {
  return useQuery({
    queryKey: ['crm-activities', entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CrmActivity[];
    },
    ...CACHE_CONFIG.active,
  });
}
