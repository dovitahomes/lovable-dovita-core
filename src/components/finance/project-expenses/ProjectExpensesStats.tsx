import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectBudgetSummary } from "@/hooks/finance/useProjectExpenses";
import { DollarSign, TrendingDown, ShoppingCart, PiggyBank } from "lucide-react";

interface ProjectExpensesStatsProps {
  projectId: string | null;
}

export function ProjectExpensesStats({ projectId }: ProjectExpensesStatsProps) {
  const { data, isLoading } = useProjectBudgetSummary(projectId);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || !projectId) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Selecciona un proyecto para ver los gastos
      </div>
    );
  }

  const stats = [
    {
      title: 'Presupuesto Total',
      value: formatCurrency(data.presupuesto),
      icon: DollarSign,
      gradient: 'from-blue-500/10 to-blue-600/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Gastado',
      value: formatCurrency(data.gastado),
      icon: TrendingDown,
      gradient: 'from-red-500/10 to-red-600/10',
      iconColor: 'text-red-600 dark:text-red-400',
      percentage: data.presupuesto > 0 ? (data.gastado / data.presupuesto) * 100 : 0,
    },
    {
      title: 'Comprometido',
      value: formatCurrency(data.comprometido),
      icon: ShoppingCart,
      gradient: 'from-amber-500/10 to-amber-600/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      percentage: data.presupuesto > 0 ? (data.comprometido / data.presupuesto) * 100 : 0,
    },
    {
      title: 'Disponible',
      value: formatCurrency(data.disponible),
      icon: PiggyBank,
      gradient: 'from-emerald-500/10 to-emerald-600/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      percentage: data.presupuesto > 0 ? (data.disponible / data.presupuesto) * 100 : 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="relative overflow-hidden transition-all hover:shadow-lg"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
            {stat.percentage !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.percentage.toFixed(1)}% del presupuesto
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
