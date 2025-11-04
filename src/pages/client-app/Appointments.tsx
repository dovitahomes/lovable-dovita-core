import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppointmentCalendar from '@/components/client-app/AppointmentCalendar';
import AppointmentCard from '@/components/client-app/AppointmentCard';
import AppointmentModal from '@/components/client-app/AppointmentModal';
import { mockAppointments } from '@/lib/client-data';
import { useProject } from '@/contexts/ProjectContext';
import { Plus } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Appointments() {
  const { currentProject } = useProject();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter appointments by current project
  const projectAppointments = mockAppointments.filter(apt => apt.projectId === currentProject?.id);

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
        onOpenChange={setIsModalOpen}
        onAppointmentCreated={() => {
          // Refresh appointments
        }}
      />
    </div>
  );
}
