import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useKpiSalesFunnel } from "@/hooks/kpis/useKpiSalesFunnel";
import { useKpiPipelineValue } from "@/hooks/kpis/useKpiPipelineValue";
import { useKpiApAr } from "@/hooks/kpis/useKpiApAr";
import { useKpiProjectProgress } from "@/hooks/kpis/useKpiProjectProgress";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface KpiCardsProps {
  startDate?: string;
  endDate?: string;
  sucursalId?: string;
  projectId?: string;
}

export function KpiCards({ startDate, endDate, sucursalId, projectId }: KpiCardsProps) {
  const { data: salesFunnel, isLoading: loadingSales } = useKpiSalesFunnel();
  const { data: pipelineData, isLoading: loadingPipeline } = useKpiPipelineValue();
  const { data: apArData, isLoading: loadingApAr } = useKpiApAr();
  const { data: progressData, isLoading: loadingProgress } = useKpiProjectProgress();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateConversionRate = () => {
    if (!salesFunnel || salesFunnel.length === 0) return 0;
    
    const won = salesFunnel.find(s => s.status === 'ganado')?.count || 0;
    const lost = salesFunnel.find(s => s.status === 'perdido')?.count || 0;
    const total = won + lost;
    
    if (total === 0) return 0;
    return ((won / total) * 100).toFixed(1);
  };

  const calculateAvgProgress = () => {
    if (!progressData || progressData.length === 0) return 0;
    
    const total = progressData.reduce((acc, p) => acc + (p.progress_pct || 0), 0);
    return (total / progressData.length).toFixed(1);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Pipeline Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingPipeline ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(pipelineData?.[0]?.total_pipeline || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor estimado en pipeline
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingSales ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{calculateConversionRate()}%</div>
              <p className="text-xs text-muted-foreground">
                Leads ganados vs perdidos
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Accounts Receivable */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {loadingApAr ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(apArData?.[0]?.total_cobrar || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cuentas por cobrar
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Accounts Payable */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Pagar</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          {loadingApAr ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(apArData?.[0]?.total_pagar || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cuentas por pagar
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Project Progress */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avance de Proyectos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingProgress ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{calculateAvgProgress()}%</div>
              <p className="text-xs text-muted-foreground">
                Promedio de avance de {progressData?.length || 0} proyectos activos
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
