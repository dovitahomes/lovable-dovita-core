import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MailchimpCampaign {
  id: string;
  campaign_id: string;
  email_from: string;
  email_to: string;
  subject: string;
  sent_at: string;
  opens: number;
  clicks: number;
  bounces: number;
  last_synced_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface MetricsSummary {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  avgOpenRate: number;
  avgClickRate: number;
}

export function useMailchimpMetrics() {
  const queryClient = useQueryClient();

  // Obtener todas las campañas
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['mailchimp-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mailchimp_campaigns')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data as MailchimpCampaign[];
    },
  });

  // Calcular resumen de métricas
  const summary: MetricsSummary = {
    totalSent: campaigns?.length || 0,
    totalOpens: campaigns?.reduce((sum, c) => sum + (c.opens || 0), 0) || 0,
    totalClicks: campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0,
    totalBounces: campaigns?.reduce((sum, c) => sum + (c.bounces || 0), 0) || 0,
    avgOpenRate: campaigns?.length 
      ? (campaigns.reduce((sum, c) => sum + (c.opens || 0), 0) / campaigns.length) * 100
      : 0,
    avgClickRate: campaigns?.length
      ? (campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0) / campaigns.length) * 100
      : 0,
  };

  // Sincronizar métricas desde Mailchimp
  const syncMetrics = useMutation({
    mutationFn: async (campaignId?: string) => {
      const { data, error } = await supabase.functions.invoke('mailchimp-sync', {
        body: { campaignId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      const message = data.syncedCount > 0 
        ? `${data.syncedCount} campañas sincronizadas`
        : 'No hay campañas para sincronizar';
      toast.success(message);
    },
    onError: (error: Error) => {
      console.error('Error syncing metrics:', error);
      toast.error(`Error al sincronizar métricas: ${error.message}`);
    },
  });

  return {
    campaigns: campaigns || [],
    summary,
    isLoading: isLoadingCampaigns,
    syncMetrics: syncMetrics.mutate,
    isSyncing: syncMetrics.isPending,
  };
}
