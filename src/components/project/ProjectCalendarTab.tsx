import { useState } from 'react';
import { useProjectEvents, useCreateEvent, useUpdateEventStatus, useDeleteEvent } from '@/hooks/useProjectEvents';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Trash2 } from 'lucide-react';
import { format, addMonths, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectCalendarTabProps {
  projectId: string;
}

const statusColors = {
  propuesta: 'bg-amber-500',
  aceptada: 'bg-green-500',
  rechazada: 'bg-red-500',
  cancelada: 'bg-gray-500',
};

const statusLabels = {
  propuesta: 'Propuesta',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export default function ProjectCalendarTab({ projectId }: ProjectCalendarTabProps) {
  const { data: events, isLoading } = useProjectEvents(projectId);
  const createEvent = useCreateEvent();
  const updateStatus = useUpdateEventStatus();
  const deleteEvent = useDeleteEvent();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    status: 'propuesta' as const,
  });
  
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };
  
  const handleCreateEvent = async () => {
    if (!formData.title || !formData.start_time || !formData.end_time) {
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await createEvent.mutateAsync({
      project_id: projectId,
      created_by: user.id,
      title: formData.title,
      description: formData.description || null,
      start_time: formData.start_time,
      end_time: formData.end_time,
      status: formData.status,
    });
    
    setDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      status: 'propuesta',
    });
  };
  
  // Get all dates that have events
  const eventDates = events?.map(evt => new Date(evt.start_time)) || [];
  
  // Filter events for selected date
  const eventsForSelectedDate = selectedDate
    ? events?.filter(evt => isSameDay(new Date(evt.start_time), selectedDate)) || []
    : [];
  
  // Sort events by start time
  const sortedEvents = [...eventsForSelectedDate].sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Calendario de Citas</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Cita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Revisión de avance"
                />
              </div>
              
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles de la cita"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha y hora inicio</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Fecha y hora fin</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateEvent}
                disabled={!formData.title || !formData.start_time || !formData.end_time || createEvent.isPending}
              >
                {createEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <h2 className="text-lg font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-lg"
                modifiers={{
                  hasEvent: eventDates,
                }}
                modifiersClassNames={{
                  hasEvent: 'has-appointment',
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Events List */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {selectedDate ? (
              <>Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}</>
            ) : (
              'Todas las Citas'
            )}
          </h3>
          
          {sortedEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay citas programadas para este día
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge className={`${statusColors[event.status]} mt-1`}>
                            {statusLabels[event.status]}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEvent.mutate({ id: event.id, projectId })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                          </span>
                        </div>
                        
                        {event.created_by_name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Creado por: {event.created_by_name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: event.id, status: 'aceptada', projectId })}
                          disabled={event.status === 'aceptada'}
                        >
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: event.id, status: 'rechazada', projectId })}
                          disabled={event.status === 'rechazada'}
                        >
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus.mutate({ id: event.id, status: 'cancelada', projectId })}
                          disabled={event.status === 'cancelada'}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
