import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { GanttItem } from "@/hooks/useGanttPlan";
import type { BudgetMajor } from "@/hooks/useBudgetMajors";
import type { WeekCell } from "@/utils/ganttTime";
import { groupWeeksByMonth, calculateBarPosition } from "@/utils/ganttTime";

type GanttGridProps = {
  items: (GanttItem & { mayor?: BudgetMajor })[];
  weeks: WeekCell[];
  timelineStart: Date;
  timelineEnd: Date;
  primaryColor: string;
  secondaryColor: string;
  onRemoveItem: (index: number) => void;
};

export function GanttGrid({
  items,
  weeks,
  timelineStart,
  timelineEnd,
  primaryColor,
  secondaryColor,
  onRemoveItem,
}: GanttGridProps) {
  const monthsMap = useMemo(() => groupWeeksByMonth(weeks), [weeks]);
  const monthNumbers = useMemo(
    () => Array.from(monthsMap.keys()).sort((a, b) => a - b),
    [monthsMap]
  );

  return (
    <div className="overflow-x-auto border rounded-lg">
      <div className="min-w-[1000px]">
        {/* Header Row */}
        <div className="flex bg-muted border-b">
          <div className="w-12 flex-shrink-0 p-2 text-center font-semibold border-r">#</div>
          <div className="w-48 flex-shrink-0 p-2 font-semibold border-r">Mayor</div>
          <div className="w-32 flex-shrink-0 p-2 text-right font-semibold border-r">
            Importe
          </div>
          <div className="w-20 flex-shrink-0 p-2 text-center font-semibold border-r">%</div>
          <div className="flex-1 flex">
            {monthNumbers.map((monthNum) => {
              const monthWeeks = monthsMap.get(monthNum) || [];
              return (
                <div
                  key={monthNum}
                  className="flex-1 border-r last:border-r-0"
                  style={{ minWidth: "120px" }}
                >
                  <div className="p-2 text-center font-semibold border-b bg-muted/50">
                    Mes {monthNum}
                  </div>
                  <div className="flex">
                    {monthWeeks.map((week) => (
                      <div
                        key={week.weekNumber}
                        className="flex-1 p-1 text-center text-xs border-r last:border-r-0"
                        style={{ minWidth: "30px" }}
                      >
                        S{week.weekInMonth}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="w-12 flex-shrink-0"></div>
        </div>

        {/* Data Rows */}
        {items.map((item, index) => {
          const barPos = calculateBarPosition(
            new Date(item.start_date),
            new Date(item.end_date),
            timelineStart,
            timelineEnd
          );

          return (
            <div key={item.id || index} className="flex border-b hover:bg-muted/20">
              <div className="w-12 flex-shrink-0 p-2 text-center border-r">{index + 1}</div>
              <div className="w-48 flex-shrink-0 p-2 border-r text-sm">
                {item.tu_nodes?.name || "Sin nombre"}
              </div>
              <div className="w-32 flex-shrink-0 p-2 text-right border-r text-sm">
                {item.mayor?.importe
                  ? `$${item.mayor.importe.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "-"}
              </div>
              <div className="w-20 flex-shrink-0 p-2 text-center border-r text-sm">
                {item.mayor?.pct_of_total
                  ? `${item.mayor.pct_of_total.toFixed(1)}%`
                  : "-"}
              </div>
              <div className="flex-1 relative p-2 border-r" style={{ minHeight: "40px" }}>
                {/* Gantt Bar */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-6 rounded"
                  style={{
                    left: `${barPos.left}%`,
                    width: `${barPos.width}%`,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    minWidth: "2px",
                  }}
                />
              </div>
              <div className="w-12 flex-shrink-0 p-2 flex items-center justify-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(index)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No hay mayores en el cronograma. Añade uno para comenzar.
          </div>
        )}
      </div>
    </div>
  );
}
