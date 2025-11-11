import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ExternalLink, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCalendarEvents } from "@/hooks/useMyCalendarEvents";
import { useCollaboratorEventNotifications } from "@/hooks/useCollaboratorEventNotifications";
import { toEventManagerFormats, EVENT_TYPE_COLORS } from "@/lib/calendar/eventAdapter";
import { EventCard } from "@/components/calendar/views/EventCard";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function EmployeeCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  
  const now = new Date();
  const [month] = useState(now.getMonth());
  const [year] = useState(now.getFullYear());
  
  // Usar el hook unificado de calendar events
  const { data: rawEvents, isLoading } = useMyCalendarEvents({});
  
  // Suscribirse a notificaciones en tiempo real
  useCollaboratorEventNotifications(null);

  // Filtrar eventos del mes actual
  const events = useMemo(() => {
    return rawEvents?.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    }) || [];
  }, [rawEvents, month, year]);

  // Transformar eventos al formato EventManager
  const eventCards = useMemo(() => {
    return events ? toEventManagerFormats(events) : [];
  }, [events]);

  // Filtrar eventos del día seleccionado
  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    
    return eventCards.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [selectedDate, eventCards]);

  // Contar eventos pendientes (propuestas de clientes)
  const pendingEvents = useMemo(() => {
    return events?.filter(event => 
      event.status === 'propuesta' && event.visibility === 'client'
    ).length || 0;
  }, [events]);

  // Obtener próximos eventos (máximo 5)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return eventCards
      .filter(event => event.startTime >= now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5);
  }, [eventCards]);

  // Obtener las fechas que tienen eventos
  const datesWithEvents = useMemo(() => {
    if (!events) return [];
    return events.map(event => new Date(event.start_time));
  }, [events]);

  // Handler para clic en evento
  const handleEventClick = (event: any) => {
    // Navegar a Mi Calendario con el proyecto y fecha seleccionados
    if (event.projectId) {
      navigate(`/mi-calendario?project=${event.projectId}&view=day&date=${event.startTime.toISOString()}`);
    } else {
      navigate(`/mi-calendario?view=day&date=${event.startTime.toISOString()}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Mi Calendario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Mi Calendario
            {pendingEvents > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
                {pendingEvents}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/mi-calendario')}
              className="h-8 text-xs"
            >
              Ver todos
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigate('/mi-calendario?action=create')}
              title="Crear nueva cita"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{
            hasEvent: datesWithEvents,
          }}
          modifiersStyles={{
            hasEvent: {
              fontWeight: "bold",
              textDecoration: "underline",
            },
          }}
          className="rounded-md border"
        />

        {/* Eventos del día seleccionado */}
        {selectedDate && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">
              Eventos del {selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
            </h4>
            <div className="space-y-2">
              {eventsOnSelectedDate.length > 0 ? (
                eventsOnSelectedDate.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={handleEventClick}
                    onDragStart={() => {}}
                    onDragEnd={() => {}}
                    variant="compact"
                    canDrag={false}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay eventos para este día
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sección de Próximos Eventos */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-2 pt-4 border-t mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Próximos eventos
            </h4>
            <div className="space-y-1.5">
              {upcomingEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full text-left hover:bg-muted/50 rounded-md p-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        EVENT_TYPE_COLORS[event.event_type]?.bg || "bg-gray-500"
                      )} 
                    />
                    <span className="text-xs font-medium truncate flex-1">{event.title}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 ml-4">
                    {formatDistanceToNow(event.startTime, { addSuffix: true, locale: es })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
