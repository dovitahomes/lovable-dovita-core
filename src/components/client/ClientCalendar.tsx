import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarEvent {
  id: string;
  project_id: string | null;
  title: string;
  notes: string | null;
  start_at: string;
  end_at: string;
}

interface ClientCalendarProps {
  projectId: string;
}

export function ClientCalendar({ projectId }: ClientCalendarProps) {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);
    setError(null);
    try {
      const startDate = isMobile 
        ? startOfWeek(currentDate, { weekStartsOn: 0 })
        : startOfMonth(currentDate);
      const endDate = isMobile
        ? endOfWeek(currentDate, { weekStartsOn: 0 })
        : endOfMonth(currentDate);

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
      setError('Error al cargar eventos');
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    setFormData({
      title: "",
      notes: "",
      start_at: format(now, "yyyy-MM-dd'T'HH:mm"),
      end_at: format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
    });
    setShowEventDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    const startDate = new Date(formData.start_at);
    const endDate = new Date(formData.end_at);

    if (endDate <= startDate) {
      toast.error('La hora de fin debe ser posterior al inicio');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('calendar_events')
        .insert({
          project_id: projectId,
          title: formData.title,
          notes: formData.notes || null,
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          created_by: user.id,
        });
      
      if (error) throw error;
      toast.success('Cita agendada correctamente');
      setShowEventDialog(false);
      loadEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error('Error al agendar cita');
    }
  };

  const getDaysInPeriod = () => {
    if (isMobile) {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_at), day)
    );
  };

  const navigatePrevious = () => {
    setCurrentDate(isMobile ? subWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const navigateNext = () => {
    setCurrentDate(isMobile ? addWeeks(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const days = getDaysInPeriod();
  const weekDays = isMobile ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'] : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendario de Citas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-sm text-destructive text-center">{error}</p>
          <Button onClick={loadEvents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
          <CardTitle>Calendario de Citas</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={navigatePrevious}
                aria-label={isMobile ? "Semana anterior" : "Mes anterior"}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[200px] text-center font-semibold">
                {format(currentDate, isMobile ? "'Semana del' d MMM" : "MMMM yyyy", { locale: es })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={navigateNext}
                aria-label={isMobile ? "Siguiente semana" : "Siguiente mes"}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleOpenDialog} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nueva Cita
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" aria-hidden="true" />
              <h3 className="text-lg font-medium mb-2">Aún no hay eventos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agenda una cita con el equipo del proyecto
              </p>
              <Button onClick={handleOpenDialog} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agendar cita
              </Button>
            </div>
          ) : (
            <div className={`grid gap-2 ${isMobile ? 'grid-cols-7' : 'grid-cols-7'}`}>
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] p-2 border rounded-lg ${isToday ? 'border-primary border-2' : ''}`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded bg-primary/10 truncate"
                          title={event.title}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {!isMobile && (
                            <div className="text-muted-foreground">
                              {format(new Date(event.start_at), 'HH:mm')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md" aria-labelledby="dialog-title">
          <DialogHeader>
            <DialogTitle id="dialog-title">Nueva Cita</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-title">Título *</Label>
              <Input
                id="event-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nombre de la cita"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="event-start">Fecha y Hora de Inicio *</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="event-end">Fecha y Hora de Fin *</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="event-notes">Notas</Label>
              <Textarea
                id="event-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalles adicionales (opcional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent}>
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
