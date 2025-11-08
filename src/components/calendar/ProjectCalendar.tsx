import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { formatDateTime, fromUTCToMexico, toUTCFromMexico, nowInMexico, isSameDayInMexico } from "@/lib/datetime";

interface CalendarEvent {
  id: string;
  project_id: string | null;
  title: string;
  notes: string | null;
  start_at: string;
  end_at: string;
  attendees: any;
  created_by: string;
}

interface ProjectCalendarProps {
  projectId: string;
}

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    start_at: "",
    end_at: "",
  });

  useEffect(() => {
    loadEvents();
  }, [projectId, currentDate]);

  const loadEvents = async () => {
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('project_id', projectId)
        .gte('start_at', startDate.toISOString())
        .lte('start_at', endDate.toISOString())
        .order('start_at', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error loading events:', error);
      toast.error('Error al cargar eventos');
    }
  };

  const handleOpenDialog = (event?: CalendarEvent) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title,
        notes: event.notes || "",
        start_at: fromUTCToMexico(event.start_at),
        end_at: fromUTCToMexico(event.end_at),
      });
    } else {
      setSelectedEvent(null);
      const now = nowInMexico();
      const oneHourLater = new Date(now.getTime() + 3600000);
      setFormData({
        title: "",
        notes: "",
        start_at: format(now, "yyyy-MM-dd'T'HH:mm"),
        end_at: format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
      });
    }
    setShowEventDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const eventData = {
        project_id: projectId,
        title: formData.title,
        notes: formData.notes,
        start_at: toUTCFromMexico(formData.start_at),
        end_at: toUTCFromMexico(formData.end_at),
        created_by: user.id,
      };

      if (selectedEvent) {
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', selectedEvent.id);
        
        if (error) throw error;
        toast.success('Evento actualizado');
      } else {
        const { error } = await supabase
          .from('calendar_events')
          .insert(eventData);
        
        if (error) throw error;
        toast.success('Evento creado');
      }

      setShowEventDialog(false);
      loadEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error('Error al guardar evento');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', selectedEvent.id);

      if (error) throw error;
      
      toast.success('Evento eliminado');
      setShowEventDialog(false);
      loadEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error('Error al eliminar evento');
    }
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      isSameDayInMexico(event.start_at, day)
    );
  };

  const days = getDaysInMonth();
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
          <CardTitle>Calendario de Citas</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[200px] text-center font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Cita</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDayInMexico(new Date().toISOString(), day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-2 border rounded-lg ${
                    !isCurrentMonth ? 'bg-muted/50 text-muted-foreground' : ''
                  } ${isToday ? 'border-primary border-2' : ''}`}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => handleOpenDialog(event)}
                        className="text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 cursor-pointer truncate"
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-muted-foreground">
                          {formatDateTime(event.start_at, 'HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Editar Cita' : 'Nueva Cita'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nombre de la cita"
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalles adicionales"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Inicio *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                />
              </div>

              <div>
                <Label>Fin *</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedEvent && (
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
              >
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
