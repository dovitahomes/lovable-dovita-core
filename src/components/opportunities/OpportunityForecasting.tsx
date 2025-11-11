import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useOpportunitiesForecast } from "@/hooks/crm/useOpportunitiesAnalytics";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export function OpportunityForecasting() {
  const { data: forecast, isLoading } = useOpportunitiesForecast();

  // Calculate totals
  const totalOpportunities = forecast?.reduce((sum, f) => sum + f.opportunityCount, 0) || 0;
  const totalWeightedValue = forecast?.reduce((sum, f) => sum + f.weightedAmount, 0) || 0;

  // Format month for display
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
  };

  // Prepare chart data
  const chartData = forecast?.map(f => ({
    month: formatMonth(f.month),
    monthKey: f.month,
    opportunities: f.opportunityCount,
    weighted: f.weightedAmount,
    projected: f.weightedAmount * (f.closeRate / 100)
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proyectado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-MX', { 
                    style: 'currency', 
                    currency: 'MXN',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(totalWeightedValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor ponderado por probabilidad
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades en Pipeline</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalOpportunities}</div>
                <p className="text-xs text-muted-foreground">
                  Con fecha de cierre esperada
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meses Proyectados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-2xl font-bold">{forecast?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Periodos con actividad
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Proyección de Ingresos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tendencia de cierre esperado por mes
          </p>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : !chartData || chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No hay datos de proyección disponibles</p>
                <p className="text-sm">
                  Agrega fechas de cierre esperadas a las oportunidades
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                />
                <YAxis 
                  fontSize={12}
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('es-MX', { 
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(value)
                  }
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'opportunities') {
                      return [value, 'Oportunidades'];
                    }
                    return [
                      new Intl.NumberFormat('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN',
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(value),
                      name === 'weighted' ? 'Monto Ponderado' : 'Proyección Cierre'
                    ];
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    if (value === 'opportunities') return 'Oportunidades';
                    if (value === 'weighted') return 'Monto Ponderado';
                    if (value === 'projected') return 'Proyección Cierre';
                    return value;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weighted" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="weighted"
                />
                <Line 
                  type="monotone" 
                  dataKey="projected" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="projected"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Mes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Desglose mensual del forecast
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !forecast || forecast.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay forecast disponible
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-semibold">Mes</th>
                    <th className="pb-3 font-semibold text-right">Oportunidades</th>
                    <th className="pb-3 font-semibold text-right">Monto Ponderado</th>
                    <th className="pb-3 font-semibold text-right">Tasa Cierre Est.</th>
                    <th className="pb-3 font-semibold text-right">Proyección Cierre</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f) => (
                    <tr key={f.month} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-3">
                        {formatMonth(f.month)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="outline">
                          {f.opportunityCount}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-semibold text-primary">
                        {new Intl.NumberFormat('es-MX', { 
                          style: 'currency', 
                          currency: 'MXN',
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(f.weightedAmount)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {f.closeRate}%
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {new Intl.NumberFormat('es-MX', { 
                          style: 'currency', 
                          currency: 'MXN',
                          notation: 'compact',
                          maximumFractionDigits: 1
                        }).format(f.weightedAmount * (f.closeRate / 100))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold border-t-2">
                    <td className="py-3">TOTAL</td>
                    <td className="py-3 text-right">
                      <Badge>
                        {totalOpportunities}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-primary">
                      {new Intl.NumberFormat('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN',
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(totalWeightedValue)}
                    </td>
                    <td className="py-3 text-right">-</td>
                    <td className="py-3 text-right">
                      {new Intl.NumberFormat('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN',
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(totalWeightedValue * 0.25)}
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
