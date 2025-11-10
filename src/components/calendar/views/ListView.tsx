// FASE 2: List View Component
// Vista de lista agrupada por fecha con eventos expandidos

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventManagerEvent, getStatusLabel, EVENT_TYPE_COLORS, getEventTypeLabel } from "@/lib/calendar/eventAdapter";

interface ListViewProps {
  events: EventManagerEvent[];
  onEventClick: (event: EventManagerEvent) => void;
}

export function ListView({ events, onEventClick }: ListViewProps) {
  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const groupedEvents = sortedEvents.reduce(
    (acc, event) => {
      const dateKey = event.startTime.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, EventManagerEvent[]>
  );

  if (sortedEvents.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-sm text-muted-foreground sm:text-base">
          No hay eventos que coincidan con los filtros
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 sm:p-4">
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground sm:text-sm uppercase tracking-wide">
              {date}
            </h3>
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const colorClasses = EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS];
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-4"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={cn("mt-1 h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3", colorClasses.bg)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors sm:text-base">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-xs text-muted-foreground sm:text-sm line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {getEventTypeLabel(event.event_type as any)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:gap-4 sm:text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {event.startTime.toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {event.endTime.toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{event.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {event.projectName}
                          </Badge>
                          <Badge 
                            variant={event.status === 'propuesta' ? 'outline' : 'default'} 
                            className={cn(
                              "text-xs",
                              event.status === 'aceptada' && "bg-green-500/10 text-green-700 border-green-500/20",
                              event.status === 'rechazada' && "bg-red-500/10 text-red-700 border-red-500/20",
                              event.status === 'cancelada' && "bg-gray-500/10 text-gray-700 border-gray-500/20"
                            )}
                          >
                            {getStatusLabel(event.status as any)}
                          </Badge>
                          {event.visibility === 'client' && (
                            <Badge variant="secondary" className="text-xs">
                              Visible para cliente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
