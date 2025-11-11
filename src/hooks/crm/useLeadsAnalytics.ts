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

// Top leads (sin account_id)
export interface TopLead {
  id: string;
  nombre_completo: string;
  amount: number;
  probability: number;
  status: string;
  expected_close_date: string | null;
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

      const openStatuses: LeadStatus[] = ["propuesta", "negociacion"];
      const wonStatuses: LeadStatus[] = ["ganado", "convertido"];

      const openLeads = allLeads.filter((l) => openStatuses.includes(l.status as LeadStatus));
      const wonLeads = allLeads.filter((l) => wonStatuses.includes(l.status as LeadStatus));

      const totalOpen = openLeads.length;
      const totalValue = openLeads.reduce((sum, l) => sum + (l.amount || 0), 0);
      const conversionRate = allLeads.length > 0 ? (wonLeads.length / allLeads.length) * 100 : 0;

      // Calculate average days to close for won leads
      const daysToClose = wonLeads
        .filter((l) => l.closed_date && l.created_at)
        .map((l) => {
          const created = new Date(l.created_at);
          const closed = new Date(l.closed_date!);
          return Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });

      const avgDaysToClose = daysToClose.length > 0 
        ? daysToClose.reduce((a, b) => a + b, 0) / daysToClose.length 
        : 0;

      return {
        totalOpen,
        totalValue,
        conversionRate,
        avgDaysToClose,
      } as LeadsPipelineMetrics;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching leads stage distribution
 */
export function useLeadsStageDistribution() {
  return useQuery({
    queryKey: ["leads-stage-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("status, amount")
        .not("amount", "is", null);

      if (error) throw error;

      const distribution: LeadsStageDistribution = {};

      data.forEach((lead) => {
        const stage = lead.status;
        if (!distribution[stage]) {
          distribution[stage] = { count: 0, totalValue: 0 };
        }
        distribution[stage].count++;
        distribution[stage].totalValue += lead.amount || 0;
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
    queryKey: ["leads", "top", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          nombre_completo,
          amount,
          probability,
          status,
          expected_close_date
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
      const { data, error } = await supabase
        .from("leads")
        .select("expected_close_date, amount, probability, status")
        .not("amount", "is", null)
        .not("expected_close_date", "is", null)
        .in("status", ["propuesta", "negociacion", "ganado"]);

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: LeadsForecastData } = {};

      data.forEach((lead) => {
        if (!lead.expected_close_date) return;

        const date = new Date(lead.expected_close_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            opportunitiesCount: 0,
            weightedAmount: 0,
            closeRate: 0,
          };
        }

        monthlyData[monthKey].opportunitiesCount++;
        const weightedAmount = (lead.amount || 0) * ((lead.probability || 0) / 100);
        monthlyData[monthKey].weightedAmount += weightedAmount;
      });

      // Calculate close rate (for simplicity, using probability average)
      Object.keys(monthlyData).forEach((key) => {
        const monthLeads = data.filter((l) => {
          if (!l.expected_close_date) return false;
          const date = new Date(l.expected_close_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          return monthKey === key;
        });

        const avgProbability = monthLeads.reduce((sum, l) => sum + (l.probability || 0), 0) / monthLeads.length;
        monthlyData[key].closeRate = avgProbability;
      });

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    },
    staleTime: 1000 * 60 * 5,
  });
}
