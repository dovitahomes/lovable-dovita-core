import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import TimePicker from './TimePicker';
import { appointmentTypes } from '@/lib/client-data';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/app/auth/AuthProvider';

interface Appointment {
  id: number;
  type: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  teamMember: {
    id?: number;
    name: string;
    role: string;
    avatar: string;
  };
  location: string;
  isVirtual: boolean;
  notes?: string;
}

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentCreated?: () => void;
  appointment?: Appointment;
  mode?: 'create' | 'edit';
}

export default function AppointmentModal({ 
  open, 
  onOpenChange, 
  onAppointmentCreated,
  appointment,
  mode = 'create'
}: AppointmentModalProps) {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [appointmentType, setAppointmentType] = useState<string>(appointment?.type || '');
  const [teamMemberId, setTeamMemberId] = useState<string>(appointment?.teamMember.id?.toString() || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointment?.date ? new Date(appointment.date) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(appointment?.time || '');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [isVirtual, setIsVirtual] = useState(appointment?.isVirtual || false);

  // Mutation para crear solicitud de cita
  const createAppointmentMutation = useMutation({
    mutationFn: async (eventData: {
      project_id: string;
      title: string;
      description: string | null;
      start_time: string;
      end_time: string;
      event_type: string;
      visibility: string;
      status: string;
      location: string | null;
      created_by: string;
    }) => {
      const { error } = await supabase
        .from('project_events')
        .insert(eventData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['client-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      
      toast.success('Solicitud de cita enviada', {
        description: 'Tu solicitud ha sido registrada. El equipo te confirmará pronto.'
      });
      
      // Reset form
      setAppointmentType('');
      setTeamMemberId('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setNotes('');
      setIsVirtual(false);
      
      onOpenChange(false);
      onAppointmentCreated?.();
    },
    onError: (error: Error) => {
      toast.error('Error al solicitar cita', {
        description: error.message || 'No se pudo enviar tu solicitud. Intenta nuevamente.'
      });
    }
  });

  // Update form when appointment changes (for edit mode)
  useEffect(() => {
    if (appointment && mode === 'edit') {
      setAppointmentType(appointment.type);
      setTeamMemberId(appointment.teamMember.id?.toString() || '');
      setSelectedDate(new Date(appointment.date));
      setSelectedTime(appointment.time);
      setNotes(appointment.notes || '');
      setIsVirtual(appointment.isVirtual);
    } else if (mode === 'create') {
      // Reset form for new appointment
      setAppointmentType('');
      setTeamMemberId('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setNotes('');
      setIsVirtual(false);
    }
  }, [appointment, mode]);

  const handleSubmit = () => {
    // Validation
    if (!appointmentType || !teamMemberId || !selectedDate || !selectedTime) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (!currentProject?.id || !user?.id) {
      toast.error('No se pudo obtener información del proyecto o usuario');
      return;
    }

    // Construir fecha y hora de inicio
    const [hours, minutes] = selectedTime.split(':');
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calcular fecha y hora de fin (1 hora por defecto)
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);

    // Mapear tipo de cita a event_type
    const eventTypeMap: Record<string, string> = {
      'Revisión de Diseño': 'review',
      'Visita a Obra': 'site_visit',
      'Reunión de Avance': 'meeting',
      'Presentación de Propuesta': 'review',
      'Entrega de Documentos': 'other',
    };

    const eventData = {
      project_id: currentProject.id,
      title: `Solicitud: ${appointmentType}`,
      description: notes || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      event_type: eventTypeMap[appointmentType] || 'meeting',
      visibility: 'client',
      status: 'propuesta',
      location: isVirtual ? 'Virtual' : null,
      created_by: user.id,
    };

    createAppointmentMutation.mutate(eventData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar Cita' : 'Agendar Nueva Cita'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Cita *</Label>
            <Select value={appointmentType} onValueChange={setAppointmentType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona el tipo de cita" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Member */}
          <div className="space-y-2">
            <Label htmlFor="team">Miembro del Equipo *</Label>
            <Select value={teamMemberId} onValueChange={setTeamMemberId}>
              <SelectTrigger id="team">
                <SelectValue placeholder="Selecciona quién te atenderá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-semibold text-primary">Todo el Equipo</span>
                </SelectItem>
                {currentProject?.team.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Fecha *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={es}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label>Hora *</Label>
            <TimePicker
              selectedTime={selectedTime}
              onTimeSelect={setSelectedTime}
              occupiedTimes={['10:00', '14:00']} // Mock occupied times
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Motivo</Label>
            <Textarea
              id="notes"
              placeholder="Describe el motivo de la cita o temas a tratar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Virtual Meeting Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="virtual">Reunión Virtual</Label>
              <p className="text-xs text-muted-foreground">
                Se generará un enlace de videollamada
              </p>
            </div>
            <Switch
              id="virtual"
              checked={isVirtual}
              onCheckedChange={setIsVirtual}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={createAppointmentMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-secondary hover:bg-secondary/90 text-primary"
            disabled={createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              mode === 'edit' ? 'Guardar Cambios' : 'Solicitar Cita'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
