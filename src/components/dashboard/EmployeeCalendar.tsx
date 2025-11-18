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

  // Helper para obtener dots de colores por día
  const getEventDotsForDate = (date: Date) => {
    const eventsOnDate = events.filter(event => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
    
    // Retornar máximo 3 dots para evitar overflow visual
    return eventsOnDate.slice(0, 3).map(event => ({
      color: EVENT_TYPE_COLORS[event.event_type]?.bg || "bg-gray-500",
      type: event.event_type
    }));
  };

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
        <CardHeader className="pb-4 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Mi Calendario
                {pendingEvents > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
                    {pendingEvents}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {events.length} eventos este mes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/mi-calendario')}
              className="h-8 text-xs hover:bg-primary/10"
            >
              Ver todos
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-primary/10"
              onClick={() => navigate('/mi-calendario?action=create')}
              title="Crear nueva cita"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Layout Grid Responsive: 2 columnas en desktop, 1 en mobile */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(300px,1fr)_1.2fr] xl:grid-cols-[minmax(320px,400px)_1fr] gap-4 md:gap-6">
          
          {/* COLUMNA IZQUIERDA: Calendario */}
          <div className="flex flex-col space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              components={{
                DayContent: ({ date }) => {
                  const dots = getEventDotsForDate(date);
                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center group">
                      <span className="group-hover:scale-110 transition-transform">
                        {date.getDate()}
                      </span>
                      {dots.length > 0 && (
                        <div className="absolute -bottom-0.5 flex gap-0.5 justify-center">
                          {dots.map((dot, i) => (
                            <div 
                              key={i} 
                              className={cn("h-1 w-1 rounded-full", dot.color)} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
              }}
              className="rounded-lg border shadow-sm mx-auto md:mx-0"
            />
            
            {/* Stats rápidas */}
            <div className="flex gap-2 justify-center md:justify-start flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {events.length} eventos este mes
              </Badge>
              {pendingEvents > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingEvents} pendientes
                </Badge>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Eventos */}
          <div className="flex flex-col space-y-4 max-h-[350px] md:max-h-[450px] xl:max-h-[500px] overflow-y-auto events-scroll scroll-smooth">
            
            {/* Eventos del día seleccionado */}
            {selectedDate && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold sticky top-0 bg-background pb-2 z-10">
                  {selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                </h4>
                <div className="space-y-2">
                  {eventsOnSelectedDate.length > 0 ? (
                    eventsOnSelectedDate.map((event, index) => (
                      <div 
                        key={event.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <EventCard
                          event={event}
                          onEventClick={handleEventClick}
                          onDragStart={() => {}}
                          onDragEnd={() => {}}
                          variant="compact"
                          canDrag={false}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6 animate-fade-in">
                      No hay eventos para este día
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Próximos Eventos */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-background pb-2 z-10">
                  Próximos eventos
                </h4>
                <div className="space-y-1.5">
                  {upcomingEvents.map((event, index) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="w-full text-left hover:bg-accent/50 rounded-lg p-2.5 transition-all duration-200 hover:shadow-sm group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125",
                            EVENT_TYPE_COLORS[event.event_type]?.bg || "bg-gray-500"
                          )} 
                        />
                        <span className="text-xs font-medium truncate flex-1 group-hover:text-primary transition-colors">
                          {event.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 ml-4">
                        {formatDistanceToNow(event.startTime, { addSuffix: true, locale: es })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
