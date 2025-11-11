import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadStatus } from "@/hooks/useLeads";

// Pipeline metrics
export interface LeadsPipelineMetrics {
  totalOpen: number;
  totalValue: number;
  conversionRate: number;
  avgDaysToClose: number;
}

// Stage distribution
export interface LeadsStageDistribution {
  [stage: string]: {
    count: number;
    totalValue: number;
  };
}

// Forecast data
export interface LeadsForecastData {
  month: string;
  opportunitiesCount: number;
  weightedAmount: number;
  closeRate: number;
}

// Top leads
export interface TopLead {
  id: string;
  nombre_completo: string;
  amount: number;
  probability: number;
  status: string;
  expected_close_date: string | null;
  account_id: string | null;
  accounts?: { name: string } | null;
}

/**
 * Hook for fetching leads pipeline metrics
 * Calculates total open leads, total value, conversion rate, and avg days to close
 */
export function useLeadsPipelineMetrics() {
  return useQuery({
    queryKey: ["leads-pipeline-metrics"],
    queryFn: async () => {
      // Get all leads with amount (these are "opportunities")
      const { data: allLeads, error } = await supabase
        .from("leads")
        .select("id, status, amount, created_at, closed_date")
        .not("amount", "is", null);

      if (error) throw error;

      const openLeads = allLeads.filter((l) =>
        ["nuevo", "contactado", "calificado", "propuesta", "negociacion"].includes(l.status)
      );
      const wonLeads = allLeads.filter((l) => l.status === "ganado");
      const totalLeads = allLeads.length;

      const totalValue = openLeads.reduce((sum, l) => sum + (l.amount || 0), 0);

      const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;

      // Calculate average days to close for won leads
      const leadsWithCloseDates = wonLeads.filter((l) => l.closed_date);
      const avgDaysToClose =
        leadsWithCloseDates.length > 0
          ? leadsWithCloseDates.reduce((sum, l) => {
              const days = Math.floor(
                (new Date(l.closed_date!).getTime() - new Date(l.created_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / leadsWithCloseDates.length
          : 0;

      const metrics: LeadsPipelineMetrics = {
        totalOpen: openLeads.length,
        totalValue,
        conversionRate,
        avgDaysToClose,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching pipeline distribution by stage
 */
export function useLeadsPipelineDistribution() {
  return useQuery({
    queryKey: ["leads-pipeline-distribution"],
    queryFn: async () => {
      const stages: LeadStatus[] = ["nuevo", "contactado", "calificado", "propuesta", "negociacion"];
      
      const { data: leads, error } = await supabase
        .from("leads")
        .select("status, amount")
        .in("status", stages)
        .not("amount", "is", null);

      if (error) throw error;

      const distribution: LeadsStageDistribution = {};

      stages.forEach((stage) => {
        const stageLeads = leads.filter((l) => l.status === stage);
        distribution[stage] = {
          count: stageLeads.length,
          totalValue: stageLeads.reduce((sum, l) => sum + (l.amount || 0), 0),
        };
      });

      return distribution;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching top leads by amount
 */
export function useTopLeads(limit: number = 10) {
  return useQuery({
    queryKey: ["top-leads", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          nombre_completo,
          amount,
          probability,
          status,
          expected_close_date,
          account_id,
          accounts (name)
        `)
        .not("amount", "is", null)
        .order("amount", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as TopLead[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching leads forecast by month
 */
export function useLeadsForecast() {
  return useQuery({
    queryKey: ["leads-forecast"],
    queryFn: async () => {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("expected_close_date, amount, probability")
        .not("expected_close_date", "is", null)
        .not("amount", "is", null)
        .in("status", ["propuesta", "negociacion"] as LeadStatus[]);

      if (error) throw error;

      // Group by month
      const forecastByMonth: { [key: string]: LeadsForecastData } = {};

      leads.forEach((lead) => {
        const date = new Date(lead.expected_close_date!);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!forecastByMonth[monthKey]) {
          forecastByMonth[monthKey] = {
            month: monthKey,
            opportunitiesCount: 0,
            weightedAmount: 0,
            closeRate: 0, // Placeholder
          };
        }

        forecastByMonth[monthKey].opportunitiesCount += 1;
        forecastByMonth[monthKey].weightedAmount +=
          (lead.amount || 0) * ((lead.probability || 0) / 100);
      });

      // Convert to array and sort by month
      const forecastArray = Object.values(forecastByMonth).sort((a, b) =>
        a.month.localeCompare(b.month)
      );

      return forecastArray;
    },
    staleTime: 1000 * 60 * 5,
  });
}
