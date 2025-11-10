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
  const [projectId, setProjectId] = useState(defaultProjectId || "");
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
    
    if (open) {
      loadProjects();
    }
  }, [open]);
  
  // Pre-cargar datos si es modo edición
  useEffect(() => {
    if (event && open) {
      setProjectId(event.project_id);
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
      if (defaultProjectId) {
        setProjectId(defaultProjectId);
      } else {
        setProjectId("");
      }
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
    
    // Validaciones
    if (!projectId) {
      toast.error("Selecciona un proyecto");
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
    
    const eventData = {
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: startTime,
      end_time: endTime,
      event_type: eventType,
      visibility,
      location: location.trim() || undefined,
      status,
    };
    
    try {
      if (event) {
        await updateEvent.mutateAsync({ id: event.id, ...eventData });
        toast.success("Evento actualizado correctamente");
      } else {
        await createEvent.mutateAsync(eventData);
        toast.success("Evento creado correctamente");
      }
      onOpenChange(false);
    } catch (error: any) {
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
          {/* Proyecto */}
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
          
          {/* Cliente (read-only, auto-cargado) */}
          {clientName && (
            <div>
              <Label>Cliente</Label>
              <Input value={clientName} disabled className="bg-muted" />
            </div>
          )}
          
          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reunión de seguimiento"
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
          
          {/* Visibilidad */}
          <div>
            <Label>Visibilidad *</Label>
            <RadioGroup value={visibility} onValueChange={(v: any) => setVisibility(v)} disabled={isPending}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="visibility-client" />
                <Label htmlFor="visibility-client" className="font-normal cursor-pointer">
                  Cliente (el cliente verá esta cita en su Client App)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="team" id="visibility-team" />
                <Label htmlFor="visibility-team" className="font-normal cursor-pointer">
                  Solo equipo (visible solo para colaboradores)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
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
