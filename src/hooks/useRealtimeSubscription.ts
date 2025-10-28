import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UseRealtimeSubscriptionProps {
  table: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  table,
  filter,
  event = "*",
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeSubscriptionProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const setupSubscription = () => {
      const channel = supabase.channel(`${table}-changes`);

      channel
        .on(
          "postgres_changes" as any,
          {
            event,
            schema: "public",
            table,
            filter,
          },
          (payload: any) => {
            switch (payload.eventType) {
              case "INSERT":
                onInsert?.(payload);
                break;
              case "UPDATE":
                onUpdate?.(payload);
                break;
              case "DELETE":
                onDelete?.(payload);
                break;
            }
          }
        )
        .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✓ Subscribed to ${table}`);
        } else if (status === "CHANNEL_ERROR") {
          toast.error("Conexión perdida. Reconectando...", { duration: 2000 });
          
          // Auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            setupSubscription();
          }, 3000);
        }
      });

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, table, filter, event, onInsert, onUpdate, onDelete]);
}
