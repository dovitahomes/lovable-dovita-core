import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MessageWithSender {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
}

export function useClientRecentMessages(projectId: string | null) {
  return useQuery({
    queryKey: ["client-recent-messages", projectId],
    queryFn: async (): Promise<MessageWithSender[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_messages")
        .select("id, message, created_at, sender_id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get sender emails
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", senderIds);

        return data.map(msg => ({
          ...msg,
          sender_name: profiles?.find(p => p.id === msg.sender_id)?.full_name || 
                      profiles?.find(p => p.id === msg.sender_id)?.email || 
                      "Usuario",
        }));
      }

      return [];
    },
    enabled: !!projectId,
  });
}
