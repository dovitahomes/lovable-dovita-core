import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIncomeVsExpenses } from "@/hooks/finance/useFinancialReports";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function IncomeVsExpensesChart() {
  const { data, isLoading } = useIncomeVsExpenses(6);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos vs Egresos</CardTitle>
        <CardDescription>Comparación mensual de últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="monthLabel" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={formatCurrency}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend 
              wrapperStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar 
              dataKey="ingresos" 
              fill="hsl(var(--chart-2))" 
              name="Ingresos"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="egresos" 
              fill="hsl(var(--chart-1))" 
              name="Egresos"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
