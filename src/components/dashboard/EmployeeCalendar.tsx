import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ExternalLink, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent } from "@/components/ui/popover";
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
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [dayPopoverOpen, setDayPopoverOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);

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
    const params = new URLSearchParams();
    params.set('date', event.startTime.toISOString().split('T')[0]);
    if (event.projectId) {
      params.set('projectId', event.projectId);
    }
    navigate(`/mi-calendario?${params.toString()}`);
  };

  // Handler para clic en día del calendario
  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    
    // Obtener eventos de ese día específico
    const eventsOnDate = eventCards.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
    
    // Si hay eventos, abrir popover
    if (eventsOnDate.length > 0) {
      setSelectedDayEvents(eventsOnDate);
      setDayPopoverOpen(true);
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
      <CardContent className="p-4 sm:p-6">
        {/* Vista única: Eventos O Calendario */}
        <div className="w-full">
          {!isCalendarVisible ? (
            // ========== VISTA: PRÓXIMOS EVENTOS (Por defecto) ==========
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Próximos eventos</h3>
                  {upcomingEvents.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-2 text-xs">
                      {upcomingEvents.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCalendar}
                    className="h-8 px-2 text-xs"
                    title="Mostrar vista calendario"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/mi-calendario')}
                    className="h-8 px-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Lista compacta de próximos eventos */}
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="flex flex-col space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin">
                  {upcomingEvents.map((event, index) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="w-full text-left hover:bg-accent/50 rounded-lg p-2.5 transition-all border border-transparent hover:border-border group animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-start gap-2">
                        {/* Dot colorizado por tipo */}
                        <div 
                          className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 group-hover:scale-125 transition-transform",
                            EVENT_TYPE_COLORS[event.event_type]?.bg || "bg-gray-500"
                          )} 
                        />
                        
                        {/* Info del evento */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(event.startTime, { addSuffix: true, locale: es })}</span>
                            {event.projectName && (
                              <>
                                <span>•</span>
                                <span className="truncate">{event.projectName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No hay próximos eventos
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/mi-calendario?action=create')}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Crear evento
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // ========== VISTA: CALENDARIO MENSUAL ==========
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Calendario</h3>
                  {events.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-2 text-xs">
                      {events.length} este mes
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCalendar}
                    className="h-8 px-2 text-xs"
                    title="Mostrar próximos eventos"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/mi-calendario')}
                    className="h-8 px-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Calendario con dots */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                className="rounded-lg border shadow-sm w-full pointer-events-auto"
                classNames={{
                  months: "space-y-3",
                  month: "space-y-3",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-10 font-normal text-xs",
                  row: "flex w-full mt-1",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  day: "h-10 w-10 p-0 font-normal rounded-md hover:bg-accent cursor-pointer",
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
                          <div className="absolute bottom-1 flex gap-0.5 justify-center">
                            {dots.map((dot, idx) => (
                              <div key={idx} className={cn("w-1 h-1 rounded-full", dot.color)} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />

              {/* Alert de propuestas pendientes */}
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

        {/* Popover de eventos del día seleccionado */}
        <Popover open={dayPopoverOpen} onOpenChange={setDayPopoverOpen}>
          <PopoverContent 
            className="w-80 p-3" 
            align="center"
            side="top"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">
                  Eventos del {selectedDate?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                </h4>
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {selectedDayEvents.length}
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedDayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setDayPopoverOpen(false);
                      handleEventClick(event);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-accent border border-transparent hover:border-border transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div 
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0 mt-1.5",
                          EVENT_TYPE_COLORS[event.event_type]?.bg || "bg-gray-500"
                        )} 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
