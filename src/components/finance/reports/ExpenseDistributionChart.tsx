import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseDistribution } from "@/hooks/finance/useFinancialReports";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { subMonths } from "date-fns";

export function ExpenseDistributionChart() {
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);
  const { data, isLoading } = useExpenseDistribution(startDate, endDate);

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
        <CardTitle>Distribución de Gastos</CardTitle>
        <CardDescription>Por categoría - Último mes</CardDescription>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="amount"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={formatCurrency}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                wrapperStyle={{ color: 'hsl(var(--foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No hay datos de gastos para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
