import { Building2, CheckCircle, FileText, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";
import { useProviderStats } from "@/hooks/useProviderStats";
import { Skeleton } from "@/components/ui/skeleton";

export function ProviderStatsCards() {
  const { data: stats, isLoading } = useProviderStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatsCard
        title="Total Proveedores"
        value={stats.total.count}
        icon={Building2}
        gradient="from-blue-500/10 to-indigo-500/10"
      />
      
      <StatsCard
        title="Activos"
        value={stats.active.count}
        icon={CheckCircle}
        gradient="from-green-500/10 to-emerald-500/10"
        badge={{
          text: "Activos",
          color: "bg-green-500 text-white",
        }}
      />
      
      <StatsCard
        title="Con Términos Definidos"
        value={stats.withTerms.count}
        icon={FileText}
        gradient="from-violet-500/10 to-purple-500/10"
      />
      
      <StatsCard
        title="Usados en Presupuestos"
        value={stats.usedInBudgets.count}
        icon={TrendingUp}
        gradient="from-orange-500/10 to-amber-500/10"
        badge={{
          text: "En uso",
          color: "bg-orange-500 text-white",
        }}
      />
    </div>
  );
}
