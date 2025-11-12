import { Card, CardContent } from "@/components/ui/card";
import { useTreasuryStats } from "@/hooks/finance/useTreasuryStats";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TreasuryStatsCards() {
  const { data: stats, isLoading } = useTreasuryStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const cards = [
    {
      title: 'Balance Total',
      value: stats?.totalBalance || 0,
      icon: DollarSign,
      gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      subtitle: `${stats?.activeAccounts || 0} cuentas activas`,
    },
    {
      title: 'Ingresos del Mes',
      value: stats?.monthIncome || 0,
      icon: TrendingUp,
      gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      subtitle: 'Depósitos recibidos',
    },
    {
      title: 'Egresos del Mes',
      value: stats?.monthExpenses || 0,
      icon: TrendingDown,
      gradient: 'from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20',
      iconColor: 'text-red-600 dark:text-red-400',
      subtitle: 'Retiros realizados',
    },
    {
      title: 'Flujo Neto',
      value: stats?.netFlow || 0,
      icon: Activity,
      gradient: stats?.netFlow && stats.netFlow >= 0
        ? 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20'
        : 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
      iconColor: stats?.netFlow && stats.netFlow >= 0
        ? 'text-violet-600 dark:text-violet-400'
        : 'text-amber-600 dark:text-amber-400',
      subtitle: 'Balance del mes',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className={cn(
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-4"
          )}
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-3 rounded-xl bg-gradient-to-br", card.gradient)}>
                <card.icon className={cn("h-6 w-6", card.iconColor)} />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(card.value)}
              </p>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
