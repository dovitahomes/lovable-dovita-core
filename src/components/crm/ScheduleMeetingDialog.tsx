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
import { Loader2, CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadEmail: string;
  projectId?: string;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00"
];

const MEETING_TYPES = [
  { value: 'meeting', label: 'Reunión Virtual' },
  { value: 'site_visit', label: 'Visita a Terreno' },
  { value: 'office', label: 'Reunión en Oficina' },
  { value: 'call', label: 'Llamada Telefónica' },
];

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadEmail,
  projectId,
}: ScheduleMeetingDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [meetingType, setMeetingType] = useState("meeting");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const scheduleMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!date) {
        throw new Error("Por favor selecciona una fecha");
      }

      // Combinar fecha y hora
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);

      // Fecha fin (1 hora después)
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      // Obtener usuario de forma robusta
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        throw new Error('Usuario no autenticado');
      }
      const userId = user.id;

      // 1. Crear evento en project_events (siempre, detectando el tipo de entidad)
      const eventData = {
        title: `Reunión con ${leadName}`,
        description: notes.trim() || `Reunión agendada con lead ${leadName}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: meetingType === 'site_visit' ? 'site_visit' : 'meeting',
        location: location.trim() || null,
        visibility: 'team' as const, // Solo colaboradores ven esta cita del lead
        status: 'propuesta',
        created_by: userId,
        // Lógica condicional para determinar entidad
        ...(projectId 
          ? { project_id: projectId, entity_type: 'project' as const }
          : { lead_id: leadId, entity_type: 'lead' as const }
        ),
      };

      // 🔍 LOGGING: Datos antes de inserción
      console.log('🔍 Intentando insertar evento:', JSON.stringify(eventData, null, 2));
      console.log('🔍 User ID:', userId);
      console.log('🔍 Lead ID:', leadId);
      console.log('🔍 Project ID:', projectId);

      // ✅ Validación pre-inserción
      if (eventData.entity_type === 'lead' && !eventData.lead_id) {
        throw new Error('lead_id es requerido para eventos de tipo lead');
      }
      if (eventData.entity_type === 'lead' && eventData.created_by !== userId) {
        throw new Error('created_by debe coincidir con el usuario actual');
      }

      const { data: insertedEvent, error: eventError } = await supabase
        .from('project_events')
        .insert(eventData)
        .select()
        .single();

      if (eventError) {
        console.error('❌ Error insertando evento:', {
          error: eventError,
          message: eventError.message,
          details: eventError.details,
          hint: eventError.hint,
          code: eventError.code,
          eventData
        });
        throw new Error(`Error al crear el evento: ${eventError.message}`);
      }

      console.log('✅ Evento creado exitosamente:', {
        id: insertedEvent.id,
        entity_type: insertedEvent.entity_type,
        lead_id: insertedEvent.lead_id,
        project_id: insertedEvent.project_id,
        title: insertedEvent.title
      });

      // 2. Crear tarea recordatorio
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          subject: `Reunión: ${leadName}`,
          description: `${MEETING_TYPES.find(t => t.value === meetingType)?.label || 'Reunión'} agendada.\n\nUbicación: ${location || 'Por definir'}\n\nNotas:\n${notes || 'Sin notas adicionales'}`,
          due_date: startTime.toISOString().split('T')[0],
          priority: 'alta',
          status: 'pendiente',
          related_to_type: 'lead',
          related_to_id: leadId,
          assigned_to: userId,
          created_by: userId,
        });

      if (taskError) throw taskError;

      // 3. Registrar actividad en CRM
      const { error: activityError } = await supabase
        .from('crm_activities')
        .insert({
          activity_type: 'meeting_held',
          entity_type: 'lead',
          entity_id: leadId,
          description: `Reunión agendada para ${format(startTime, "d 'de' MMMM 'a las' HH:mm", { locale: es })}`,
          metadata_json: {
            meeting_type: meetingType,
            scheduled_for: startTime.toISOString(),
            location: location.trim() || null,
            notes: notes.trim() || null,
          },
          performed_by: userId,
        });

      if (activityError) throw activityError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-events'] });
      toast.success("✅ Reunión agendada en calendario y tareas");
      
      // Reset form
      setDate(undefined);
      setTime("10:00");
      setMeetingType("meeting");
      setLocation("");
      setNotes("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error al agendar reunión: " + error.message);
    }
  });

  const handleSchedule = () => {
    scheduleMeetingMutation.mutate();
  };

  const handleCancel = () => {
    setDate(undefined);
    setTime("10:00");
    setMeetingType("meeting");
    setLocation("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Agendar Reunión - {leadName}
          </DialogTitle>
          <DialogDescription>
            Programa una reunión y se creará automáticamente un recordatorio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de reunión */}
          <div className="space-y-2">
            <Label>
              Tipo de reunión <span className="text-destructive">*</span>
            </Label>
            <Select value={meetingType} onValueChange={setMeetingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
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
                    {date ? format(date, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>
                Hora <span className="text-destructive">*</span>
              </Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {slot}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="h-3 w-3 inline mr-1" />
              Ubicación
              <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Oficina Central, Zoom, Terreno del cliente..."
              maxLength={200}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="meeting-notes">
              Notas de la reunión
              <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
            </Label>
            <Textarea
              id="meeting-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agenda, temas a tratar, documentos necesarios..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/500
            </p>
          </div>

          {/* Info */}
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-900 dark:text-blue-100">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Se creará automáticamente:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Evento en tu calendario (duración: 1 hora)</li>
                  <li>Tarea recordatorio de prioridad alta</li>
                  <li>Registro en timeline del lead</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={scheduleMeetingMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSchedule}
            disabled={scheduleMeetingMutation.isPending || !date}
          >
            {scheduleMeetingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Agendar Reunión
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
