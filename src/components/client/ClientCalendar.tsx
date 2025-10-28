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
import { CalendarPlus, Calendar as CalendarIcon, Clock, Users, X, Download } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  notes?: string | null;
  attendees?: Array<{ user_id: string; name?: string }> | null;
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
    desired_start_at: "",
    notes: "",
  });

  useEffect(() => {
    loadEvents();
  }, [projectId, rangeFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);

      const now = new Date();
      let endDate: Date;
      
      switch (rangeFilter) {
        case "today":
          endDate = addDays(now, 1);
          break;
        case "7d":
          endDate = addDays(now, 7);
          break;
        case "14d":
          endDate = addDays(now, 14);
          break;
      }

      const { data, error: fetchError } = await supabase
        .from("calendar_events")
        .select("id, title, start_at, end_at, notes, attendees, created_by")
        .eq("project_id", projectId)
        .gte("start_at", now.toISOString())
        .lte("start_at", endDate.toISOString())
        .order("start_at", { ascending: true });

      if (fetchError) throw fetchError;
      
      // Map the data to ensure proper typing for attendees
      const mappedEvents: CalendarEvent[] = (data || []).map(event => ({
        ...event,
        attendees: event.attendees as Array<{ user_id: string; name?: string }> | null,
      }));
      
      setEvents(mappedEvents);
    } catch (err) {
      console.error("Error loading events:", err);
      toast.error("Error al cargar los eventos");
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useRealtimeSubscription({
    table: "calendar_events",
    filter: `project_id=eq.${projectId}`,
    event: "*",
    onInsert: () => loadEvents(),
    onUpdate: () => loadEvents(),
    onDelete: () => loadEvents(),
    enabled: !!projectId,
  });

  const handleRequestAppointment = async () => {
    if (!formData.title || !formData.desired_start_at) {
      toast.error("El motivo y la fecha sugerida son obligatorios");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const startDate = new Date(formData.desired_start_at);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour default

      const { error } = await supabase.from("calendar_events").insert({
        project_id: projectId,
        title: `Solicitud: ${formData.title}`,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        notes: formData.notes || null,
        created_by: user.id,
        attendees: [{ user_id: user.id }],
      });

      if (error) throw error;

      toast.success("Solicitud enviada correctamente");
      setIsRequestDialogOpen(false);
      setFormData({ title: "", desired_start_at: "", notes: "" });
    } catch (err) {
      console.error("Error saving request:", err);
      toast.error("Error al enviar la solicitud");
    }
  };

  const downloadICS = (event: CalendarEvent) => {
    const startDate = new Date(event.start_at);
    const endDate = new Date(event.end_at);
    
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
      event.notes ? `DESCRIPTION:${event.notes.replace(/\n/g, '\\n')}` : '',
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

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
            const startDate = parseISO(event.start_at);
            const isRequest = event.title.startsWith("Solicitud:");
            
            return (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={cn(
                  "bg-card border rounded-xl p-4 shadow-sm hover:shadow-md",
                  "transition-all duration-200 active:scale-[0.98] cursor-pointer",
                  isRequest && "border-l-4 border-l-yellow-500"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground flex-1">{event.title}</h3>
                  {isRequest && (
                    <Badge variant="secondary" className="ml-2">
                      Pendiente
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(startDate, "d MMM yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{format(startDate, "HH:mm", { locale: es })}</span>
                  </div>
                </div>

                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1">
                      {event.attendees.slice(0, 3).map((attendee, idx) => (
                        <div
                          key={idx}
                          className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium"
                        >
                          {getInitials(attendee.name)}
                        </div>
                      ))}
                      {event.attendees.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
                          +{event.attendees.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="request-title">Motivo *</Label>
              <Input
                id="request-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Revisión de avance"
              />
            </div>
            <div>
              <Label htmlFor="desired-date">Fecha y hora sugerida *</Label>
              <Input
                id="desired-date"
                type="datetime-local"
                value={formData.desired_start_at}
                onChange={(e) => setFormData({ ...formData, desired_start_at: e.target.value })}
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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestAppointment}>
              Enviar solicitud
            </Button>
          </DialogFooter>
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
              {/* Date and Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-5 w-5" />
                  <span className="font-medium">
                    {format(parseISO(selectedEvent.start_at), "EEEE, d MMMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground ml-7">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(parseISO(selectedEvent.start_at), "HH:mm", { locale: es })} - {format(parseISO(selectedEvent.end_at), "HH:mm", { locale: es })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="pt-2 border-t">
                  <h4 className="font-medium mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedEvent.notes}
                  </p>
                </div>
              )}

              {/* Attendees */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <h4 className="font-medium">Asistentes</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.attendees.map((attendee, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-muted rounded-full px-3 py-1"
                      >
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                          {getInitials(attendee.name)}
                        </div>
                        <span className="text-sm">{attendee.name || "Usuario"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
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
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
