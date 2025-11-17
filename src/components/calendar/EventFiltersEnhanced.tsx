// FASE 6: Filtros Mejorados
// Filtros con badges activos, contador de resultados, y filtro por status

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_TYPE_LABELS, STATUS_LABELS } from "@/lib/calendar/eventAdapter";

interface EventFiltersEnhancedProps {
  projectId?: string;
  clientId?: string;
  eventType?: string;
  entityTypeFilter?: string; // Nuevo filtro
  statusFilter?: string;
  onProjectChange: (value: string | undefined) => void;
  onClientChange: (value: string | undefined) => void;
  onEventTypeChange: (value: string | undefined) => void;
  onEntityTypeChange: (value: string | undefined) => void; // Nuevo handler
  onStatusFilterChange: (value: string | undefined) => void;
  onClearFilters: () => void;
  resultsCount: number;
  totalCount: number;
}

export function EventFiltersEnhanced({
  projectId,
  clientId,
  eventType,
  entityTypeFilter, // Nuevo prop
  statusFilter,
  onProjectChange,
  onClientChange,
  onEventTypeChange,
  onEntityTypeChange, // Nuevo handler
  onStatusFilterChange,
  onClearFilters,
  resultsCount,
  totalCount,
}: EventFiltersEnhancedProps) {
  // Cargar proyectos disponibles
  const { data: projects } = useQuery({
    queryKey: ['my-projects-filter'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id);
      
      const isAdmin = userRoles?.some(r => r.role_name === 'admin');
      
      let query = supabase
        .from('projects')
        .select('id, project_name, status, client_id, clients(name)')
        .order('project_name');
      
      if (!isAdmin) {
        const { data: myProjects } = await supabase
          .from('project_collaborators')
          .select('project_id')
          .eq('user_id', user.id);
        
        const projectIds = myProjects?.map(p => p.project_id) || [];
        if (projectIds.length > 0) {
          query = query.in('id', projectIds);
        } else {
          return [];
        }
      }
      
      const { data } = await query;
      return data || [];
    },
  });
  
  // Cargar clientes únicos de los proyectos disponibles
  const { data: clients } = useQuery({
    queryKey: ['clients-filter', projects],
    queryFn: async () => {
      if (!projects || projects.length === 0) return [];
      
      const uniqueClients = new Map();
      projects.forEach(project => {
        if (project.clients && project.client_id) {
          uniqueClients.set(project.client_id, (project.clients as any).name);
        }
      });
      
      return Array.from(uniqueClients.entries()).map(([id, name]) => ({
        id,
        name
      }));
    },
    enabled: !!projects,
  });
  
  const hasActiveFilters = !!(projectId || clientId || eventType || entityTypeFilter || statusFilter);
  
  // Encontrar nombres para los badges
  const projectName = projects?.find(p => p.id === projectId)?.project_name;
  const clientName = clients?.find(c => c.id === clientId)?.name;
  const eventTypeLabel = eventType ? EVENT_TYPE_LABELS[eventType as keyof typeof EVENT_TYPE_LABELS] : undefined;
  const statusLabel = statusFilter ? STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS] : undefined;
  const entityTypeLabel = entityTypeFilter === 'project' ? 'Proyectos' : entityTypeFilter === 'lead' ? 'Leads' : entityTypeFilter === 'personal' ? 'Personales' : undefined;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro por Proyecto */}
          <div>
            <Label htmlFor="filter-project">Proyecto</Label>
            <Select value={projectId || "all"} onValueChange={(v) => onProjectChange(v === "all" ? undefined : v)}>
              <SelectTrigger id="filter-project">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name || `Proyecto ${project.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro por Cliente */}
          <div>
            <Label htmlFor="filter-client">Cliente</Label>
            <Select value={clientId || "all"} onValueChange={(v) => onClientChange(v === "all" ? undefined : v)}>
              <SelectTrigger id="filter-client">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients?.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro por Tipo de Evento */}
          <div>
            <Label htmlFor="filter-type">Tipo de evento</Label>
            <Select value={eventType || "all"} onValueChange={(v) => onEventTypeChange(v === "all" ? undefined : v)}>
              <SelectTrigger id="filter-type">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro por Status (NUEVO) */}
          <div>
            <Label htmlFor="filter-status">Estado</Label>
            <Select value={statusFilter || "all"} onValueChange={(v) => onStatusFilterChange(v === "all" ? undefined : v)}>
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtro por Tipo de Entidad (NUEVO - Calendario Universal) */}
          <div>
            <Label htmlFor="filter-entity-type">Tipo de Entidad</Label>
            <Select value={entityTypeFilter || "all"} onValueChange={(v) => onEntityTypeChange(v === "all" ? undefined : v)}>
              <SelectTrigger id="filter-entity-type">
                <SelectValue placeholder="Todos los eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                <SelectItem value="project">🏢 Proyectos</SelectItem>
                <SelectItem value="lead">👤 Leads</SelectItem>
                <SelectItem value="personal">📅 Personales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Badges de filtros activos */}
      {hasActiveFilters && (
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            
            {projectId && projectName && (
              <Badge variant="secondary" className="gap-1">
                Proyecto: {projectName}
                <button 
                  onClick={() => onProjectChange(undefined)}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {clientId && clientName && (
              <Badge variant="secondary" className="gap-1">
                Cliente: {clientName}
                <button 
                  onClick={() => onClientChange(undefined)}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {eventType && eventTypeLabel && (
              <Badge variant="secondary" className="gap-1">
                Tipo: {eventTypeLabel}
                <button 
                  onClick={() => onEventTypeChange(undefined)}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {statusFilter && statusLabel && (
              <Badge variant="secondary" className="gap-1">
                Estado: {statusLabel}
                <button 
                  onClick={() => onStatusFilterChange(undefined)}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {entityTypeFilter && entityTypeLabel && (
              <Badge variant="secondary" className="gap-1">
                Tipo: {entityTypeLabel}
                <button 
                  onClick={() => onEntityTypeChange(undefined)}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </Card>
      )}
      
      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground text-center">
        {resultsCount} eventos encontrados
        {hasActiveFilters && ` (de ${totalCount} totales)`}
      </div>
    </div>
  );
}
