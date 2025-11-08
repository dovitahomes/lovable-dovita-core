import { useClientAppointments } from '@/hooks/client-app/useClientAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface ProjectAppointmentsTabProps {
  projectId: string;
}

export default function ProjectAppointmentsTab({ projectId }: ProjectAppointmentsTabProps) {
  const { data: appointments, isLoading } = useClientAppointments(projectId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!appointments || appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No hay citas programadas
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.appointment_id}>
          <CardHeader>
            <CardTitle className="text-lg">{appointment.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(appointment.starts_at), "dd 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(appointment.starts_at), 'HH:mm', { locale: es })}
                {appointment.ends_at && 
                  ` - ${format(new Date(appointment.ends_at), 'HH:mm', { locale: es })}`
                }
              </span>
            </div>
            
            {appointment.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.location}</span>
              </div>
            )}
            
            {appointment.notes && (
              <p className="text-sm mt-3 pt-3 border-t">
                {appointment.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
