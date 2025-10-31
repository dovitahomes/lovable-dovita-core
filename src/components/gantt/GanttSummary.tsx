import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GanttMinistration } from "@/hooks/useGanttPlan";
import { differenceInDays } from "date-fns";

type GanttSummaryProps = {
  ministrations: GanttMinistration[];
  timelineStart: Date;
  timelineEnd: Date;
};

export function GanttSummary({
  ministrations,
  timelineStart,
  timelineEnd,
}: GanttSummaryProps) {
  const { timeProgress, investmentProgress, nextMinistration } = useMemo(() => {
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

    return {
      timeProgress,
      investmentProgress,
      nextMinistration: upcoming,
    };
  }, [ministrations, timelineStart, timelineEnd]);

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
            <span className="text-muted-foreground">Inversión Acumulada</span>
            <span className="font-semibold">{investmentProgress.toFixed(1)}%</span>
          </div>
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
    </Card>
  );
}
