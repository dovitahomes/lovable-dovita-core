import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadsForecast } from "@/hooks/crm/useLeadsAnalytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Target } from "lucide-react";

export function LeadsForecasting() {
  const { data: forecast, isLoading } = useLeadsForecast();

  // Calculate totals
  const totalOpportunities = forecast?.reduce((sum, m) => sum + m.opportunitiesCount, 0) || 0;
  const totalWeightedValue = forecast?.reduce((sum, m) => sum + m.weightedAmount, 0) || 0;
  const monthsProjected = forecast?.length || 0;

  // Format month for display
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
  };

  // Format chart data
  const chartData = forecast?.map((f) => ({
    month: formatMonth(f.month),
    weighted: f.weightedAmount,
    projected: f.weightedAmount * 1.2, // Placeholder: assume 20% upside
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Proyectado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  maximumFractionDigits: 0,
                }).format(totalWeightedValue)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Ponderado por probabilidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads en Pipeline
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalOpportunities}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total de leads activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meses Proyectados
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{monthsProjected}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Con cierres esperados</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Proyección de Ingresos por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : !chartData || chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No hay datos de forecast disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weighted"
                  name="Valor Ponderado"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Proyección Optimista"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Forecast Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !forecast || forecast.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay datos de forecast disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">Mes</th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                      # Leads
                    </th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                      Valor Ponderado
                    </th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                      Tasa de Cierre Est.
                    </th>
                    <th className="text-right p-2 text-sm font-medium text-muted-foreground">
                      Proyección de Cierre
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f) => (
                    <tr key={f.month} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm font-medium">{formatMonth(f.month)}</td>
                      <td className="p-2 text-sm text-right">{f.opportunitiesCount}</td>
                      <td className="p-2 text-sm font-mono text-right">
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                          maximumFractionDigits: 0,
                        }).format(f.weightedAmount)}
                      </td>
                      <td className="p-2 text-sm text-right text-muted-foreground">30%</td>
                      <td className="p-2 text-sm font-mono text-right font-semibold">
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                          maximumFractionDigits: 0,
                        }).format(f.weightedAmount * 0.3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="p-2 text-sm">Total</td>
                    <td className="p-2 text-sm text-right">{totalOpportunities}</td>
                    <td className="p-2 text-sm font-mono text-right">
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                        maximumFractionDigits: 0,
                      }).format(totalWeightedValue)}
                    </td>
                    <td className="p-2 text-sm text-right">—</td>
                    <td className="p-2 text-sm font-mono text-right">
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                        maximumFractionDigits: 0,
                      }).format(totalWeightedValue * 0.3)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
