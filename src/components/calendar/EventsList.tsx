import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: string;
  visibility: string; // Cambiar a string para aceptar cualquier valor de BD
  status: string;
  location?: string;
  projects?: {
    project_name?: string;
    clients?: {
      name: string;
    };
  };
  profiles?: {
    full_name: string;
  } | null;
}

interface EventsListProps {
  events: Event[];
  selectedEventId?: string;
  onEventClick: (event: Event) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: "Reunión",
  site_visit: "Visita de obra",
  review: "Revisión",
  deadline: "Fecha límite",
  other: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  propuesta: "Propuesta",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  propuesta: "secondary",
  aceptada: "default",
  rechazada: "destructive",
  cancelada: "outline",
};

export function EventsList({ events, selectedEventId, onEventClick }: EventsListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay eventos para mostrar</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {events.map((event) => {
        const isSelected = event.id === selectedEventId;
        const projectName = event.projects?.project_name || "Sin proyecto";
        const clientName = event.projects?.clients?.name || "Sin cliente";
        const createdBy = event.profiles?.full_name || "Desconocido";
        
        return (
          <Card
            key={event.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onEventClick(event)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-1 truncate">
                    {event.title}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {projectName} • {clientName}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {event.visibility === 'client' ? (
                    <Badge variant="default" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Cliente
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Equipo
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(event.start_time), "dd MMM yyyy HH:mm", { locale: es })}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <User className="h-4 w-4" />
                <span>Creado por: {createdBy}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANTS[event.status] || "secondary"}>
                  {STATUS_LABELS[event.status] || event.status}
                </Badge>
                <Badge variant="outline">
                  {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                </Badge>
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {event.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
