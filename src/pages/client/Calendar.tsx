import { useMyProjects, useClientCalendar } from "@/features/client/hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Clock, Download, MessageSquare, FileText, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Calendar() {
  const { currentProject } = useMyProjects();
  const projectId = currentProject?.id || null;
  const { data: events = [], loading, error, refetch } = useClientCalendar(projectId);
  const navigate = useNavigate();

  const downloadICS = (event: any) => {
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

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-20">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-2">
          <p className="text-foreground font-medium">Error al cargar eventos</p>
          <p className="text-sm text-muted-foreground">No se pudieron cargar los eventos del calendario</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Calendario</h1>
        <p className="text-sm text-muted-foreground">Tus citas y eventos del proyecto</p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center px-4">
          <CalendarIcon className="h-16 w-16 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">No hay eventos próximos</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Aún no tienes citas programadas. Mantente en contacto con tu equipo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={() => navigate('/client/chat')}
              variant="default"
              className="w-full sm:w-auto"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir chat
            </Button>
            <Button
              onClick={() => navigate('/client/documentos')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver documentos
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const startDate = parseISO(event.start_at);
            const endDate = parseISO(event.end_at);
            
            return (
              <div
                key={event.id}
                className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">
                      {event.title}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{format(startDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {format(startDate, "HH:mm", { locale: es })} - {format(endDate, "HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {event.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {event.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button
                      onClick={() => downloadICS(event)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Agregar a mi calendario
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
