import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppointmentCalendar from '@/components/client-app/AppointmentCalendar';
import AppointmentCard from '@/components/client-app/AppointmentCard';
import AppointmentModal from '@/components/client-app/AppointmentModal';
import { mockAppointments } from '@/lib/client-app/client-data';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import PreviewBar from '@/components/client-app/PreviewBar';
import { Plus, Clock, MapPin, User, Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay, isFuture, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Appointments() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upcomingDialogOpen, setUpcomingDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<typeof mockAppointments[0] | undefined>();

  // Filter appointments by current project
  const projectAppointments = mockAppointments.filter(apt => apt.projectId === currentProject?.id);

  // Get upcoming appointments (future or today)
  const upcomingAppointments = projectAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      return isToday(aptDate) || isFuture(aptDate);
    })
    .sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

  // Get all dates that have appointments
  const appointmentDates = projectAppointments.map(apt => new Date(apt.date));

  // Filter appointments for selected date
  const appointmentsForSelectedDate = selectedDate
    ? projectAppointments.filter(apt => isSameDay(new Date(apt.date), selectedDate))
    : [];

  // Sort appointments by time
  const sortedAppointments = [...appointmentsForSelectedDate].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  return (
    <div style={{ paddingTop: isPreviewMode ? '48px' : '0' }}>
      <PreviewBar />
      <div className="h-full overflow-y-auto p-4 space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Citas con el Equipo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agenda y gestiona tus reuniones con el equipo de proyecto
        </p>
      </div>

      {/* Calendar */}
      <AppointmentCalendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        appointmentDates={appointmentDates}
      />

      {/* Upcoming Appointments Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Próximas citas</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setUpcomingDialogOpen(true)}
            >
              Ver todas
            </Button>
          </div>
          <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedDate ? (
              <>
                Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </>
            ) : (
              'Todas las Citas'
            )}
          </h2>
          <span className="text-sm text-muted-foreground">
            {sortedAppointments.length} {sortedAppointments.length === 1 ? 'cita' : 'citas'}
          </span>
        </div>

        {sortedAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay citas programadas para este día</p>
            <Button
              className="mt-4 bg-secondary hover:bg-secondary/90 text-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agendar Cita
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onViewDetails={() => {
                  // Handle view details
                }}
                onCancel={() => {
                  // Handle cancel
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-24 right-8 h-14 w-14 rounded-full shadow-lg bg-secondary hover:bg-secondary/90 text-primary"
        size="icon"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Appointment Modal */}
      <AppointmentModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingAppointment(undefined);
          }
        }}
        onAppointmentCreated={() => {
          // Refresh appointments
          setEditingAppointment(undefined);
        }}
        appointment={editingAppointment}
        mode={editingAppointment ? 'edit' : 'create'}
      />

      {/* Upcoming Appointments Dialog */}
      <Dialog open={upcomingDialogOpen} onOpenChange={setUpcomingDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Próximas Citas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <Card 
                  key={appointment.id} 
                  className="border-l-4 border-l-primary cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setEditingAppointment(appointment);
                    setIsModalOpen(true);
                    setUpcomingDialogOpen(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{appointment.type}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={appointment.status === 'confirmed' ? "text-xs" : "text-xs bg-[hsl(var(--dovita-yellow))]/20 text-[hsl(var(--dovita-yellow))]"}>
                              {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(appointment.date), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{appointment.time} - {appointment.duration} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="break-words">{appointment.location}</span>
                        </div>
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <User className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="mb-1">Con: {appointment.teamMember.name}</p>
                            <p className="text-xs">{appointment.notes}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay citas próximas programadas</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
