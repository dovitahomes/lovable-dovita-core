import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface MonthlyUsage {
  month: string; // Format: "MMM yyyy" (e.g., "Ene 2024")
  total: number;
}

interface ProviderUsageStats {
  monthlyUsage: MonthlyUsage[];
  totalProjects: number;
  totalOrders: number;
}

export function useProviderUsageStats(providerId?: string) {
  return useQuery({
    queryKey: ["provider-usage-stats", providerId],
    queryFn: async (): Promise<ProviderUsageStats> => {
      if (!providerId) {
        return {
          monthlyUsage: [],
          totalProjects: 0,
          totalOrders: 0,
        };
      }

      // Calculate date range (last 6 months)
      const endDate = new Date();
      const startDate = subMonths(endDate, 5); // 6 months including current

      // Get purchase orders for this provider
      const { data: purchaseOrders, error: poError } = await supabase
        .from("purchase_orders")
        .select("id, created_at, project_id")
        .eq("proveedor_id", providerId);

      if (poError) throw poError;

      // Get budget items for this provider in the last 6 months
      const { data: budgetItems, error: biError } = await supabase
        .from("budget_items")
        .select("created_at, total, budgets!inner(project_id)")
        .eq("provider_id", providerId)
        .gte("created_at", startOfMonth(startDate).toISOString())
        .lte("created_at", endOfMonth(endDate).toISOString());

      if (biError) throw biError;

      // Aggregate by month
      const monthlyMap = new Map<string, number>();

      // Initialize all 6 months with 0
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(endDate, 5 - i);
        const monthKey = format(monthDate, "MMM yyyy", { locale: es });
        monthlyMap.set(monthKey, 0);
      }

      // Add budget items
      budgetItems?.forEach((item) => {
        const monthKey = format(new Date(item.created_at), "MMM yyyy", { locale: es });
        const currentTotal = monthlyMap.get(monthKey) || 0;
        monthlyMap.set(monthKey, currentTotal + (item.total || 0));
      });

      // Convert to array
      const monthlyUsage: MonthlyUsage[] = Array.from(monthlyMap.entries()).map(
        ([month, total]) => ({
          month,
          total,
        })
      );

      // Count unique projects from budget items
      const projectsFromBI = new Set(
        budgetItems?.map((item) => (item.budgets as any)?.project_id).filter(Boolean) || []
      );

      return {
        monthlyUsage,
        totalProjects: projectsFromBI.size,
        totalOrders: purchaseOrders?.length || 0,
      };
    },
    enabled: !!providerId,
    staleTime: 60000, // 1 minute
  });
}
