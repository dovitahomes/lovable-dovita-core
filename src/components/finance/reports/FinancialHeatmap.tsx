import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialHeatmap } from "@/hooks/finance/useFinancialReports";
import { format, startOfYear, eachDayOfInterval, endOfYear, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FinancialHeatmap() {
  const currentYear = new Date().getFullYear();
  const { data, isLoading } = useFinancialHeatmap(currentYear);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activityMap = new Map(data?.map(d => [d.date, d]) || []);
  const maxAmount = Math.max(...(data?.map(d => d.amount) || [1]));

  const startDate = startOfYear(new Date(currentYear, 0, 1));
  const endDate = endOfYear(new Date(currentYear, 11, 31));
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getIntensity = (amount: number) => {
    if (amount === 0) return 'bg-muted';
    const percentage = (amount / maxAmount) * 100;
    if (percentage < 25) return 'bg-chart-1/30';
    if (percentage < 50) return 'bg-chart-1/50';
    if (percentage < 75) return 'bg-chart-1/70';
    return 'bg-chart-1';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Group by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  allDays.forEach(day => {
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Financiera {currentYear}</CardTitle>
        <CardDescription>Mapa de calor de transacciones diarias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1 overflow-x-auto pb-4">
          <div className="flex gap-1">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
              <div key={i} className="w-3 h-3 text-[10px] text-muted-foreground flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>
          <TooltipProvider>
            {weeks.slice(0, 53).map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = week[dayIndex];
                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }
                  
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const activity = activityMap.get(dateKey);
                  const intensity = getIntensity(activity?.amount || 0);

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`w-3 h-3 rounded-sm ${intensity} hover:ring-2 hover:ring-primary transition-all cursor-pointer`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-medium">{format(day, 'dd MMMM yyyy', { locale: es })}</p>
                          {activity ? (
                            <>
                              <p className="text-muted-foreground">{activity.transactionCount} transacciones</p>
                              <p className="font-semibold text-primary">{formatCurrency(activity.amount)}</p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">Sin actividad</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </TooltipProvider>
          
          <div className="flex gap-2 items-center mt-4 text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-muted rounded-sm" />
              <div className="w-3 h-3 bg-chart-1/30 rounded-sm" />
              <div className="w-3 h-3 bg-chart-1/50 rounded-sm" />
              <div className="w-3 h-3 bg-chart-1/70 rounded-sm" />
              <div className="w-3 h-3 bg-chart-1 rounded-sm" />
            </div>
            <span>Más</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
