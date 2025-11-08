import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarPlus, Calendar as CalendarIcon, Clock, MapPin, X, Download } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
  description?: string | null;
  location?: string | null;
  status: string;
  created_by: string;
}

interface ClientCalendarProps {
  projectId: string;
}

type RangeFilter = "today" | "7d" | "14d";

export function ClientCalendar({ projectId }: ClientCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("14d");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    desiredDate: "",
    notes: "",
  });

  useEffect(() => {
    loadEvents();
  }, [projectId, rangeFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);

      const filterDate = new Date();
      if (rangeFilter === '7d') {
        filterDate.setDate(filterDate.getDate() + 7);
      } else if (rangeFilter === '14d') {
        filterDate.setDate(filterDate.getDate() + 14);
      }
      
      const { data, error } = await supabase
        .from('v_client_events')
        .select('*')
        .eq('project_id', projectId)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', filterDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      setEvents(data || []);
    } catch (err) {
      console.error("Error loading events:", err);
      toast.error("Error al cargar los eventos");
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useRealtimeSubscription({
    table: 'project_events',
    filter: `project_id=eq.${projectId}`,
    event: '*',
    onInsert: loadEvents,
    onUpdate: loadEvents,
    onDelete: loadEvents,
  });

  const handleRequestAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes estar autenticado");
      return;
    }
    
    const { error } = await supabase
      .from('project_events')
      .insert([{
        project_id: projectId,
        title: `Solicitud: ${formData.title}`,
        description: formData.notes,
        notes: formData.notes,
        start_time: formData.desiredDate,
        end_time: new Date(new Date(formData.desiredDate).getTime() + 60 * 60 * 1000).toISOString(),
        created_by: user.id,
        status: 'propuesta' as const,
        visibilidad: 'cliente' as const,
      }]);

    if (error) {
      console.error(error);
      toast.error("Error al enviar solicitud");
      return;
    }

    toast.success("Solicitud enviada");
    setIsRequestDialogOpen(false);
    setFormData({ title: "", desiredDate: "", notes: "" });
  };

  const downloadICS = (event: CalendarEvent) => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Client Portal//Calendar//ES',
      'BEGIN:VEVENT',
      `UID:${event.id}@clientportal`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.notes || event.description || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    link.click();
    
    toast.success("Evento descargado");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Sticky Header with Range Filter */}
      <div className="sticky top-0 z-10 bg-background pb-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Próximas citas</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={rangeFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setRangeFilter("today")}
          >
            Hoy
          </Button>
          <Button
            variant={rangeFilter === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setRangeFilter("7d")}
          >
            7 días
          </Button>
          <Button
            variant={rangeFilter === "14d" ? "default" : "outline"}
            size="sm"
            onClick={() => setRangeFilter("14d")}
          >
            14 días
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No hay eventos próximos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Toca el botón + para solicitar una cita
            </p>
          </div>
        ) : (
          events.map((event) => {
            const isRequest = event.title.startsWith("Solicitud:");
            
            return (
              <div
                key={event.id}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-base mb-1 truncate">
                      {event.title}
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {format(new Date(event.start_time), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                    </p>
                  </div>
                  {isRequest && (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setIsRequestDialogOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center z-20"
        aria-label="Solicitar cita"
      >
        <CalendarPlus className="h-6 w-6" />
      </button>

      {/* Request Appointment Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar cita</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestAppointment} className="space-y-4">
            <div>
              <Label htmlFor="request-title">Motivo *</Label>
              <Input
                id="request-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Revisión de avance"
                required
              />
            </div>
            <div>
              <Label htmlFor="desired-date">Fecha y hora sugerida *</Label>
              <Input
                id="desired-date"
                type="datetime-local"
                value={formData.desiredDate}
                onChange={(e) => setFormData({ ...formData, desiredDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="request-notes">Notas adicionales</Label>
              <Textarea
                id="request-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional sobre la cita"
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Enviar solicitud
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Detail Drawer */}
      <Drawer open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <div className="flex items-start justify-between">
              <DrawerTitle className="text-lg pr-8">{selectedEvent?.title}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          
          {selectedEvent && (
            <div className="p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      {format(new Date(selectedEvent.start_time), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(selectedEvent.start_time), "HH:mm", { locale: es })} - {format(new Date(selectedEvent.end_time), "HH:mm", { locale: es })}
                    </span>
                  </div>
                </div>

                {(selectedEvent.notes || selectedEvent.description) && (
                  <div>
                    <h4 className="font-medium mb-2">Notas</h4>
                    <p className="text-sm text-muted-foreground">{selectedEvent.notes || selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.location && (
                  <div>
                    <h4 className="font-medium mb-2">Ubicación</h4>
                    <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      downloadICS(selectedEvent);
                      setSelectedEvent(null);
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Agregar a mi calendario
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}