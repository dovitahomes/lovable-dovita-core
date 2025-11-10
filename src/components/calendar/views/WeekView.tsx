// FASE 2: Week View Component
// Vista semanal con grid de 7 días x 24 horas

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EventCard } from "./EventCard";
import { EventManagerEvent } from "@/lib/calendar/eventAdapter";

interface WeekViewProps {
  currentDate: Date;
  events: EventManagerEvent[];
  onEventClick: (event: EventManagerEvent) => void;
  onDragStart: (event: EventManagerEvent) => void;
  onDragEnd: () => void;
  onDrop: (date: Date, hour: number) => void;
  canDragEvent?: (event: EventManagerEvent) => boolean;
}

export function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  canDragEvent = () => true,
}: WeekViewProps) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventHour === hour
      );
    });
  };

  return (
    <Card className="overflow-auto">
      <div className="grid grid-cols-8 border-b bg-muted/30 sticky top-[88px] z-10">
        <div className="border-r p-2 text-center text-xs font-medium sm:text-sm">Hora</div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm"
          >
            <div className="hidden sm:block">
              {day.toLocaleDateString("es-MX", { weekday: "short" })}
            </div>
            <div className="sm:hidden">
              {day.toLocaleDateString("es-MX", { weekday: "narrow" })}
            </div>
            <div className="text-[10px] text-muted-foreground sm:text-xs">
              {day.toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <>
            <div
              key={`time-${hour}`}
              className="border-b border-r p-1 text-[10px] text-muted-foreground sm:p-2 sm:text-xs sticky left-0 bg-background"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-12 border-b border-r p-0.5 transition-colors hover:bg-accent/50 last:border-r-0 sm:min-h-16 sm:p-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        variant="default"
                        canDrag={canDragEvent(event)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        ))}
      </div>
    </Card>
  );
}
