import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { GanttMinistration } from "@/hooks/useGanttPlan";
import type { WeekCell } from "@/utils/ganttTime";
import { calculateLinePosition } from "@/utils/ganttTime";

type GanttMinistrationsProps = {
  ministrations: GanttMinistration[];
  weeks: WeekCell[];
  timelineStart: Date;
  timelineEnd: Date;
  onRemoveMinistration: (index: number) => void;
};

export function GanttMinistrations({
  ministrations,
  weeks,
  timelineStart,
  timelineEnd,
  onRemoveMinistration,
}: GanttMinistrationsProps) {
  // Calculate positions for vertical lines
  const linePositions = useMemo(() => {
    return ministrations.map((m) => ({
      ministration: m,
      position: calculateLinePosition(new Date(m.date), timelineStart, timelineEnd),
    }));
  }, [ministrations, timelineStart, timelineEnd]);

  return (
    <div className="space-y-4">
      {/* Visual Lines Container */}
      <div className="relative h-16 border rounded-lg bg-muted/20">
        {linePositions.map((item, index) => (
          <div
            key={item.ministration.id || index}
            className="absolute top-0 bottom-0 w-0.5 bg-destructive"
            style={{ left: `${item.position}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-destructive" />
            <div className="absolute top-4 left-2 text-xs font-semibold text-destructive whitespace-nowrap">
              {item.ministration.label}
            </div>
          </div>
        ))}
      </div>

      {/* Ministrations Table */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Ministraciones Programadas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Fecha</th>
                <th className="text-left p-2">Etiqueta</th>
                <th className="text-center p-2">% Ministración</th>
                <th className="text-center p-2">% Acumulado</th>
                <th className="text-left p-2">Alcance</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {ministrations.map((m, index) => (
                <tr key={m.id || index} className="border-b hover:bg-muted/50">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{format(new Date(m.date), "dd/MM/yyyy")}</td>
                  <td className="p-2 font-medium">{m.label}</td>
                  <td className="p-2 text-center">
                    {m.percent ? `${m.percent.toFixed(1)}%` : "-"}
                  </td>
                  <td className="p-2 text-center">
                    {m.accumulated_percent ? `${m.accumulated_percent.toFixed(1)}%` : "-"}
                  </td>
                  <td className="p-2 text-muted-foreground">{m.alcance || "-"}</td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveMinistration(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ministrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay ministraciones programadas
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
