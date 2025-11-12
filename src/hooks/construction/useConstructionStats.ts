import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ConstructionStats {
  activeStages: number;
  globalProgress: number;
  totalPhotos: number;
  photosThisWeek: number;
  activeOrders: number;
  pendingOrders: number;
  teamMembers: number;
  onSiteToday: number;
}

export function useConstructionStats(projectId: string) {
  return useQuery<ConstructionStats>({
    queryKey: ['construction-stats', projectId],
    queryFn: async () => {
      // Get active stages
      // @ts-ignore - Avoiding deep type instantiation issues
      const stagesResult = await supabase
        .from('construction_stages')
        .select('id, progress')
        .eq('project_id', projectId)
        .eq('is_active', true);
      
      const stages = stagesResult.data || [];
      const activeStages = stages.length;
      const globalProgress = stages.length 
        ? Math.round(stages.reduce((sum: number, stage: any) => sum + (stage.progress || 0), 0) / stages.length)
        : 0;

      // Get photos stats
      // @ts-ignore
      const photosResult = await supabase
        .from('construction_photos')
        .select('id, created_at')
        .eq('project_id', projectId)
        .eq('is_active', true);
      
      const photos = photosResult.data || [];
      const totalPhotos = photos.length;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const photosThisWeek = photos.filter(
        (p: any) => new Date(p.created_at) > oneWeekAgo
      ).length;

      // Get purchase orders stats
      // @ts-ignore
      const ordersResult = await supabase
        .from('purchase_orders')
        .select('id, estado')
        .eq('project_id', projectId);
      
      const orders = ordersResult.data || [];
      const activeOrders = orders.filter(
        (o: any) => o.estado === 'ordenado' || o.estado === 'solicitado'
      ).length;
      const pendingOrders = orders.filter(
        (o: any) => o.estado === 'solicitado'
      ).length;

      // Get team members
      // @ts-ignore
      const teamResult = await supabase
        .from('project_collaborators')
        .select('id, user_id')
        .eq('project_id', projectId);
      
      const team = teamResult.data || [];
      const teamMembers = team.length;
      // TODO: Implement real-time on-site tracking
      const onSiteToday = Math.ceil(teamMembers * 0.6); // Estimate 60% on-site

      return {
        activeStages,
        globalProgress,
        totalPhotos,
        photosThisWeek,
        activeOrders,
        pendingOrders,
        teamMembers,
        onSiteToday,
      };
    },
    staleTime: 30000, // 30 seconds
  });
}
