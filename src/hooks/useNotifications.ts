import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });
}

export function useUnreadNotifications(userId?: string) {
  return useQuery({
    queryKey: ["notifications-unread", userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread", data.user_id],
      });
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      user_id: string;
      type: string;
      title: string;
      message: string;
      metadata?: any;
    }) => {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread", data.user_id],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread", userId],
      });
      toast.success("Todas las notificaciones marcadas como leídas");
    },
  });
}
