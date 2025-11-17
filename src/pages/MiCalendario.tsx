// Mi Calendario - Vista centralizada de eventos con múltiples vistas
// Integración completa de las 8 fases del plan de mejora UI
// Calendario Universal: soporta eventos de proyectos, leads y personales

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useMyCalendarEvents, useUpdateEvent } from "@/hooks/useMyCalendarEvents";
import { useCollaboratorEventNotifications } from "@/hooks/useCollaboratorEventNotifications";
import { EventFiltersEnhanced } from "@/components/calendar/EventFiltersEnhanced";
import { EventDetailsPanel } from "@/components/calendar/EventDetailsPanel";
import { CreateEventDialog } from "@/components/calendar/CreateEventDialog";
import { CalendarViewSelector } from "@/components/calendar/CalendarViewSelector";
import { MonthView } from "@/components/calendar/views/MonthView";
import { WeekView } from "@/components/calendar/views/WeekView";
import { DayView } from "@/components/calendar/views/DayView";
import { ListView } from "@/components/calendar/views/ListView";
import { toEventManagerFormats, toSupabaseUpdate, EventManagerEvent } from "@/lib/calendar/eventAdapter";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function MiCalendario() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State para filtros (FASE 4, 6)
  const [projectId, setProjectId] = useState<string | undefined>(
    searchParams.get('project') || undefined
  );
  const [clientId, setClientId] = useState<string | undefined>(
    searchParams.get('client') || undefined
  );
  const [eventType, setEventType] = useState<string | undefined>(undefined);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>(undefined); // Nuevo filtro
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState(""); // FASE 4: Búsqueda por texto
  
  // State para vista y navegación (FASE 3)
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State para eventos seleccionados y dialogs
  const [selectedEvent, setSelectedEvent] = useState<EventManagerEvent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  // State para drag & drop (FASE 5)
  const [draggedEvent, setDraggedEvent] = useState<EventManagerEvent | null>(null);
  
  // Mutation para actualizar eventos
  const updateEvent = useUpdateEvent();
  
  // Sincronizar URL params con state
  useEffect(() => {
    const projectParam = searchParams.get('project');
    const clientParam = searchParams.get('client');
    const viewParam = searchParams.get('view');
    
    if (projectParam) setProjectId(projectParam);
    if (clientParam) setClientId(clientParam);
    if (viewParam && ['month', 'week', 'day', 'list'].includes(viewParam)) {
      setView(viewParam as any);
    }
  }, [searchParams]);
  
  // Cargar eventos desde Supabase
  const { data: rawEvents, isLoading } = useMyCalendarEvents({
    projectId,
    clientId,
    eventType,
    entityType: entityTypeFilter, // Nuevo filtro
  });
  
  // Notificaciones en tiempo real para colaboradores (FASE 3: Paso 3)
  useCollaboratorEventNotifications(projectId || null);
  
  // Transformar eventos al formato EventManager (FASE 1)
  const events = useMemo(() => {
    return rawEvents ? toEventManagerFormats(rawEvents) : [];
  }, [rawEvents]);
  
  // Filtrado combinado: status + búsqueda de texto (FASE 4, 6)
  const filteredEvents = useMemo(() => {
    let result = events;
    
    // Filtro por status
    if (statusFilter) {
      result = result.filter(e => e.status === statusFilter);
    }
    
    // Búsqueda por texto (título, descripción, ubicación, nombre de proyecto)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.projectName.toLowerCase().includes(query) ||
        event.clientName.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [events, statusFilter, searchQuery]);
  
  // Validar permisos de drag (FASE 5)
  const canDragEvent = async (event: EventManagerEvent) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Obtener roles del usuario
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some(r => r.role_name === 'admin');
    if (isAdmin) return true;
    
    // Verificar si es colaborador del proyecto
    const { data: collaboration } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', event.projectId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    return !!collaboration;
  };
  
  // Handlers de navegación temporal (FASE 3)
  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (view === "month") {
        newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      } else if (view === "week") {
        newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      } else if (view === "day") {
        newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1));
      }
      return newDate;
    });
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handlers de drag & drop (FASE 5)
  const handleDragStart = async (event: EventManagerEvent) => {
    const canDrag = await canDragEvent(event);
    if (!canDrag) {
      toast.error("No tienes permisos para mover este evento");
      return;
    }
    setDraggedEvent(event);
  };
  
  const handleDragEnd = () => {
    setDraggedEvent(null);
  };
  
  const handleDrop = async (date: Date, hour?: number) => {
    if (!draggedEvent) return;
    
    // Calcular nueva fecha/hora manteniendo la duración
    const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
    const newStartTime = new Date(date);
    if (hour !== undefined) {
      newStartTime.setHours(hour, 0, 0, 0);
    } else {
      // Si no hay hora específica (month view), mantener hora original
      newStartTime.setHours(draggedEvent.startTime.getHours(), draggedEvent.startTime.getMinutes(), 0, 0);
    }
    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    // Actualizar en Supabase
    const updates = toSupabaseUpdate({
      startTime: newStartTime,
      endTime: newEndTime,
    });
    
    updateEvent.mutate(
      { id: draggedEvent.id, ...updates },
      {
        onSuccess: () => {
          toast.success("Evento reprogramado exitosamente");
        },
        onError: () => {
          toast.error("Error al reprogramar el evento");
        },
      }
    );
    
    setDraggedEvent(null);
  };
  
  // Handlers de filtros
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
  
  const handleViewChange = (newView: "month" | "week" | "day" | "list") => {
    setView(newView);
    searchParams.set('view', newView);
    setSearchParams(searchParams);
  };
  
  const handleClearFilters = () => {
    setProjectId(undefined);
    setClientId(undefined);
    setEventType(undefined);
    setStatusFilter(undefined);
    setSearchQuery("");
    setSearchParams({ view: searchParams.get('view') || 'month' });
  };
  
  // Handlers de eventos
  const handleEventClick = (event: EventManagerEvent) => {
    // Convertir de EventManagerEvent a formato original para el panel
    const originalEvent = rawEvents?.find(e => e.id === event.id);
    if (originalEvent) {
      setSelectedEvent(event);
    }
  };
  
  const handleEditEvent = () => {
    const originalEvent = rawEvents?.find(e => e.id === selectedEvent?.id);
    if (originalEvent) {
      setEditingEvent(originalEvent);
      setShowCreateDialog(true);
    }
  };
  
  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };
  
  const handleCreateDialogClose = () => {
    setShowCreateDialog(false);
    setEditingEvent(null);
  };
  
  // Título dinámico según vista (FASE 3)
  const getViewTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    } else if (view === "week") {
      return `Semana del ${currentDate.toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;
    } else if (view === "day") {
      return currentDate.toLocaleDateString("es-MX", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return "Todos los eventos";
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header Mejorado (FASE 3, 7) */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Título y navegación temporal */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h2 className="text-xl font-semibold sm:text-2xl capitalize">
                {getViewTitle()}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("prev")}
                  className="h-8 w-8"
                  disabled={view === "list"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} disabled={view === "list"}>
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("next")}
                  className="h-8 w-8"
                  disabled={view === "list"}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Selector de vista y botón crear */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <CalendarViewSelector view={view} onViewChange={handleViewChange} />
              <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Evento
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Layout Responsive (FASE 7) */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Filtros y Búsqueda (25% en desktop) */}
          <div className="lg:col-span-1 space-y-4">
            {/* Búsqueda por texto (FASE 4) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Filtros Mejorados (FASE 6) */}
            <EventFiltersEnhanced
              projectId={projectId}
              clientId={clientId}
              eventType={eventType}
              statusFilter={statusFilter}
              entityTypeFilter={entityTypeFilter}
              onProjectChange={handleProjectChange}
              onClientChange={handleClientChange}
              onEventTypeChange={setEventType}
              onStatusFilterChange={setStatusFilter}
              onEntityTypeChange={setEntityTypeFilter}
              onClearFilters={handleClearFilters}
              resultsCount={filteredEvents.length}
              totalCount={events.length}
            />
          </div>
          
          {/* Área Principal: Vista de Calendario (75% en desktop) */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <>
                {view === "month" && (
                  <MonthView
                    currentDate={currentDate}
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    canDragEvent={(event) => true} // Validamos en handleDragStart
                  />
                )}
                
                {view === "week" && (
                  <WeekView
                    currentDate={currentDate}
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    canDragEvent={(event) => true}
                  />
                )}
                
                {view === "day" && (
                  <DayView
                    currentDate={currentDate}
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    canDragEvent={(event) => true}
                  />
                )}
                
                {view === "list" && (
                  <ListView
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Panel de Detalles (FASE 8) */}
      {selectedEvent && (
        <EventDetailsPanel
          event={rawEvents?.find(e => e.id === selectedEvent.id)!}
          onEdit={handleEditEvent}
          onClose={handleCloseDetails}
        />
      )}
      
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
