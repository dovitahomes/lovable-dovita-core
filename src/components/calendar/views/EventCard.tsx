// FASE 2: EventCard Component
// Card de evento con hover effects y variantes (default, compact, detailed)
// Calendario Universal: muestra badges para proyectos, leads y eventos personales

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventManagerEvent, getStatusLabel, EVENT_TYPE_COLORS } from "@/lib/calendar/eventAdapter";

interface EventCardProps {
  event: EventManagerEvent;
  onEventClick: (event: EventManagerEvent) => void;
  onDragStart: (event: EventManagerEvent) => void;
  onDragEnd: () => void;
  variant?: "default" | "compact" | "detailed";
  canDrag?: boolean;
}

export function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  variant = "default",
  canDrag = true,
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colorClasses = EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    const diff = event.endTime.getTime() - event.startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Variant: compact - para Month View (eventos pequeños en días)
  if (variant === "compact") {
    return (
      <div
        draggable={canDrag}
        onDragStart={() => canDrag && onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative"
      >
        <div
          className={cn(
            "cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-medium transition-all duration-300",
            colorClasses.bg,
            "text-white animate-in fade-in slide-in-from-left-1",
            isHovered && "scale-105 shadow-lg z-10",
            !canDrag && "cursor-default opacity-75"
          )}
        >
          <div className="truncate">
            {event.title}
          </div>
        </div>
        {isHovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border-2 p-3 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                  <div className={cn("h-3 w-3 rounded-full flex-shrink-0", colorClasses.bg)} />
                </div>
                {event.entity_type === 'lead' && (
                  <Badge variant="outline" className="text-[10px]">Lead</Badge>
                )}
                {event.entity_type === 'personal' && (
                  <Badge variant="outline" className="text-[10px]">Personal</Badge>
                )}
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {event.projectName}
                  </Badge>
                  <Badge 
                    variant={event.status === 'propuesta' ? 'outline' : 'default'} 
                    className="text-[10px] h-5"
                  >
                    {getStatusLabel(event.status as any)}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Variant: detailed - para Day View (eventos expandidos con toda la info)
  if (variant === "detailed") {
    return (
      <div
        draggable={canDrag}
        onDragStart={() => canDrag && onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "cursor-pointer rounded-lg p-3 transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-2",
          isHovered && "scale-[1.03] shadow-2xl ring-2 ring-white/50",
          !canDrag && "cursor-default opacity-75"
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description && (
          <div className="mt-1 text-sm opacity-90 line-clamp-2">{event.description}</div>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
        {isHovered && (
          <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              {event.projectName}
            </Badge>
            <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/50">
              {getStatusLabel(event.status as any)}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Variant: default - para Week View y List View
  return (
    <div
      draggable={canDrag}
      onDragStart={() => canDrag && onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-1",
          isHovered && "scale-105 shadow-lg z-10",
          !canDrag && "cursor-default opacity-75"
        )}
      >
        <div className="truncate">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 p-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight">{event.title}</h4>
                <div className={cn("h-4 w-4 rounded-full flex-shrink-0", colorClasses.bg)} />
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {event.projectName}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getStatusLabel(event.status as any)}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
