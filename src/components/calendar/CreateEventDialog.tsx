import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCreateEvent, useUpdateEvent } from "@/hooks/useMyCalendarEvents";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any; // Para modo edición
  defaultProjectId?: string;
}

export function CreateEventDialog({ open, onOpenChange, event, defaultProjectId }: CreateEventDialogProps) {
  const [entityType, setEntityType] = useState<'project' | 'lead' | 'personal'>('project');
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [leadId, setLeadId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [visibility, setVisibility] = useState<"client" | "team">("team");
  const [status, setStatus] = useState("propuesta");
  const [clientName, setClientName] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  
  // Cargar proyectos asignados al usuario
  useEffect(() => {
    const loadProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Verificar si es admin
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id);
      
      const isAdmin = userRoles?.some(r => r.role_name === 'admin');
      
      let query = supabase
        .from('projects')
        .select('id, project_name, status, clients(name)')
        .order('project_name');
      
      if (!isAdmin) {
        // Solo proyectos donde es colaborador
        const { data: myProjects } = await supabase
          .from('project_collaborators')
          .select('project_id')
          .eq('user_id', user.id);
        
        const projectIds = myProjects?.map(p => p.project_id) || [];
        if (projectIds.length > 0) {
          query = query.in('id', projectIds);
        } else {
          setProjects([]);
          return;
        }
      }
      
      const { data, error } = await query;
      if (!error && data) {
        setProjects(data);
      }
    };
    
    if (open && entityType === 'project') {
      loadProjects();
    }
  }, [open, entityType]);
  
  // Cargar leads disponibles para el usuario
  useEffect(() => {
    const loadLeads = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Leads que el usuario creó o está asignado (estados activos)
      const { data, error } = await supabase
        .from('leads')
        .select('id, nombre_completo, email, telefono, status')
        .in('status', ['nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion'])
        .order('nombre_completo');
      
      if (!error && data) {
        setLeads(data);
      }
    };
    
    if (open && entityType === 'lead') {
      loadLeads();
    }
  }, [open, entityType]);
  
  // Pre-cargar datos si es modo edición
  useEffect(() => {
    if (event && open) {
      setEntityType(event.entity_type || 'project');
      setProjectId(event.project_id || "");
      setLeadId(event.lead_id || "");
      setTitle(event.title);
      setDescription(event.description || "");
      setEventType(event.event_type || "meeting");
      setLocation(event.location || "");
      setStartTime(event.start_time);
      setEndTime(event.end_time);
      setVisibility(event.visibility || "team");
      setStatus(event.status || "propuesta");
    } else if (!event && open) {
      // Reset form
      setEntityType('project');
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      } else {
        setProjectId("");
      }
      setLeadId("");
      setTitle("");
      setDescription("");
      setEventType("meeting");
      setLocation("");
      setStartTime("");
      setEndTime("");
      setVisibility("team");
      setStatus("propuesta");
      setClientName("");
    }
  }, [event, open, defaultProjectId]);
  
  // Auto-cargar cliente cuando se selecciona proyecto
  useEffect(() => {
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project?.clients) {
        setClientName((project.clients as any).name);
      }
    } else {
      setClientName("");
    }
  }, [projectId, projects]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones según entityType
    if (entityType === 'project' && !projectId) {
      toast.error("Selecciona un proyecto");
      return;
    }
    
    if (entityType === 'lead' && !leadId) {
      toast.error("Selecciona un lead");
      return;
    }
    
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    
    if (title.length > 100) {
      toast.error("El título no puede exceder 100 caracteres");
      return;
    }
    
    if (!startTime) {
      toast.error("La fecha de inicio es obligatoria");
      return;
    }
    
    if (!endTime) {
      toast.error("La fecha de fin es obligatoria");
      return;
    }
    
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error("La fecha de fin debe ser posterior a la fecha de inicio");
      return;
    }
    
    // Construir eventData según tipo
    const eventData: any = {
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: startTime,
      end_time: endTime,
      event_type: eventType,
      location: location.trim() || undefined,
      status,
      entity_type: entityType,
    };
    
    // Agregar campos específicos según tipo
    if (entityType === 'project') {
      eventData.project_id = projectId;
      eventData.visibility = visibility;
    } else if (entityType === 'lead') {
      eventData.lead_id = leadId;
      eventData.visibility = 'team';
      eventData.project_id = null;
    } else {
      // Personal
      eventData.project_id = null;
      eventData.lead_id = null;
      eventData.visibility = 'team';
    }
    
    console.log('🚀 Enviando eventData:', eventData);
    
    try {
      if (event) {
        await updateEvent.mutateAsync({ id: event.id, ...eventData });
        toast.success("Evento actualizado correctamente");
      } else {
        await createEvent.mutateAsync(eventData);
        const successMsg = 
          entityType === 'personal' ? 'Evento personal creado' :
          entityType === 'lead' ? 'Reunión con lead agendada' :
          'Evento de proyecto creado';
        toast.success(successMsg);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Error guardando evento:', error);
      toast.error(error.message || "Error al guardar el evento");
    }
  };
  
  const isPending = createEvent.isPending || updateEvent.isPending;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Tipo de Evento (PRIMERO) */}
          <div>
            <Label className="text-base font-semibold">Tipo de Evento *</Label>
            <RadioGroup 
              value={entityType} 
              onValueChange={(v) => setEntityType(v as any)} 
              disabled={isPending}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="project" id="type-project" />
                <Label htmlFor="type-project" className="cursor-pointer flex-1">
                  <span className="block font-medium">Evento de Proyecto</span>
                  <span className="text-xs text-muted-foreground">Vinculado a un proyecto específico</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="lead" id="type-lead" />
                <Label htmlFor="type-lead" className="cursor-pointer flex-1">
                  <span className="block font-medium">Reunión con Lead</span>
                  <span className="text-xs text-muted-foreground">Reunión con prospecto</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="personal" id="type-personal" />
                <Label htmlFor="type-personal" className="cursor-pointer flex-1">
                  <span className="block font-medium">Evento Personal</span>
                  <span className="text-xs text-muted-foreground">Sin proyecto ni lead</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Selector de Proyecto (SOLO si entityType === 'project') */}
          {entityType === 'project' && (
            <div>
              <Label htmlFor="project">Proyecto *</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={isPending}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name || `Proyecto ${project.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Cliente (read-only, SOLO si entityType === 'project') */}
          {entityType === 'project' && clientName && (
            <div>
              <Label>Cliente</Label>
              <Input value={clientName} disabled className="bg-muted" />
            </div>
          )}

          {/* Selector de Lead (SOLO si entityType === 'lead') */}
          {entityType === 'lead' && (
            <div>
              <Label htmlFor="lead">Lead (Prospecto) *</Label>
              <Select value={leadId} onValueChange={setLeadId} disabled={isPending}>
                <SelectTrigger id="lead">
                  <SelectValue placeholder="Selecciona un lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      <div>
                        <div className="font-medium">{lead.nombre_completo}</div>
                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {leads.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No hay leads activos disponibles
                </p>
              )}
            </div>
          )}
          
          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                entityType === 'personal' 
                  ? "Mi evento personal" 
                  : entityType === 'lead' 
                  ? "Reunión con prospecto" 
                  : "Reunión de seguimiento"
              }
              maxLength={100}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/100 caracteres
            </p>
          </div>
          
          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del evento..."
              rows={3}
              disabled={isPending}
            />
          </div>
          
          {/* Tipo de Evento */}
          <div>
            <Label htmlFor="event-type">Tipo de Evento *</Label>
            <Select value={eventType} onValueChange={setEventType} disabled={isPending}>
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Reunión</SelectItem>
                <SelectItem value="site_visit">Visita de obra</SelectItem>
                <SelectItem value="review">Revisión</SelectItem>
                <SelectItem value="deadline">Fecha límite</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Ubicación */}
          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Zoom, dirección de obra, oficina..."
              disabled={isPending}
            />
          </div>
          
          {/* Fecha y hora inicio */}
          <div>
            <Label htmlFor="start-time">Fecha y hora de inicio *</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isPending}
            />
          </div>
          
          {/* Fecha y hora fin */}
          <div>
            <Label htmlFor="end-time">Fecha y hora de fin *</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isPending}
            />
          </div>
          
          {/* Visibilidad (SOLO si entityType === 'project') */}
          {entityType === 'project' && (
            <div>
              <Label>Visibilidad *</Label>
              <RadioGroup value={visibility} onValueChange={(v: any) => setVisibility(v)} disabled={isPending}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="team" id="visibility-team" />
                  <Label htmlFor="visibility-team" className="font-normal cursor-pointer">
                    Solo equipo (visible solo para colaboradores)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client" id="visibility-client" />
                  <Label htmlFor="visibility-client" className="font-normal cursor-pointer">
                    Cliente (el cliente verá esta cita en su Client App)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          {/* Status */}
          <div>
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={setStatus} disabled={isPending}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="propuesta">Propuesta</SelectItem>
                <SelectItem value="aceptada">Aceptada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {event ? "Actualizar" : "Crear"} Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
