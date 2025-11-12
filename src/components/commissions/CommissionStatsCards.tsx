import { StatsCard } from "@/components/common/StatsCard";
import { DollarSign, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useCommissionStats } from "@/hooks/commissions/useCommissionStats";
import { Skeleton } from "@/components/ui/skeleton";

export function CommissionStatsCards() {
  const { data: stats, isLoading } = useCommissionStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
      <StatsCard
        title="Total Pendiente"
        value={`$${stats?.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        icon={Clock}
        gradient="from-orange-500/10 to-orange-600/10"
        badge={{
          text: "Por pagar",
          color: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
        }}
      />
      
      <StatsCard
        title="Pagado Este Mes"
        value={`$${stats?.totalPagadoMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        icon={CheckCircle2}
        gradient="from-green-500/10 to-green-600/10"
        badge={{
          text: "Completado",
          color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
        }}
      />
      
      <StatsCard
        title="Próximas a Vencer"
        value={`$${stats?.proximasVencer.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        icon={Clock}
        gradient="from-red-500/10 to-red-600/10"
        badge={{
          text: "Urgente",
          color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }}
      />
      
      <StatsCard
        title="Total Generado"
        value={`$${stats?.totalGenerado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
        icon={TrendingUp}
        gradient="from-blue-500/10 to-blue-600/10"
        badge={{
          text: "Histórico",
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
        }}
      />
    </div>
  );
}
