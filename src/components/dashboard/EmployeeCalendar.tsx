import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ExternalLink, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-calendar-visible');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Persistir estado del toggle
  const toggleCalendar = () => {
    const newState = !isCalendarVisible;
    setIsCalendarVisible(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-calendar-visible', JSON.stringify(newState));
    }
  };
  
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

  // Eliminar lógica de eventos del día - redundante con próximos eventos

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
      <div className={cn(
        "grid grid-cols-1 gap-4",
        // Desktop: 2 columnas (calendario + próximos eventos)
        "md:grid-cols-[300px_1fr]",
        // Si calendario está colapsado: 1 columna full-width
        !isCalendarVisible && "md:grid-cols-1"
      )}>
          
        {/* Calendario Mini - Colapsable */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isCalendarVisible ? "opacity-100" : "opacity-0 w-0"
        )}>
          {isCalendarVisible && (
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Calendario
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCalendar}
                  className="h-8 w-8 p-0"
                  title="Ocultar calendario"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg border shadow-sm mx-auto w-full"
                classNames={{
                  months: "space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                  ),
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-10 font-normal text-xs",
                  row: "flex w-full mt-1",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-10 w-10 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
                    "aria-selected:bg-primary aria-selected:text-primary-foreground"
                  ),
                }}
                modifiers={{
                  hasEvent: datesWithEvents
                }}
                modifiersClassNames={{
                  hasEvent: "font-bold"
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dots = getEventDotsForDate(date);
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span className="text-xs">{date.getDate()}</span>
                        {dots.length > 0 && (
                          <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                            {dots.map((dot, idx) => (
                              <div
                                key={idx}
                                className={cn("w-1 h-1 rounded-full", dot.color)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
              
              {pendingEvents > 0 && (
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
                    {pendingEvents} propuesta{pendingEvents > 1 ? 's' : ''} pendiente{pendingEvents > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Próximos Eventos - Columna Principal */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!isCalendarVisible && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCalendar}
                  className="h-9 px-3"
                  title="Mostrar calendario"
                >
                  <PanelLeftOpen className="h-4 w-4 mr-2" />
                  Calendario
                </Button>
              )}
              <h3 className="text-lg font-semibold">Próximos eventos</h3>
              <Badge variant="secondary" className="text-xs ml-2">
                {upcomingEvents.length}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/mi-calendario')}
              className="hidden md:flex"
            >
              Ver todos
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="flex flex-col space-y-3 max-h-[520px] overflow-y-auto events-scroll scroll-smooth">
              {upcomingEvents.map((event, index) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full text-left hover:bg-accent/50 rounded-lg p-3 transition-all duration-200 hover:shadow-sm group animate-fade-in border border-transparent hover:border-border"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className={cn(
                        "h-3 w-3 rounded-full shrink-0 mt-1 transition-transform group-hover:scale-125",
                        EVENT_TYPE_COLORS[event.event_type]?.bg || "bg-gray-500"
                      )} 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block group-hover:text-primary transition-colors">
                        {event.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(event.startTime, { addSuffix: true, locale: es })}
                        </span>
                        {event.projectName && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {event.projectName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay próximos eventos programados
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/mi-calendario?action=create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear evento
              </Button>
            </div>
          )}
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
