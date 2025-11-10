import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { useMyCalendarEvents } from "@/hooks/useMyCalendarEvents";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EventFilters } from "@/components/calendar/EventFilters";
import { EventsList } from "@/components/calendar/EventsList";
import { EventDetailsPanel } from "@/components/calendar/EventDetailsPanel";
import { CreateEventDialog } from "@/components/calendar/CreateEventDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfDay, endOfDay, isSameDay } from "date-fns";

export default function MiCalendario() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State para filtros
  const [projectId, setProjectId] = useState<string | undefined>(
    searchParams.get('project') || undefined
  );
  const [clientId, setClientId] = useState<string | undefined>(
    searchParams.get('client') || undefined
  );
  const [eventType, setEventType] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  // Sincronizar URL params con state
  useEffect(() => {
    const projectParam = searchParams.get('project');
    const clientParam = searchParams.get('client');
    
    if (projectParam) setProjectId(projectParam);
    if (clientParam) setClientId(clientParam);
  }, [searchParams]);
  
  // Cargar eventos
  const { data: events, isLoading } = useMyCalendarEvents({
    projectId,
    clientId,
    eventType,
  });
  
  // Filtrar eventos por fecha seleccionada
  const filteredEvents = selectedDate
    ? events?.filter(event => 
        isSameDay(new Date(event.start_time), selectedDate)
      )
    : events;
  
  const handleProjectChange = (value: string | undefined) => {
    setProjectId(value);
    if (value) {
      searchParams.set('project', value);
    } else {
      searchParams.delete('project');
    }
    setSearchParams(searchParams);
  };
  
  const handleClientChange = (value: string | undefined) => {
    setClientId(value);
    if (value) {
      searchParams.set('client', value);
    } else {
      searchParams.delete('client');
    }
    setSearchParams(searchParams);
  };
  
  const handleClearFilters = () => {
    setProjectId(undefined);
    setClientId(undefined);
    setEventType(undefined);
    setSelectedDate(undefined);
    setSearchParams({});
  };
  
  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
  };
  
  const handleEditEvent = () => {
    setEditingEvent(selectedEvent);
    setShowCreateDialog(true);
  };
  
  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };
  
  const handleCreateDialogClose = () => {
    setShowCreateDialog(false);
    setEditingEvent(null);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-8 w-8" />
                Mi Calendario
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona tus eventos y reuniones de proyectos
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cita
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filtros (Sidebar izquierdo en desktop, full width en mobile) */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <EventFilters
                projectId={projectId}
                clientId={clientId}
                eventType={eventType}
                onProjectChange={handleProjectChange}
                onClientChange={handleClientChange}
                onEventTypeChange={setEventType}
                onClearFilters={handleClearFilters}
              />
              
              {/* Calendario Visual */}
              <div className="hidden lg:block">
                <CalendarView
                  events={events || []}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </div>
            </div>
          </div>
          
          {/* Lista de Eventos (Centro) */}
          <div className="lg:col-span-5">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                {selectedDate
                  ? `Eventos del ${selectedDate.toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}`
                  : 'Todos los eventos'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredEvents?.length || 0} eventos encontrados
              </p>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <EventsList
                events={filteredEvents || []}
                selectedEventId={selectedEvent?.id}
                onEventClick={handleEventClick}
              />
            )}
          </div>
          
          {/* Panel de Detalles (Derecha, collapsible en mobile) */}
          <div className={`lg:col-span-4 ${selectedEvent ? 'block' : 'hidden lg:block'}`}>
            {selectedEvent ? (
              <EventDetailsPanel
                event={selectedEvent}
                onEdit={handleEditEvent}
                onClose={handleCloseDetails}
              />
            ) : (
              <div className="hidden lg:block">
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona un evento para ver sus detalles
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Dialog para Crear/Editar Evento */}
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={handleCreateDialogClose}
        event={editingEvent}
        defaultProjectId={projectId}
      />
    </div>
  );
}
