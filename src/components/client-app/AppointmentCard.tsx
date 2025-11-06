import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Video, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentCardProps {
  appointment: {
    id: number;
    type: string;
    date: string;
    time: string;
    duration: number;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    teamMember: {
      name: string;
      role: string;
      avatar: string;
    };
    location: string;
    isVirtual: boolean;
  };
  onViewDetails?: () => void;
  onCancel?: () => void;
}

export default function AppointmentCard({ appointment, onViewDetails, onCancel }: AppointmentCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Confirmada</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return null;
    }
  };

  const isPastAppointment = new Date(`${appointment.date}T${appointment.time}`) < new Date();
  const canCancel = !isPastAppointment && appointment.status !== 'completed' && appointment.status !== 'cancelled';

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-base">{appointment.type}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(appointment.date), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-sm font-medium text-primary mt-0.5">
              {appointment.time}
            </p>
          </div>
          {getStatusBadge(appointment.status)}
        </div>

        <div className="flex items-center gap-3">
          <img 
            src={appointment.teamMember.avatar} 
            alt={appointment.teamMember.name}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{appointment.teamMember.name}</p>
            <p className="text-xs text-muted-foreground truncate">{appointment.teamMember.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {appointment.isVirtual ? (
            <div className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span className="text-xs">Virtual</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs truncate">{appointment.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">{appointment.duration} min</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
            Ver Detalles
          </Button>
          {canCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
