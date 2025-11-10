import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EventFiltersProps {
  projectId?: string;
  clientId?: string;
  eventType?: string;
  onProjectChange: (value: string | undefined) => void;
  onClientChange: (value: string | undefined) => void;
  onEventTypeChange: (value: string | undefined) => void;
  onClearFilters: () => void;
}

const EVENT_TYPES = [
  { value: 'meeting', label: 'Reunión' },
  { value: 'site_visit', label: 'Visita de obra' },
  { value: 'review', label: 'Revisión' },
  { value: 'deadline', label: 'Fecha límite' },
  { value: 'other', label: 'Otro' },
];

export function EventFilters({
  projectId,
  clientId,
  eventType,
  onProjectChange,
  onClientChange,
  onEventTypeChange,
  onClearFilters
}: EventFiltersProps) {
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
  
  const hasActiveFilters = !!(projectId || clientId || eventType);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
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
              {EVENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
