import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import AppointmentCalendar from '@/components/client-app/AppointmentCalendar';
import AppointmentModal from '@/components/client-app/AppointmentModal';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useProjectAppointments, useDeleteAppointment, useUpdateAppointment } from '@/hooks/useProjectAppointments';
import { useEventNotifications } from '@/hooks/client-app/useEventNotifications';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Plus, Clock, User, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { ClientErrorState } from '@/components/client-app/ClientSkeletons';
import { useClientError } from '@/hooks/client-app/useClientError';
import { format, isSameDay, isFuture, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateTime } from '@/lib/datetime';
import { toast } from 'sonner';

export default function Appointments() {
  const { currentProject } = useProject();
  const { handleError } = useClientError();
  const { user } = useAuthSession();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upcomingDialogOpen, setUpcomingDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const { data: appointments, isLoading, error, refetch } = useProjectAppointments(currentProject?.id || null);
  const deleteAppointment = useDeleteAppointment();
  const updateAppointment = useUpdateAppointment();
  
  // Escuchar notificaciones en tiempo real de cambios en citas
  useEventNotifications(currentProject?.id);

  // Get upcoming appointments (future or today)
  const upcomingAppointments = (appointments || [])
    .filter(apt => {
      const aptDate = parseISO(apt.start_time);
      return isToday(aptDate) || isFuture(aptDate);
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  // Get all dates that have appointments
  const appointmentDates = (appointments || []).map(apt => parseISO(apt.start_time));

  // Filter appointments for selected date
  const appointmentsForSelectedDate = selectedDate
    ? (appointments || []).filter(apt => isSameDay(parseISO(apt.start_time), selectedDate))
    : [];

  // Sort appointments by time
  const sortedAppointments = [...appointmentsForSelectedDate].sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const handleCancelAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleAcceptAppointment = async (appointment: any) => {
    try {
      await updateAppointment.mutateAsync({
        id: appointment.id,
        status: 'aceptada'
      });
      toast.success('✅ Cita aceptada exitosamente');
    } catch (error) {
      toast.error('Error al aceptar la cita');
    }
  };

  const handleRejectAppointment = async (appointment: any) => {
    try {
      await updateAppointment.mutateAsync({
        id: appointment.id,
        status: 'rechazada'
      });
      toast.success('Cita rechazada');
    } catch (error) {
      toast.error('Error al rechazar la cita');
    }
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;
    
    try {
      await updateAppointment.mutateAsync({
        id: selectedAppointment.id,
        status: 'cancelada'
      });
      toast.success('Cita cancelada exitosamente');
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      toast.error('Error al cancelar la cita');
    }
  };

  if (error) {
    return (
      <div className="h-full flex flex-col pb-[130px]">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Citas con el Equipo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Agenda y gestiona tus reuniones con el equipo de proyecto
            </p>
          </div>
          <ClientErrorState
            title="Error al cargar citas"
            description="No pudimos obtener tus citas. Verifica tu conexión e intenta nuevamente."
            onRetry={() => refetch()}
            icon={CalendarIcon}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-[130px]">
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
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Próximas citas</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setUpcomingDialogOpen(true)}
            >
              Ver todas
            </Button>
          </div>
          <p className="text-3xl font-bold text-primary">{upcomingAppointments.length}</p>
          {upcomingAppointments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Próxima:</p>
              <p className="text-sm font-medium mt-1">
                {formatDateTime(upcomingAppointments[0].start_time, "d 'de' MMMM, HH:mm")}
              </p>
            </div>
          )}
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

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
            {sortedAppointments.map((appointment) => {
              const startDate = parseISO(appointment.start_time);
              const endDate = parseISO(appointment.end_time);
              const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
              
              return (
                <Card key={appointment.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{appointment.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDateTime(appointment.start_time, "EEEE d 'de' MMMM")}
                        </p>
                        <p className="text-sm font-medium text-primary mt-0.5">
                          {formatDateTime(appointment.start_time, 'HH:mm')}
                        </p>
                      </div>
                      <Badge className={
                        appointment.status === 'aceptada' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : appointment.status === 'rechazada'
                          ? 'bg-red-100 text-red-700 hover:bg-red-100'
                          : appointment.status === 'cancelada'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                      }>
                        {appointment.status === 'aceptada' ? 'Confirmada' : 
                         appointment.status === 'rechazada' ? 'Rechazada' :
                         appointment.status === 'cancelada' ? 'Cancelada' : 
                         'Pendiente de Confirmación'}
                      </Badge>
                    </div>

                    {appointment.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {appointment.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">{duration} min</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleViewDetails(appointment)}
                      >
                        Ver Detalles
                      </Button>
                      
                      {/* Botones de acción según quien creó la cita y su estado */}
                      {appointment.status === 'propuesta' && isFuture(startDate) && (
                        appointment.created_by === user?.id ? (
                          // Cliente cancelando su propia solicitud
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCancelAppointment(appointment)}
                          >
                            Cancelar Solicitud
                          </Button>
                        ) : (
                          // Cliente aceptando/rechazando propuesta de colaborador
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1"
                              onClick={() => handleAcceptAppointment(appointment)}
                            >
                              <Check className="h-3 w-3" />
                              Aceptar
                            </Button>
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectAppointment(appointment)}
                            >
                              Rechazar
                            </Button>
                          </>
                        )
                      )}
                      
                      {/* Cancelar citas ya aceptadas (solo propias) */}
                      {appointment.status === 'aceptada' && appointment.created_by === user?.id && isFuture(startDate) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCancelAppointment(appointment)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
          // Refresh appointments handled by react-query
        }}
      />

      {/* Upcoming Appointments Dialog */}
      <Dialog open={upcomingDialogOpen} onOpenChange={setUpcomingDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Próximas Citas</DialogTitle>
            <DialogDescription>
              Tus {upcomingAppointments.length} próximas citas programadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => {
                const startDate = parseISO(appointment.start_time);
                const endDate = parseISO(appointment.end_time);
                const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                
                return (
                  <Card 
                    key={appointment.id} 
                    className="border-l-4 border-l-primary cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setUpcomingDialogOpen(false);
                      handleViewDetails(appointment);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{appointment.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge className={
                                appointment.status === 'aceptada' 
                                  ? 'text-xs bg-green-100 text-green-700 hover:bg-green-100'
                                  : appointment.status === 'rechazada'
                                  ? 'text-xs bg-red-100 text-red-700 hover:bg-red-100'
                                  : 'text-xs bg-blue-100 text-blue-700 hover:bg-blue-100'
                              }>
                                {appointment.status === 'aceptada' ? 'Confirmada' : 
                                 appointment.status === 'rechazada' ? 'Rechazada' : 'Pendiente'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(appointment.start_time, "d 'de' MMMM, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{formatDateTime(appointment.start_time, 'HH:mm')} - {duration} min</span>
                          </div>
                          {appointment.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                              {appointment.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay citas próximas programadas</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAppointment.title}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedAppointment.start_time, "EEEE d 'de' MMMM, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Horario</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(selectedAppointment.start_time, 'HH:mm')} - {formatDateTime(selectedAppointment.end_time, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    selectedAppointment.status === 'aceptada' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : selectedAppointment.status === 'rechazada'
                      ? 'bg-red-100 text-red-700 hover:bg-red-100'
                      : selectedAppointment.status === 'cancelada'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                  }>
                    {selectedAppointment.status === 'aceptada' ? 'Confirmada' : 
                     selectedAppointment.status === 'rechazada' ? 'Rechazada' :
                     selectedAppointment.status === 'cancelada' ? 'Cancelada' : 
                     'Pendiente de Confirmación'}
                  </Badge>
                </div>

                {selectedAppointment.description && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Notas</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.description}</p>
                  </div>
                )}

                {selectedAppointment.created_by_name && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Creado por</p>
                      <p className="text-xs text-muted-foreground">{selectedAppointment.created_by_name}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedAppointment.status === 'propuesta' && (
                  <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <p className="font-medium">⏳ Solicitud pendiente</p>
                    <p className="text-xs mt-1">El equipo revisará tu solicitud y te confirmará el horario pronto.</p>
                  </div>
                )}
                {selectedAppointment.status === 'rechazada' && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <p className="font-medium">❌ Solicitud no disponible</p>
                    <p className="text-xs mt-1">Este horario no está disponible. Por favor solicita otra fecha.</p>
                  </div>
                )}
                {selectedAppointment.status !== 'cancelada' && isFuture(parseISO(selectedAppointment.start_time)) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      handleCancelAppointment(selectedAppointment);
                    }}
                    className="w-full sm:flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Cita
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="w-full sm:flex-1">
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción notificará al equipo sobre la cancelación. ¿Estás seguro de que deseas cancelar esta cita?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive hover:bg-destructive/90">
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
