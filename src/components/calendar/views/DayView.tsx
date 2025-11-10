// FASE 2: Day View Component
// Vista de un solo día con timeline de 24 horas

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EventCard } from "./EventCard";
import { EventManagerEvent } from "@/lib/calendar/eventAdapter";

interface DayViewProps {
  currentDate: Date;
  events: EventManagerEvent[];
  onEventClick: (event: EventManagerEvent) => void;
  onDragStart: (event: EventManagerEvent) => void;
  onDragEnd: () => void;
  onDrop: (date: Date, hour: number) => void;
  canDragEvent?: (event: EventManagerEvent) => boolean;
}

export function DayView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  canDragEvent = () => true,
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventHour === hour
      );
    });
  };

  return (
    <Card className="overflow-auto max-h-[600px]">
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div
              key={hour}
              className="flex border-b last:border-b-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(currentDate, hour)}
            >
              <div className="w-14 flex-shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20 sm:p-3 sm:text-sm bg-muted/30">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="min-h-16 flex-1 p-1 transition-colors hover:bg-accent/50 sm:min-h-20 sm:p-2">
                <div className="space-y-2">
                  {hourEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventClick={onEventClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      variant="detailed"
                      canDrag={canDragEvent(event)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
