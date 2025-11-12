import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProjectExpenseTimeline } from "@/hooks/finance/useProjectExpenses";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingDown, ShoppingCart } from "lucide-react";

interface ExpenseTimelineProps {
  projectId: string | null;
}

export function ExpenseTimeline({ projectId }: ExpenseTimelineProps) {
  const { data, isLoading } = useProjectExpenseTimeline(projectId);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0 || !projectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Gastos</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {!projectId 
              ? 'Selecciona un proyecto para ver la timeline de gastos'
              : 'No hay gastos registrados para este proyecto'}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by mayor
  const groupedByMayor = data.reduce((acc, expense) => {
    if (!acc[expense.mayorNombre]) {
      acc[expense.mayorNombre] = [];
    }
    acc[expense.mayorNombre].push(expense);
    return acc;
  }, {} as Record<string, typeof data>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline de Gastos</CardTitle>
        <CardDescription>Últimos 30 gastos agrupados por mayor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedByMayor).map(([mayorNombre, expenses]) => (
          <div key={mayorNombre} className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h4 className="font-semibold text-sm text-foreground">{mayorNombre}</h4>
              <Badge variant="outline" className="text-xs">
                {expenses.length} {expenses.length === 1 ? 'registro' : 'registros'}
              </Badge>
            </div>
            
            <div className="space-y-3 pl-4">
              {expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`
                    p-2 rounded-full 
                    ${expense.type === 'gasto' 
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}
                  `}>
                    {expense.type === 'gasto' ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {expense.concept}
                      </p>
                      <Badge variant={expense.type === 'gasto' ? 'destructive' : 'secondary'}>
                        {expense.type === 'gasto' ? 'Pagado' : 'Comprometido'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {format(expense.date, "dd MMM yyyy", { locale: es })}
                        {expense.provider && ` • ${expense.provider}`}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {expenses.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  + {expenses.length - 5} registros más
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
