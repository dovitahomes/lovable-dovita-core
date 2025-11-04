import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { mockAppointments } from "@/lib/client-data";
import { useProject } from "@/contexts/ProjectContext";
import { Plus, Clock, MapPin, User } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export default function AppointmentsDesktop() {
  const { currentProject } = useProject();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter appointments by current project
  const projectAppointments = mockAppointments.filter(apt => apt.projectId === currentProject?.id);

  // Get dates with appointments
  const appointmentDates = projectAppointments.map(apt => new Date(apt.date));

  // Filter and sort appointments for selected date
  const appointmentsOnSelectedDate = projectAppointments
    .filter(apt => isSameDay(new Date(apt.date), selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Citas y Reuniones</h1>
          <p className="text-muted-foreground">Gestiona tus citas con el equipo</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md border"
              modifiers={{
                booked: appointmentDates,
              }}
              modifiersClassNames={{
                booked: "bg-primary/20 font-bold",
              }}
            />
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Próximas citas</p>
              <p className="text-2xl font-bold">{projectAppointments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Citas para {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsOnSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {appointmentsOnSelectedDate.map((appointment) => (
                  <Card key={appointment.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{appointment.type}</h3>
                            <Badge className="mt-1">{appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}</Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time} - {appointment.duration} min</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.location}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground mb-1">Con: {appointment.teamMember.name}</p>
                            <p className="text-xs text-muted-foreground">{appointment.notes}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay citas para este día</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Agendar Cita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
