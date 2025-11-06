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
import { useProject } from '@/contexts/ProjectContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [appointmentType, setAppointmentType] = useState<string>(appointment?.type || '');
  const [teamMemberId, setTeamMemberId] = useState<string>(appointment?.teamMember.id?.toString() || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointment?.date ? new Date(appointment.date) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(appointment?.time || '');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [isVirtual, setIsVirtual] = useState(appointment?.isVirtual || false);

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

    // Mock creation/update
    if (mode === 'edit') {
      toast.success('Cita actualizada exitosamente', {
        description: `Los cambios en tu cita de ${appointmentType} han sido guardados.`
      });
    } else {
      toast.success('Cita agendada exitosamente', {
        description: `Tu cita para ${appointmentType} ha sido registrada. Recibirás una confirmación pronto.`
      });
    }

    // Reset form
    setAppointmentType('');
    setTeamMemberId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setIsVirtual(false);

    onOpenChange(false);
    onAppointmentCreated?.();
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary/90 text-primary">
            {mode === 'edit' ? 'Guardar Cambios' : 'Agendar Cita'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
