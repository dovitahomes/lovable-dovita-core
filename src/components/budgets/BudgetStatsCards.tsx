import { FileText, CheckCircle, Edit3, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";
import { useBudgetStats } from "@/hooks/useBudgetStats";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetStatsCards() {
  const { data: stats, isLoading } = useBudgetStats();

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
        title="Total Presupuestos"
        value={stats.total.count}
        icon={FileText}
        gradient="from-blue-500/10 to-indigo-500/10"
      />
      
      <StatsCard
        title="Publicados"
        value={stats.published.count}
        icon={CheckCircle}
        gradient="from-green-500/10 to-emerald-500/10"
        badge={{
          text: "Activos",
          color: "bg-green-500 text-white",
        }}
      />
      
      <StatsCard
        title="Borradores"
        value={stats.draft.count}
        icon={Edit3}
        gradient="from-amber-500/10 to-orange-500/10"
        badge={{
          text: "En edición",
          color: "bg-amber-500 text-white",
        }}
      />
      
      <StatsCard
        title="Valor Total Pipeline"
        value={stats.totalValue.toLocaleString('es-MX', { 
          style: 'currency', 
          currency: 'MXN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        icon={DollarSign}
        gradient="from-violet-500/10 to-purple-500/10"
        badge={{
          text: "MXN",
          color: "bg-violet-500 text-white",
        }}
      />
    </div>
  );
}
