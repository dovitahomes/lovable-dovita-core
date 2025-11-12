import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy Recharts components
const IncomeVsExpensesChart = lazy(() => 
  import("./IncomeVsExpensesChart").then(m => ({ default: m.IncomeVsExpensesChart }))
);
const ExpenseDistributionChart = lazy(() => 
  import("./ExpenseDistributionChart").then(m => ({ default: m.ExpenseDistributionChart }))
);
const BalanceTrendChart = lazy(() => 
  import("./BalanceTrendChart").then(m => ({ default: m.BalanceTrendChart }))
);
const FinancialHeatmap = lazy(() => 
  import("./FinancialHeatmap").then(m => ({ default: m.FinancialHeatmap }))
);

const ChartSkeleton = () => (
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

export function LazyIncomeVsExpensesChart() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <IncomeVsExpensesChart />
    </Suspense>
  );
}

export function LazyExpenseDistributionChart() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ExpenseDistributionChart />
    </Suspense>
  );
}

export function LazyBalanceTrendChart() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <BalanceTrendChart />
    </Suspense>
  );
}

export function LazyFinancialHeatmap() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <FinancialHeatmap />
    </Suspense>
  );
}
