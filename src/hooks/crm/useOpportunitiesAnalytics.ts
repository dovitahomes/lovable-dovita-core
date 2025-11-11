import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import type { OpportunityStage } from "./useOpportunities";

export interface PipelineMetrics {
  totalOpen: number;
  totalValue: number;
  conversionRate: number;
  avgDaysToClose: number;
}

export interface StageDistribution {
  stage: OpportunityStage;
  count: number;
  totalValue: number;
}

export interface ForecastData {
  month: string;
  opportunityCount: number;
  weightedAmount: number;
  closeRate: number;
}

export function useOpportunitiesMetrics() {
  return useQuery({
    queryKey: ['opportunities-metrics'],
    queryFn: async () => {
      // Get all opportunities
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('stage, amount, probability, created_at, closed_date');
      
      if (error) throw error;
      
      const openOpps = opportunities.filter(o => 
        o.stage !== 'ganado' && o.stage !== 'perdido'
      );
      
      const closedOpps = opportunities.filter(o => 
        o.stage === 'ganado' || o.stage === 'perdido'
      );
      
      const wonOpps = opportunities.filter(o => o.stage === 'ganado');
      
      // Calculate metrics
      const totalOpen = openOpps.length;
      const totalValue = openOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
      
      const conversionRate = closedOpps.length > 0 
        ? (wonOpps.length / closedOpps.length) * 100 
        : 0;
      
      // Calculate avg days to close for won opportunities
      const daysToClose = wonOpps
        .filter(opp => opp.created_at && opp.closed_date)
        .map(opp => {
          const created = new Date(opp.created_at!);
          const closed = new Date(opp.closed_date!);
          return Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
      
      const avgDaysToClose = daysToClose.length > 0
        ? Math.round(daysToClose.reduce((sum, days) => sum + days, 0) / daysToClose.length)
        : 0;
      
      const metrics: PipelineMetrics = {
        totalOpen,
        totalValue,
        conversionRate,
        avgDaysToClose
      };
      
      return metrics;
    },
    ...CACHE_CONFIG.active,
  });
}

export function usePipelineDistribution() {
  return useQuery({
    queryKey: ['pipeline-distribution'],
    queryFn: async () => {
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('stage, amount')
        .in('stage', ['prospecto', 'calificado', 'propuesta', 'negociacion']);
      
      if (error) throw error;
      
      // Group by stage
      const distribution: Record<OpportunityStage, StageDistribution> = {
        'prospecto': { stage: 'prospecto', count: 0, totalValue: 0 },
        'calificado': { stage: 'calificado', count: 0, totalValue: 0 },
        'propuesta': { stage: 'propuesta', count: 0, totalValue: 0 },
        'negociacion': { stage: 'negociacion', count: 0, totalValue: 0 },
        'ganado': { stage: 'ganado', count: 0, totalValue: 0 },
        'perdido': { stage: 'perdido', count: 0, totalValue: 0 }
      };
      
      opportunities.forEach(opp => {
        const stage = opp.stage as OpportunityStage;
        distribution[stage].count++;
        distribution[stage].totalValue += opp.amount || 0;
      });
      
      return Object.values(distribution).filter(d => 
        ['prospecto', 'calificado', 'propuesta', 'negociacion'].includes(d.stage)
      );
    },
    ...CACHE_CONFIG.active,
  });
}

export function useTopOpportunities(limit: number = 10) {
  return useQuery({
    queryKey: ['top-opportunities', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          name,
          folio,
          stage,
          amount,
          probability,
          expected_close_date,
          accounts(name)
        `)
        .in('stage', ['prospecto', 'calificado', 'propuesta', 'negociacion'])
        .not('amount', 'is', null)
        .order('amount', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    ...CACHE_CONFIG.active,
  });
}

export function useOpportunitiesForecast() {
  return useQuery({
    queryKey: ['opportunities-forecast'],
    queryFn: async () => {
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('expected_close_date, amount, probability, stage')
        .in('stage', ['prospecto', 'calificado', 'propuesta', 'negociacion'])
        .not('expected_close_date', 'is', null)
        .not('amount', 'is', null);
      
      if (error) throw error;
      
      // Group by month
      const forecastByMonth: Record<string, ForecastData> = {};
      
      opportunities.forEach(opp => {
        const date = new Date(opp.expected_close_date!);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!forecastByMonth[monthKey]) {
          forecastByMonth[monthKey] = {
            month: monthKey,
            opportunityCount: 0,
            weightedAmount: 0,
            closeRate: 0
          };
        }
        
        forecastByMonth[monthKey].opportunityCount++;
        forecastByMonth[monthKey].weightedAmount += (opp.amount || 0) * ((opp.probability || 0) / 100);
      });
      
      // Sort by month and calculate close rate estimate
      const forecast = Object.values(forecastByMonth)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(f => ({
          ...f,
          closeRate: 25 // Placeholder: en producción esto vendría de históricos
        }));
      
      return forecast;
    },
    ...CACHE_CONFIG.active,
  });
}
