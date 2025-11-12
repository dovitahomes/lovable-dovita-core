import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBankTransactions } from "@/hooks/useBankTransactions";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function RecentTransactionsTimeline() {
  const { data: transactions, isLoading } = useBankTransactions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const recentTransactions = transactions?.slice(0, 10) || [];

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
          <CardDescription>Últimas 10 transacciones bancarias</CardDescription>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            No hay movimientos registrados
          </p>
          <p className="text-sm text-muted-foreground">
            Los movimientos aparecerán aquí cuando se registren transacciones
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos Recientes</CardTitle>
        <CardDescription>Últimas 10 transacciones bancarias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((transaction, index) => (
            <div
              key={transaction.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-all duration-300",
                "hover:bg-muted/50 hover:shadow-sm",
                "animate-in fade-in slide-in-from-left-4"
              )}
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              {/* Icon */}
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                transaction.type === 'ingreso'
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20"
                  : "bg-red-500/10 dark:bg-red-500/20"
              )}>
                {transaction.type === 'ingreso' ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">
                    {transaction.description || 'Sin descripción'}
                  </p>
                  <p className={cn(
                    "font-bold shrink-0",
                    transaction.type === 'ingreso'
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {transaction.type === 'ingreso' ? '+' : '-'}
                    {formatCurrency(transaction.amount || 0)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={transaction.type === 'ingreso' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {transaction.date
                      ? format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })
                      : 'Sin fecha'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ref: {transaction.reference || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
