import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Users, Activity } from "lucide-react";
import { useKpiSalesFunnel } from "@/hooks/kpis/useKpiSalesFunnel";
import { useKpiPipelineValue } from "@/hooks/kpis/useKpiPipelineValue";
import { useKpiApAr } from "@/hooks/kpis/useKpiApAr";
import { useKpiProjectProgress } from "@/hooks/kpis/useKpiProjectProgress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Metrics() {
  const { data: salesFunnel, isLoading: loadingFunnel } = useKpiSalesFunnel();
  const { data: pipelineValue, isLoading: loadingPipeline } = useKpiPipelineValue();
  const { data: apAr, isLoading: loadingApAr } = useKpiApAr();
  const { data: projectProgress, isLoading: loadingProgress } = useKpiProjectProgress();

  const calculateConversionRate = () => {
    if (!salesFunnel) return 0;
    const won = salesFunnel.find(s => s.status === 'convertido')?.count || 0;
    const lost = salesFunnel.find(s => s.status === 'perdido')?.count || 0;
    const total = won + lost;
    return total > 0 ? ((won / total) * 100).toFixed(1) : 0;
  };

  const getOpenLeadsCount = () => {
    if (!salesFunnel) return 0;
    return salesFunnel
      .filter(s => ['nuevo', 'contactado', 'calificado'].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  const chartData = salesFunnel?.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count
  })) || [];

  const progressData = projectProgress?.map(p => ({
    name: p.client_name?.substring(0, 20) || 'Sin cliente',
    progress: Math.round(p.progress_pct || 0)
  })) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Métricas Ejecutivas</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Abiertos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingFunnel ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{getOpenLeadsCount()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingFunnel ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{calculateConversionRate()}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPipeline ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(pipelineValue || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AR vs AP</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingApAr ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  Cobrar: <span className="font-semibold text-foreground">{formatCurrency(apAr?.total_cobrar || 0)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Pagar: <span className="font-semibold text-foreground">{formatCurrency(apAr?.total_pagar || 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFunnel ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sin datos disponibles
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>% Avance por Proyecto (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProgress ? (
              <Skeleton className="h-[300px] w-full" />
            ) : progressData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sin proyectos activos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" angle={-15} textAnchor="end" height={80} />
                  <YAxis className="text-xs" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
