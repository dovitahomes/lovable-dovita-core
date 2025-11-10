import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, User, Eye, EyeOff, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { useDeleteEvent, useUpdateEvent } from "@/hooks/useMyCalendarEvents";
import { toast } from "sonner";

interface EventDetailsPanelProps {
  event: any;
  onEdit: () => void;
  onClose: () => void;
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

export function EventDetailsPanel({ event, onEdit, onClose }: EventDetailsPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  
  const projectName = event.projects?.project_name || "Sin proyecto";
  const clientName = event.projects?.clients?.name || "Sin cliente";
  const createdBy = event.profiles?.full_name || "Desconocido";
  
  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success("Evento eliminado correctamente");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el evento");
    }
  };
  
  const handleChangeStatus = async (newStatus: string) => {
    try {
      await updateEvent.mutateAsync({ id: event.id, status: newStatus });
      toast.success(`Evento marcado como ${STATUS_LABELS[newStatus]}`);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el estado");
    }
  };
  
  const handleToggleVisibility = async () => {
    const newVisibility = event.visibility === 'client' ? 'team' : 'client';
    try {
      await updateEvent.mutateAsync({ id: event.id, visibility: newVisibility });
      toast.success(`Visibilidad cambiada a ${newVisibility === 'client' ? 'Cliente' : 'Solo equipo'}`);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar la visibilidad");
    }
  };
  
  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Proyecto y Cliente */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Proyecto</p>
            <p className="text-base">{projectName}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Cliente</p>
            <p className="text-base">{clientName}</p>
          </div>
          
          <Separator />
          
          {/* Descripción */}
          {event.description && (
            <>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                <p className="text-base whitespace-pre-wrap">{event.description}</p>
              </div>
              <Separator />
            </>
          )}
          
          {/* Fechas */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Fecha y hora</p>
            <div className="flex items-start gap-2 text-sm mb-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Inicio:</p>
                <p>{format(new Date(event.start_time), "dd MMMM yyyy 'a las' HH:mm", { locale: es })}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Fin:</p>
                <p>{format(new Date(event.end_time), "dd MMMM yyyy 'a las' HH:mm", { locale: es })}</p>
              </div>
            </div>
          </div>
          
          {/* Ubicación */}
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                <p className="text-sm">{event.location}</p>
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <Badge variant="outline">
                {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant={STATUS_VARIANTS[event.status] || "secondary"}>
                {STATUS_LABELS[event.status] || event.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Visibilidad</span>
              {event.visibility === 'client' ? (
                <Badge variant="default" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Cliente
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <EyeOff className="h-3 w-3" />
                  Solo equipo
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <User className="h-4 w-4" />
              <span>Creado por: {createdBy}</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Acciones */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Acciones</p>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="w-full justify-start"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar evento
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleVisibility}
                className="w-full justify-start"
                disabled={updateEvent.isPending}
              >
                {event.visibility === 'client' ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar del cliente
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar al cliente
                  </>
                )}
              </Button>
              
              {event.status === 'propuesta' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus('aceptada')}
                    className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                    disabled={updateEvent.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceptar evento
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus('rechazada')}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={updateEvent.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar evento
                  </Button>
                </>
              )}
              
              {event.status === 'aceptada' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChangeStatus('cancelada')}
                  className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  disabled={updateEvent.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar evento
                </Button>
              )}
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar evento
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El evento "{event.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
