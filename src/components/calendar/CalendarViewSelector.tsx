// FASE 3: Calendar View Selector
// Selector de vista (Month/Week/Day/List) con versiones mobile y desktop

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Grid3x3, Clock, List } from "lucide-react";

interface CalendarViewSelectorProps {
  view: "month" | "week" | "day" | "list";
  onViewChange: (view: "month" | "week" | "day" | "list") => void;
}

export function CalendarViewSelector({ view, onViewChange }: CalendarViewSelectorProps) {
  return (
    <>
      {/* Mobile: Select dropdown */}
      <div className="sm:hidden">
        <Select value={view} onValueChange={(value: any) => onViewChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vista Mensual
              </div>
            </SelectItem>
            <SelectItem value="week">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                Vista Semanal
              </div>
            </SelectItem>
            <SelectItem value="day">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Vista Diaria
              </div>
            </SelectItem>
            <SelectItem value="list">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Vista Lista
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Button group */}
      <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-background p-1">
        <Button
          variant={view === "month" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("month")}
          className="h-8"
        >
          <Calendar className="h-4 w-4" />
          <span className="ml-1.5">Mes</span>
        </Button>
        <Button
          variant={view === "week" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("week")}
          className="h-8"
        >
          <Grid3x3 className="h-4 w-4" />
          <span className="ml-1.5">Semana</span>
        </Button>
        <Button
          variant={view === "day" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("day")}
          className="h-8"
        >
          <Clock className="h-4 w-4" />
          <span className="ml-1.5">Día</span>
        </Button>
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("list")}
          className="h-8"
        >
          <List className="h-4 w-4" />
          <span className="ml-1.5">Lista</span>
        </Button>
      </div>
    </>
  );
}
