import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GanttMinistration } from "@/hooks/useGanttPlan";
import { differenceInDays } from "date-fns";

type GanttSummaryProps = {
  ministrations: GanttMinistration[];
  timelineStart: Date;
  timelineEnd: Date;
  totalBudget?: number;
};

export function GanttSummary({
  ministrations,
  timelineStart,
  timelineEnd,
  totalBudget = 0,
}: GanttSummaryProps) {
  const { 
    timeProgress, 
    investmentProgress, 
    accumulatedAmount, 
    nextMinistration,
    monthlyProgress 
  } = useMemo(() => {
    const now = new Date();
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    const elapsedDays = Math.max(0, differenceInDays(now, timelineStart));
    const timeProgress = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

    // Find next ministration
    const upcoming = ministrations
      .filter((m) => new Date(m.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    // Investment progress = last ministration accumulated_percent before now
    const pastMinistrations = ministrations
      .filter((m) => new Date(m.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const investmentProgress = pastMinistrations[0]?.accumulated_percent || 0;
    const accumulatedAmount = (totalBudget * investmentProgress) / 100;

    // Calculate monthly progress
    const monthlyProgress = ministrations.reduce((acc, m, idx) => {
      const prevPercent = idx > 0 ? (ministrations[idx - 1]?.accumulated_percent || 0) : 0;
      const monthPercent = (m.accumulated_percent || 0) - prevPercent;
      const monthDate = new Date(m.date);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0;
      }
      acc[monthKey] += monthPercent;
      
      return acc;
    }, {} as Record<string, number>);

    return {
      timeProgress,
      investmentProgress,
      accumulatedAmount,
      nextMinistration: upcoming,
      monthlyProgress,
    };
  }, [ministrations, timelineStart, timelineEnd, totalBudget]);

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-lg">Resumen de Avance</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avance Planeado (Tiempo)</span>
            <span className="font-semibold">{timeProgress.toFixed(1)}%</span>
          </div>
          <Progress value={timeProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Inversión Acumulada Programada</span>
            <span className="font-semibold">{investmentProgress.toFixed(1)}%</span>
          </div>
          {totalBudget > 0 && (
            <div className="text-xs text-muted-foreground mb-1">
              ${accumulatedAmount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </div>
          )}
          <Progress value={investmentProgress} className="h-2" />
        </div>
      </div>

      {nextMinistration && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-1">Próxima Ministración</p>
          <p className="font-medium">
            {nextMinistration.label} -{" "}
            {new Date(nextMinistration.date).toLocaleDateString("es-MX")}
          </p>
          {nextMinistration.percent && (
            <p className="text-sm text-muted-foreground">
              Monto: {nextMinistration.percent.toFixed(1)}%
            </p>
          )}
        </div>
      )}

      {/* Detalle de Ministraciones */}
      {ministrations.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Detalle de Ministraciones</h4>
          <div className="space-y-2">
            {ministrations.map((m, idx) => (
              <div key={m.id || idx} className="flex justify-between items-start text-sm p-2 rounded bg-muted/30">
                <div className="flex-1">
                  <p className="font-medium">{m.label}</p>
                  {m.alcance && (
                    <p className="text-xs text-muted-foreground mt-1">{m.alcance}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="font-mono">{m.percent?.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    Acum: {m.accumulated_percent?.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
