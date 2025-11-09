import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import AppointmentModal from "@/components/client-app/AppointmentModal";
import { useProject } from "@/contexts/client-app/ProjectContext";
import { useProjectAppointments, useUpdateAppointment } from '@/hooks/useProjectAppointments';
import { Plus, Clock, User, Calendar as CalendarIcon, CheckCircle2, X, AlertCircle } from "lucide-react";
import { ClientErrorState } from '@/components/client-app/ClientSkeletons';
import { useClientError } from '@/hooks/client-app/useClientError';
import { format, isSameDay, isFuture, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatDateTime } from '@/lib/datetime';
import { toast } from 'sonner';

export default function AppointmentsDesktop() {
  const { currentProject } = useProject();
  const { handleError } = useClientError();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [upcomingDialogOpen, setUpcomingDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { data: appointments, isLoading, error, refetch } = useProjectAppointments(currentProject?.id || null);
  const updateAppointment = useUpdateAppointment();

  // Get upcoming appointments (future or today)
  const upcomingAppointments = (appointments || [])
    .filter(apt => {
      const aptDate = parseISO(apt.start_time);
      return isToday(aptDate) || isFuture(aptDate);
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  // Get dates with appointments
  const appointmentDates = (appointments || []).map(apt => parseISO(apt.start_time));

  // Filter and sort appointments for selected date
  const appointmentsOnSelectedDate = (appointments || [])
    .filter(apt => isSameDay(parseISO(apt.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const handleCancelClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
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
      setDetailsDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      toast.error('Error al cancelar la cita');
    }
  };

  const confirmAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      await updateAppointment.mutateAsync({
        id: selectedAppointment.id,
        status: 'confirmada'
      });
      toast.success('Cita confirmada exitosamente');
      setDetailsDialogOpen(false);
    } catch (error) {
      toast.error('Error al confirmar la cita');
    }
  };

  if (error) {
    return (
      <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
        <div>
          <h1 className="text-3xl font-bold mb-2">Citas y Reuniones</h1>
          <p className="text-muted-foreground">Gestiona tus citas con el equipo</p>
        </div>
        <ClientErrorState
          title="Error al cargar citas"
          description="No pudimos obtener tus citas. Verifica tu conexión e intenta nuevamente."
          onRetry={() => refetch()}
          icon={CalendarIcon}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Citas y Reuniones</h1>
          <p className="text-muted-foreground">Gestiona tus citas con el equipo</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
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
            <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 to-secondary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
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
              <p className="text-3xl font-bold text-primary mb-2">{upcomingAppointments.length}</p>
              {upcomingAppointments.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">Próxima:</p>
                  <p className="text-sm font-medium mt-1">
                    {formatDateTime(upcomingAppointments[0].start_time, "d 'de' MMM, HH:mm")}
                  </p>
                </div>
              )}
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
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-24 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : appointmentsOnSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {appointmentsOnSelectedDate.map((appointment) => {
                  const startDate = parseISO(appointment.start_time);
                  const endDate = parseISO(appointment.end_time);
                  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                  
                  return (
                    <Card 
                      key={appointment.id} 
                      className="border-l-4 border-l-primary cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleViewDetails(appointment)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{appointment.title}</h3>
                              <Badge className={
                                appointment.status === 'confirmada' 
                                  ? 'mt-1 bg-green-100 text-green-700 hover:bg-green-100'
                                  : appointment.status === 'cancelada'
                                  ? 'mt-1 bg-red-100 text-red-700 hover:bg-red-100'
                                  : 'mt-1 bg-amber-100 text-amber-700 hover:bg-amber-100'
                              }>
                                {appointment.status === 'confirmada' ? 'Confirmada' : 
                                 appointment.status === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(appointment);
                            }}>
                              Ver Detalles
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatDateTime(appointment.start_time, 'HH:mm')} - {duration} min</span>
                            </div>
                          </div>

                          {appointment.description && (
                            <div className="flex items-start gap-2 text-sm">
                              <p className="text-muted-foreground line-clamp-2">{appointment.description}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay citas para este día</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agendar Cita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments Dialog */}
      <Dialog open={upcomingDialogOpen} onOpenChange={setUpcomingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Próximas Citas</DialogTitle>
            <DialogDescription>
              Tus {upcomingAppointments.length} próximas citas programadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
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
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{appointment.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={
                                appointment.status === 'confirmada' 
                                  ? 'text-xs bg-green-100 text-green-700 hover:bg-green-100'
                                  : 'text-xs bg-amber-100 text-amber-700 hover:bg-amber-100'
                              }>
                                {appointment.status === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(appointment.start_time, "d 'de' MMMM, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{formatDateTime(appointment.start_time, 'HH:mm')} - {duration} min</span>
                          </div>
                        </div>

                        {appointment.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{appointment.description}</p>
                        )}
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
        <DialogContent className="max-w-2xl">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedAppointment.title}</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedAppointment.start_time, "EEEE d 'de' MMMM, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Horario</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(selectedAppointment.start_time, 'HH:mm')} - {formatDateTime(selectedAppointment.end_time, 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    selectedAppointment.status === 'confirmada' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : selectedAppointment.status === 'cancelada'
                      ? 'bg-red-100 text-red-700 hover:bg-red-100'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                  }>
                    {selectedAppointment.status === 'confirmada' ? 'Confirmada' : 
                     selectedAppointment.status === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                  </Badge>
                </div>

                {selectedAppointment.description && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Notas</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.description}</p>
                  </div>
                )}

                {selectedAppointment.created_by_name && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Creado por</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.created_by_name}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {selectedAppointment.status === 'propuesta' && (
                  <Button onClick={confirmAppointment} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar Cita
                  </Button>
                )}
                {selectedAppointment.status !== 'cancelada' && isFuture(parseISO(selectedAppointment.start_time)) && (
                  <Button variant="destructive" onClick={() => {
                    setDetailsDialogOpen(false);
                    handleCancelClick(selectedAppointment);
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Cita
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
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

      {/* Appointment Modal */}
      <AppointmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAppointmentCreated={() => {
          // Refresh appointments handled by react-query
        }}
      />
    </div>
  );
}
