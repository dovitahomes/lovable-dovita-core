import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useMayorConsumption } from "@/hooks/finance/useProjectExpenses";
import { Badge } from "@/components/ui/badge";

interface MayorConsumptionBarsProps {
  projectId: string | null;
}

export function MayorConsumptionBars({ projectId }: MayorConsumptionBarsProps) {
  const { data, isLoading } = useMayorConsumption(projectId);

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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-full" />
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
          <CardTitle>Consumo por Mayor</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {!projectId 
              ? 'Selecciona un proyecto para ver el consumo por mayor'
              : 'No hay presupuesto publicado para este proyecto'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: 'green' | 'yellow' | 'purple') => {
    switch (status) {
      case 'green':
        return 'bg-emerald-500';
      case 'yellow':
        return 'bg-amber-500';
      case 'purple':
        return 'bg-purple-500';
    }
  };

  const getStatusBadge = (status: 'green' | 'yellow' | 'purple', percentage: number) => {
    const variant = status === 'green' ? 'default' : status === 'yellow' ? 'secondary' : 'destructive';
    const label = status === 'green' ? 'Saludable' : status === 'yellow' ? 'Atención' : 'Crítico';
    
    return (
      <Badge variant={variant} className="ml-2">
        {label} {percentage.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consumo por Mayor</CardTitle>
        <CardDescription>
          Barras colorizadas: <span className="text-emerald-600 dark:text-emerald-400">&lt;80% Verde</span> | 
          <span className="text-amber-600 dark:text-amber-400 ml-2">80-95% Amarillo</span> | 
          <span className="text-purple-600 dark:text-purple-400 ml-2">&gt;95% Morado</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((mayor) => (
          <div key={mayor.mayorId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {mayor.mayorCodigo} - {mayor.mayorNombre}
                </span>
                {getStatusBadge(mayor.status, mayor.porcentajeConsumo)}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(mayor.gastado + mayor.comprometido)} / {formatCurrency(mayor.presupuestado)}
              </span>
            </div>
            
            <Progress 
              value={Math.min(mayor.porcentajeConsumo, 100)} 
              className={`h-3 [&>div]:${getStatusColor(mayor.status)}`}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Gastado: {formatCurrency(mayor.gastado)}</span>
              <span>Comprometido: {formatCurrency(mayor.comprometido)}</span>
              <span>Disponible: {formatCurrency(mayor.disponible)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
