import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommissionDistribution } from "@/hooks/commissions/useCommissionCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)'];

export function CommissionDistributionChart() {
  const { data, isLoading } = useCommissionDistribution();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <PieChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle>Distribución por Tipo</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ tipo, total }) => `${tipo}: $${(total / 1000).toFixed(0)}k`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="total"
            >
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [
                `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
