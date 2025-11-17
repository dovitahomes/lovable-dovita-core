// Dialog para crear eventos personales (sin proyecto ni lead)

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CalendarIcon, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreatePersonalEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: () => void;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00"
];

const EVENT_TYPES = [
  { value: 'meeting', label: 'Reunión' },
  { value: 'reminder', label: 'Recordatorio' },
  { value: 'task', label: 'Tarea' },
  { value: 'other', label: 'Otro' },
];

export function CreatePersonalEventDialog({
  open,
  onOpenChange,
  onEventCreated,
}: CreatePersonalEventDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [eventType, setEventType] = useState("reminder");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!date) {
        throw new Error("Por favor selecciona una fecha");
      }

      if (!title.trim()) {
        throw new Error("Por favor ingresa un título");
      }

      // Combinar fecha con horas
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const startDateTime = new Date(date);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const endDateTime = new Date(date);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Insertar evento personal
      const { error } = await supabase.from('project_events').insert({
        title: title.trim(),
        description: notes.trim() || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        event_type: eventType,
        location: location.trim() || null,
        visibility: 'team',
        status: 'propuesta',
        entity_type: 'personal',
        project_id: null,
        lead_id: null,
        created_by: userId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      toast.success("Evento personal creado correctamente");
      handleCancel();
      onEventCreated?.();
    },
    onError: (error: any) => {
      console.error('Error creating personal event:', error);
      toast.error(error.message || "Error al crear evento personal");
    },
  });

  const handleCreate = () => {
    createEventMutation.mutate();
  };

  const handleCancel = () => {
    setTitle("");
    setDate(undefined);
    setStartTime("10:00");
    setEndTime("11:00");
    setEventType("reminder");
    setLocation("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Crear Evento Personal
          </DialogTitle>
          <DialogDescription>
            Crea un evento personal que solo tú podrás ver en tu calendario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título del Evento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Revisión de documentos, Llamada importante..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Tipo de Evento */}
          <div className="space-y-2">
            <Label htmlFor="event-type">Tipo de Evento</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label>
              Fecha <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Hora inicio y fin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">
                <Clock className="inline h-4 w-4 mr-1" />
                Hora Inicio
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="start-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">
                <Clock className="inline h-4 w-4 mr-1" />
                Hora Fin
              </Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="end-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline h-4 w-4 mr-1" />
              Ubicación (opcional)
            </Label>
            <Input
              id="location"
              placeholder="Ej: Oficina, Casa, Virtual..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agrega detalles adicionales sobre este evento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={createEventMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={createEventMutation.isPending}>
            {createEventMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
