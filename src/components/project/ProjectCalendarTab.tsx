import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProjectEvents } from '@/hooks/useProjectEvents';
import { useUpdateEvent } from '@/hooks/useMyCalendarEvents';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ProjectCalendarTabProps {
  projectId: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: 'Reunión',
  site_visit: 'Visita de obra',
  review: 'Revisión',
  deadline: 'Fecha límite',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  propuesta: 'Propuesta',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  propuesta: "secondary",
  aceptada: "default",
  rechazada: "destructive",
  cancelada: "outline",
};

export function ProjectCalendarTab({ projectId }: ProjectCalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const { data: events = [], isLoading } = useProjectEvents(projectId);
  const updateEvent = useUpdateEvent();
  
  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => (e as any).event_type === typeFilter);
    }
    
    return filtered;
  }, [events, statusFilter, typeFilter]);
  
  // Events for selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => isSameDay(parseISO(e.start_time), selectedDate));
  }, [filteredEvents, selectedDate]);
  
  // Dates with events for calendar highlighting
  const datesWithEvents = useMemo(() => {
    return filteredEvents.map(e => startOfDay(parseISO(e.start_time)));
  }, [filteredEvents]);
  
  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await updateEvent.mutateAsync({ id: eventId, status: newStatus });
    } catch (error: any) {
      toast.error("Error al actualizar estado");
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Calendar & Filters */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md border"
              modifiers={{
                hasEvent: datesWithEvents,
              }}
              modifiersClassNames={{
                hasEvent: 'bg-primary/10 font-bold',
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                  <TabsTrigger value="propuesta" className="text-xs">Propuestas</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="aceptada" className="text-xs">Aceptadas</TabsTrigger>
                  <TabsTrigger value="rechazada" className="text-xs">Rechazadas</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                  <TabsTrigger value="meeting" className="text-xs">Reuniones</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="site_visit" className="text-xs">Visitas</TabsTrigger>
                  <TabsTrigger value="review" className="text-xs">Revisiones</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Summary */}
            <div className="pt-2 border-t space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total eventos:</span>
                <span className="font-medium">{filteredEvents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aceptadas:</span>
                <span className="font-medium text-green-600">
                  {filteredEvents.filter(e => e.status === 'aceptada').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendientes:</span>
                <span className="font-medium text-orange-600">
                  {filteredEvents.filter(e => e.status === 'propuesta').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Middle & Right columns: Events timeline */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate 
                ? `Eventos del ${format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}`
                : 'Selecciona una fecha'
              }
            </CardTitle>
            {eventsForSelectedDate.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {eventsForSelectedDate.length} evento{eventsForSelectedDate.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay eventos para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventsForSelectedDate
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map(event => {
                    const eventAny = event as any;
                    return (
                      <Card key={event.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              {/* Title & Badges */}
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-base">{event.title}</h3>
                                <Badge variant={STATUS_VARIANTS[event.status] || "secondary"}>
                                  {STATUS_LABELS[event.status] || event.status}
                                </Badge>
                                {eventAny.event_type && (
                                  <Badge variant="outline">
                                    {EVENT_TYPE_LABELS[eventAny.event_type] || eventAny.event_type}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Description */}
                              {event.description && (
                                <p className="text-sm text-muted-foreground">
                                  {event.description}
                                </p>
                              )}
                              
                              {/* Metadata */}
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {format(parseISO(event.start_time), "HH:mm")} - {format(parseISO(event.end_time), "HH:mm")}
                                </div>
                                {eventAny.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {eventAny.location}
                                  </div>
                                )}
                                {event.created_by_name && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {event.created_by_name}
                                  </div>
                                )}
                              </div>
                              
                              {/* Actions for proposals */}
                              {event.status === 'propuesta' && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(event.id, 'aceptada')}
                                    disabled={updateEvent.isPending}
                                    className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    Aceptar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(event.id, 'rechazada')}
                                    disabled={updateEvent.isPending}
                                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                              
                              {/* Actions for accepted */}
                              {event.status === 'aceptada' && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(event.id, 'cancelada')}
                                    disabled={updateEvent.isPending}
                                    className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                    Cancelar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* All events summary */}
        {filteredEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximos eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredEvents
                  .filter(e => new Date(e.start_time) >= new Date())
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedDate(parseISO(event.start_time))}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.start_time), "d MMM, HH:mm", { locale: es })}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[event.status] || "secondary"} className="text-xs">
                        {STATUS_LABELS[event.status]}
                      </Badge>
                    </div>
                  ))}
                {filteredEvents.filter(e => new Date(e.start_time) >= new Date()).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay eventos próximos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
