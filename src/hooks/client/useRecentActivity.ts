import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ActivityItem = {
  id: string;
  type: "message" | "document" | "photo";
  date: string;
  title: string;
  subtitle?: string;
  icon: string;
  link: string;
};

export function useRecentActivity(projectId: string | null) {
  return useQuery({
    queryKey: ["recent-activity", projectId],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!projectId) return [];

      const activities: ActivityItem[] = [];

      // Fetch messages
      const { data: messages } = await supabase
        .from("project_messages")
        .select("id, message, created_at, sender_id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (messages) {
        const senderIds = [...new Set(messages.map((m) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", senderIds);

        messages.forEach((msg) => {
          const sender = profiles?.find((p) => p.id === msg.sender_id);
          activities.push({
            id: msg.id,
            type: "message",
            date: msg.created_at,
            title: "Nuevo mensaje",
            subtitle: `${sender?.full_name || sender?.email || "Usuario"}: ${msg.message.slice(0, 50)}${msg.message.length > 50 ? "..." : ""}`,
            icon: "🗨️",
            link: "/client?tab=chat",
          });
        });
      }

      // Fetch documents
      const { data: docs } = await supabase
        .from("documents")
        .select("id, nombre, created_at")
        .eq("project_id", projectId)
        .eq("visibilidad", "cliente")
        .order("created_at", { ascending: false })
        .limit(5);

      if (docs) {
        docs.forEach((doc) => {
          activities.push({
            id: doc.id,
            type: "document",
            date: doc.created_at,
            title: "Nuevo documento",
            subtitle: doc.nombre,
            icon: "📄",
            link: "/client?tab=documentos",
          });
        });
      }

      // Fetch photos
      const { data: photos } = await supabase
        .from("construction_photos")
        .select("id, descripcion, fecha_foto, file_url")
        .eq("project_id", projectId)
        .eq("visibilidad", "cliente")
        .order("fecha_foto", { ascending: false })
        .limit(5);

      if (photos && photos.length > 0) {
        activities.push({
          id: photos[0].id,
          type: "photo",
          date: photos[0].fecha_foto,
          title: "Nuevas fotos de obra",
          subtitle: `${photos.length} foto${photos.length > 1 ? "s" : ""} añadida${photos.length > 1 ? "s" : ""}`,
          icon: "🖼️",
          link: "/client?tab=obra",
        });
      }

      // Sort by date and limit to 10
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
    enabled: !!projectId,
  });
}
