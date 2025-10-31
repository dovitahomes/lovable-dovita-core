import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockProjectData, mockAppointments } from '@/lib/client-data';
import { Calendar, MapPin, Video, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Dashboard() {
  const project = mockProjectData;
  const navigate = useNavigate();
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
  
  // Get current hero image (rotate through renders if available)
  const heroImage = project.renders && project.renders.length > 0 
    ? project.renders[currentRenderIndex].url 
    : project.heroImage;
  
  // Get next upcoming appointment
  const now = new Date();
  const upcomingAppointments = mockAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date + 'T' + apt.time);
      return aptDate > now && (apt.status === 'confirmed' || apt.status === 'pending');
    })
    .sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);
      return dateA.getTime() - dateB.getTime();
    });
  
  const nextAppointment = upcomingAppointments[0];

  const handleNextRender = () => {
    if (project.renders && project.renders.length > 0) {
      setCurrentRenderIndex((prev) => (prev + 1) % project.renders.length);
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* Welcome Card with Hero Image */}
      <Card className="border-0 overflow-hidden relative min-h-[180px]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('${heroImage}')`,
          }}
        >
          {/* Dark overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-primary-dark/90" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg text-white drop-shadow-md">
                Bienvenido, {project.clientName}
              </CardTitle>
              {project.renders && project.renders.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextRender}
                  className="text-white hover:bg-white/20 backdrop-blur-sm -mt-2 border border-white/20"
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {currentRenderIndex + 1}/{project.renders.length}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold mb-1 text-white drop-shadow-md">{project.name}</p>
            <p className="text-sm text-white/95 flex items-center gap-1 drop-shadow">
              <MapPin className="h-3 w-3" />
              {project.location}
            </p>
            {project.renders && project.renders.length > 0 && (
              <div className="mt-3 inline-block">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {project.renders[currentRenderIndex].title} • {project.renders[currentRenderIndex].phase}
                </Badge>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Progreso de Obra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={project.progress} className="h-3" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">{project.progress}%</p>
              <p className="text-sm text-muted-foreground">{project.currentPhase}</p>
            </div>
            <Button variant="outline" size="sm">
              Ver Detalles
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">
              ${(project.totalPaid / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((project.totalPaid / project.totalAmount) * 100)}% del total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Por Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-orange-600">
              ${(project.totalPending / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((project.totalPending / project.totalAmount) * 100)}% restante
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Próxima Cita</CardTitle>
              </div>
              <Badge variant={nextAppointment.status === 'confirmed' ? 'default' : 'secondary'}>
                {nextAppointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-base">{nextAppointment.type}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                {format(new Date(nextAppointment.date), "EEEE d 'de' MMMM", { locale: es })} a las {nextAppointment.time}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <img 
                src={nextAppointment.teamMember.avatar} 
                alt={nextAppointment.teamMember.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{nextAppointment.teamMember.name}</p>
                <p className="text-xs text-muted-foreground">{nextAppointment.teamMember.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {nextAppointment.isVirtual ? (
                <>
                  <Video className="h-4 w-4" />
                  <span>Reunión Virtual</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>{nextAppointment.location}</span>
                </>
              )}
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/app/appointments')}
            >
              Ver Detalles
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/app/photos')}>
            Ver Fotos
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/appointments')}>
            Agendar Cita
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/chat')}>
            Mensaje
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/documents')}>
            Documentos
          </Button>
        </CardContent>
      </Card>

      {/* Renders Gallery Preview */}
      {project.renders && project.renders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Renders del Proyecto</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/app/documents')}
                className="text-xs"
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {project.renders.slice(0, 3).map((render) => (
                <div 
                  key={render.id} 
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setCurrentRenderIndex(project.renders.findIndex(r => r.id === render.id))}
                >
                  <img
                    src={render.url}
                    alt={render.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
