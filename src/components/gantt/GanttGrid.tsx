import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, GripHorizontal } from "lucide-react";
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
  totalBudget?: number;
  onRemoveItem: (index: number) => void;
  onUpdateItem?: (index: number, updates: Partial<GanttItem>) => void;
  readOnly?: boolean;
};

export function GanttGrid({
  items,
  weeks,
  timelineStart,
  timelineEnd,
  primaryColor,
  secondaryColor,
  totalBudget = 0,
  onRemoveItem,
  onUpdateItem,
  readOnly = false,
}: GanttGridProps) {
  const [draggingItem, setDraggingItem] = useState<number | null>(null);
  const [resizingItem, setResizingItem] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const monthsMap = useMemo(() => groupWeeksByMonth(weeks), [weeks]);
  const monthNumbers = useMemo(
    () => Array.from(monthsMap.keys()).sort((a, b) => a - b),
    [monthsMap]
  );

  // Handle drag to reposition bar
  const handleBarMouseDown = (e: React.MouseEvent, itemIndex: number) => {
    if (!onUpdateItem || readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingItem(itemIndex);
    setDragStartX(e.clientX);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, itemIndex: number) => {
    if (!onUpdateItem || readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setResizingItem(itemIndex);
    setDragStartX(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingItem === null && resizingItem === null) return;
      if (!gridRef.current || !onUpdateItem) return;

      const deltaX = e.clientX - dragStartX;
      const gridWidth = gridRef.current.offsetWidth;
      const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
      const deltaTime = (deltaX / gridWidth) * totalDuration;
      const deltaDays = Math.round(deltaTime / (1000 * 60 * 60 * 24));
      const deltaWeeks = Math.round(deltaDays / 7);

      if (deltaWeeks === 0) return;

      if (draggingItem !== null) {
        const item = items[draggingItem];
        const newStart = new Date(item.start_date);
        const newEnd = new Date(item.end_date);
        newStart.setDate(newStart.getDate() + deltaWeeks * 7);
        newEnd.setDate(newEnd.getDate() + deltaWeeks * 7);
        
        onUpdateItem(draggingItem, {
          start_date: newStart.toISOString().split('T')[0],
          end_date: newEnd.toISOString().split('T')[0],
        });
        setDragStartX(e.clientX);
      } else if (resizingItem !== null) {
        const item = items[resizingItem];
        const newEnd = new Date(item.end_date);
        newEnd.setDate(newEnd.getDate() + deltaWeeks * 7);
        
        if (newEnd > new Date(item.start_date)) {
          onUpdateItem(resizingItem, {
            end_date: newEnd.toISOString().split('T')[0],
          });
          setDragStartX(e.clientX);
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingItem(null);
      setResizingItem(null);
    };

    if (draggingItem !== null || resizingItem !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingItem, resizingItem, dragStartX, items, onUpdateItem, timelineStart, timelineEnd]);

  return (
    <div ref={gridRef} className="overflow-x-auto border rounded-lg">
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

          const itemImporte = item.mayor?.importe || 0;
          const itemPct = totalBudget > 0 && itemImporte > 0 ? (itemImporte / totalBudget) * 100 : (item.mayor?.pct_of_total || 0);

          return (
            <div key={item.id || index} className="flex border-b hover:bg-muted/20">
              <div className="w-12 flex-shrink-0 p-2 text-center border-r">{index + 1}</div>
              <div className="w-48 flex-shrink-0 p-2 border-r text-sm">
                {item.tu_nodes?.name || "Sin nombre"}
              </div>
              <div className="w-32 flex-shrink-0 p-2 text-right border-r text-sm font-mono">
                {itemImporte > 0
                  ? `$${itemImporte.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "-"}
              </div>
              <div className="w-20 flex-shrink-0 p-2 text-center border-r text-sm font-mono">
                {itemPct > 0 ? `${itemPct.toFixed(1)}%` : "-"}
              </div>
              <div className="flex-1 relative p-2 border-r" style={{ minHeight: "40px" }}>
                {/* Gantt Bar */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-6 rounded flex items-center justify-center text-white text-xs font-medium ${
                    onUpdateItem && !readOnly ? 'cursor-move group' : ''
                  }`}
                  style={{
                    left: `${barPos.left}%`,
                    width: `${barPos.width}%`,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    minWidth: "2px",
                  }}
                  onMouseDown={(e) => onUpdateItem && !readOnly && handleBarMouseDown(e, index)}
                >
                  {onUpdateItem && !readOnly && (
                    <GripHorizontal className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100" />
                  )}
                  {barPos.width > 10 && (item.tu_nodes?.name || "")}
                  {onUpdateItem && !readOnly && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 rounded-r"
                      onMouseDown={(e) => handleResizeMouseDown(e, index)}
                    />
                  )}
                </div>
              </div>
              <div className="w-12 flex-shrink-0 p-2 flex items-center justify-center">
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveItem(index)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
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
