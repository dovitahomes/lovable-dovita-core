import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalanceTrend } from "@/hooks/finance/useFinancialReports";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function BalanceTrendChart() {
  const { data, isLoading } = useBalanceTrend(6);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Sample every 7 days for better visualization
  const sampledData = data?.filter((_, index) => index % 7 === 0) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Balance</CardTitle>
        <CardDescription>Evolución del balance en últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={sampledData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: es })}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={formatCurrency}
              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: es })}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              dot={false}
              name="Balance"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
