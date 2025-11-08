import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockAppointments } from '@/lib/client-app/client-data';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useClientPhotos, useClientMinistrations } from '@/hooks/client-app/useClientData';
import { isInDesignPhase } from '@/lib/project-utils';
import { getProjectHeroImage } from '@/lib/client-app/dataAdapters';
import { Calendar, MapPin, Video, Clock, User, FileText, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { ClientLoadingState } from '@/components/client-app/ClientSkeletons';

export default function Dashboard() {
  const { currentProject } = useProject();
  const project = currentProject;
  const navigate = useNavigate();
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);

  // Fetch data using unified hooks (auto-switch between mock/real)
  const { data: photos = [] } = useClientPhotos(project?.id || null);
  const { data: ministrations = [] } = useClientMinistrations(project?.id || null);
  
  // Early return if no project
  if (!project) {
    return <ClientLoadingState message="Cargando proyecto..." />;
  }
  
  // Get current hero image (prioriza diseños recientes > renders > heroImage)
  const heroImage = project.renders && project.renders.length > 0 
    ? project.renders[currentRenderIndex].url 
    : getProjectHeroImage(project);
  
  // Get next upcoming appointment for current project
  const now = new Date();
  const upcomingAppointments = mockAppointments
    .filter(apt => {
      const aptDate = new Date(apt.date + 'T' + apt.time);
      return apt.projectId === project?.id && aptDate > now && (apt.status === 'confirmed' || apt.status === 'pending');
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

  // Calcular progreso dinámicamente basado en fases
  const projectProgress = project.progress || 0;
  
  // Obtener la fase actual
  const currentPhaseName = project.currentPhase || 'Diseño';

  // Calcular pagos según la fase del proyecto
  const inDesignPhase = isInDesignPhase(project);
  const projectPayments = ministrations;
  
  let displayPaid = project.totalPaid;
  let displayPending = project.totalPending;
  let displayTotal = project.totalAmount;
  
  if (inDesignPhase) {
    // En fase de diseño, solo mostrar pagos de diseño
    displayPaid = projectPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    displayPending = projectPayments
      .filter(p => p.status === 'pending' || p.status === 'future')
      .reduce((sum, p) => sum + p.amount, 0);
    
    displayTotal = displayPaid + displayPending;
  }

  // Obtener imágenes correctas según la fase
  const projectPhotos = photos;
  
  const recentImages = inDesignPhase
    ? project.renders?.slice(0, 3) || []
    : projectPhotos.slice(0, 3);

  const handleImageClick = () => {
    if (inDesignPhase) {
      navigate('/client/documents');
    } else {
      navigate('/client/photos');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[130px]">
        {/* Welcome Card with Hero Image */}
        <Card className="border-0 overflow-hidden relative min-h-[200px] animate-fade-in hover-lift">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('${heroImage}')`,
            }}
          >
            {/* Dark overlay gradient for text readability */}
            <div 
              className="absolute inset-0" 
              style={{ background: 'var(--gradient-hero-card)' }}
            />
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

        {/* Current Phase Card */}
        <Card 
          className="cursor-pointer hover-scale press-feedback animate-slide-in-up"
          onClick={() => navigate('/client/schedule')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Fase Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={projectProgress} variant="yellow" className="h-3" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{projectProgress}%</p>
                <p className="text-sm text-muted-foreground">{currentPhaseName}</p>
              </div>
              <Button variant="outline" size="sm">
                Ver Detalles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary - Grid 2 Columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tarjeta Pagado */}
          <Card 
            className="cursor-pointer hover-scale press-feedback animate-slide-in-right"
            onClick={() => navigate('/client/financial')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                {inDesignPhase ? 'Pagado Diseño' : 'Pagado'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-green-600">
                {inDesignPhase 
                  ? `$${(displayPaid / 1000).toFixed(0)}k`
                  : `$${(displayPaid / 1000000).toFixed(1)}M`
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((displayPaid / displayTotal) * 100)}% del total
              </p>
            </CardContent>
          </Card>
          
          {/* Tarjeta Pendiente */}
          <Card 
            className="cursor-pointer hover-scale press-feedback animate-slide-in-right"
            style={{ animationDelay: '0.1s' }}
            onClick={() => navigate('/client/financial')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                {inDesignPhase ? 'Por Pagar Diseño' : 'Por Pagar'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-orange-600">
                {inDesignPhase 
                  ? `$${(displayPending / 1000).toFixed(0)}k`
                  : `$${(displayPending / 1000000).toFixed(1)}M`
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((displayPending / displayTotal) * 100)}% restante
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Next Appointment */}
        {nextAppointment && (
          <Card className="border-l-4 border-l-primary animate-fade-in hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Próxima Cita</CardTitle>
                </div>
                <Badge 
                  variant={nextAppointment.status === 'confirmed' ? 'default' : 'secondary'}
                  className={nextAppointment.status === 'confirmed' ? '' : 'bg-secondary text-secondary-foreground'}
                >
                  {nextAppointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-base">{nextAppointment.type}</p>
                <p className="text-sm text-muted-foreground mt-1">
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
                    <span className="flex-1">{nextAppointment.location}</span>
                  </>
                )}
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/client/appointments')}
              >
                Ver Detalles
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="hover-scale press-feedback"
                onClick={() => navigate('/client/photos')}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Ver Fotos
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/client/appointments')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Cita
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/client/chat')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Mensaje
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/client/documents')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Documentos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Design/Photos Gallery Preview */}
        {recentImages.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {inDesignPhase ? 'Diseños Recientes' : 'Fotos Recientes'}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleImageClick}
                >
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {recentImages.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover-scale press-feedback transition-smooth"
                    onClick={handleImageClick}
                  >
                    <img
                      src={item.url}
                      alt={inDesignPhase ? item.title : item.description}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
