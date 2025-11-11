import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useLeadsPipelineMetrics,
  useLeadsStageDistribution,
  useTopLeads,
  type LeadsStageDistribution,
} from "@/hooks/crm/useLeadsAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Target, Clock } from "lucide-react";

// Stage configuration with colors
const STAGE_CONFIG: { [key: string]: { label: string; color: string } } = {
  nuevo: { label: "Nuevo", color: "#6b7280" },
  contactado: { label: "Contactado", color: "#3b82f6" },
  calificado: { label: "Calificado", color: "#f59e0b" },
  propuesta: { label: "Propuesta", color: "#8b5cf6" },
  negociacion: { label: "Negociación", color: "#ef4444" },
};

export function LeadsDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useLeadsPipelineMetrics();
  const { data: distribution, isLoading: distributionLoading } = useLeadsStageDistribution();
  const { data: topLeads, isLoading: topLeadsLoading } = useTopLeads(10);

  // Format distribution data for chart
  const chartData = distribution
    ? Object.entries(distribution as LeadsStageDistribution).map(([stage, data]) => ({
        stage: STAGE_CONFIG[stage]?.label || stage,
        count: data.count,
        value: data.totalValue,
        fill: STAGE_CONFIG[stage]?.color || "#6b7280",
      }))
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Open Leads */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads Abiertos
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{metrics?.totalOpen || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">En pipeline activo</p>
          </CardContent>
        </Card>

        {/* Total Pipeline Value */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor del Pipeline
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  maximumFractionDigits: 0,
                }).format(metrics?.totalValue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Suma de leads activos</p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa de Conversión
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1)}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Leads ganados vs total</p>
          </CardContent>
        </Card>

        {/* Average Days to Close */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tiempo Promedio de Cierre
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{Math.round(metrics?.avgDaysToClose || 0)} días</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">De leads ganados</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución del Pipeline por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          {distributionLoading ? (
            <div className="h-80 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No hay datos de pipeline disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "value") {
                      return [
                        new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                          maximumFractionDigits: 0,
                        }).format(value),
                        "Valor Total",
                      ];
                    }
                    return [value, "Cantidad"];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Cantidad" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="value" name="Valor Total" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Leads por Valor</CardTitle>
        </CardHeader>
        <CardContent>
          {topLeadsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !topLeads || topLeads.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay leads con valor asignado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Nombre
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Cuenta
                    </th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                      Valor
                    </th>
                    <th className="text-center p-2 text-sm font-medium text-muted-foreground">
                      Probabilidad
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                      Cierre Esperado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm font-medium">{lead.nombre_completo}</td>
                      <td className="p-2 text-sm text-muted-foreground">
                        —
                      </td>
                      <td className="p-2 text-sm font-mono text-right">
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                          maximumFractionDigits: 0,
                        }).format(lead.amount)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="secondary">{lead.probability}%</Badge>
                      </td>
                      <td className="p-2">
                        <Badge
                          style={{
                            backgroundColor: STAGE_CONFIG[lead.status]?.color || "#6b7280",
                            color: "#fff",
                          }}
                        >
                          {STAGE_CONFIG[lead.status]?.label || lead.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {lead.expected_close_date
                          ? new Date(lead.expected_close_date).toLocaleDateString("es-MX")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
