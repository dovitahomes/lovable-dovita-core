import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  useOpportunitiesMetrics, 
  usePipelineDistribution, 
  useTopOpportunities 
} from "@/hooks/crm/useOpportunitiesAnalytics";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Clock,
  Building2,
  Calendar
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell
} from "recharts";
import { STAGE_CONFIG } from "../crm/OpportunityKanban";

const STAGE_COLORS: Record<string, string> = {
  prospecto: "hsl(var(--chart-1))",
  calificado: "hsl(var(--chart-2))",
  propuesta: "hsl(var(--chart-3))",
  negociacion: "hsl(var(--chart-4))",
};

export function OpportunitiesDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useOpportunitiesMetrics();
  const { data: distribution, isLoading: distributionLoading } = usePipelineDistribution();
  const { data: topOpps, isLoading: topOppsLoading } = useTopOpportunities(10);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades Abiertas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.totalOpen || 0}</div>
                <p className="text-xs text-muted-foreground">En pipeline activo</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-MX', { 
                    style: 'currency', 
                    currency: 'MXN',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(metrics?.totalValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Monto total oportunidades</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Oportunidades ganadas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.avgDaysToClose || 0} días</div>
                <p className="text-xs text-muted-foreground">Para cerrar oportunidad</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pipeline Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución del Pipeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Oportunidades por etapa del proceso
            </p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {distributionLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="stage" 
                    tickFormatter={(value) => STAGE_CONFIG[value]?.label || value}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'totalValue') {
                        return new Intl.NumberFormat('es-MX', { 
                          style: 'currency', 
                          currency: 'MXN' 
                        }).format(value);
                      }
                      return value;
                    }}
                    labelFormatter={(label) => STAGE_CONFIG[label]?.label || label}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Cantidad" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Embudo de Conversión</CardTitle>
            <p className="text-sm text-muted-foreground">
              Progreso a través del pipeline
            </p>
          </CardHeader>
          <CardContent className="h-[300px]">
            {distributionLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip 
                    formatter={(value: any) => `${value} oportunidades`}
                  />
                  <Funnel
                    dataKey="count"
                    data={distribution || []}
                    isAnimationActive
                  >
                    <LabelList 
                      position="right" 
                      fill="#000" 
                      stroke="none" 
                      dataKey="stage"
                      formatter={(value: string) => STAGE_CONFIG[value]?.label || value}
                    />
                    {distribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage]} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Oportunidades</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mayores montos en pipeline
          </p>
        </CardHeader>
        <CardContent>
          {topOppsLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !topOpps || topOpps.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay oportunidades disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {topOpps.map((opp: any) => (
                <div 
                  key={opp.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{opp.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {opp.folio}
                      </Badge>
                      <Badge className="text-xs">
                        {STAGE_CONFIG[opp.stage]?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {opp.accounts?.name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {opp.accounts.name}
                        </span>
                      )}
                      {opp.expected_close_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(opp.expected_close_date).toLocaleDateString('es-MX')}
                        </span>
                      )}
                      <span className="text-xs">
                        Prob: {opp.probability}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {new Intl.NumberFormat('es-MX', { 
                        style: 'currency', 
                        currency: 'MXN',
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(opp.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
