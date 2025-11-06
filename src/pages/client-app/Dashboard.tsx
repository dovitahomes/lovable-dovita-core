import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockAppointments, mockMinistraciones, mockPhotos } from '@/lib/client-app/client-data';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { calculateProjectProgress, getCurrentPhase, isInDesignPhase } from '@/lib/project-utils';
import { getProjectHeroImage } from '@/lib/client-app/dataAdapters';
import { Calendar, MapPin, Video, Clock, User, FileText, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PreviewBar from '@/components/client-app/PreviewBar';

export default function Dashboard() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const project = currentProject;
  const navigate = useNavigate();
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
  
  // Early return if no project - DESPUÉS de PreviewBar
  if (!project) {
    return (
      <div>
        <PreviewBar />
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-lg font-medium text-muted-foreground">Cargando proyecto...</p>
            <p className="text-sm text-muted-foreground">
              Si no hay datos, activa Mock Data en la barra superior.
            </p>
          </div>
        </div>
      </div>
    );
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
  const projectProgress = calculateProjectProgress(project);
  
  // Obtener la fase actual
  const currentPhase = getCurrentPhase(project);

  // Calcular pagos según la fase del proyecto
  const inDesignPhase = isInDesignPhase(project);
  const projectPayments = mockMinistraciones.filter(m => m.projectId === project.id);
  
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
  const projectPhotos = mockPhotos.filter(photo => photo.projectId === project.id);
  
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Card with Hero Image */}
        <Card className="border-0 overflow-hidden relative min-h-[200px]">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fase Actual del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{currentPhase.name}</p>
              </div>
              <Badge className="bg-[hsl(var(--dovita-yellow))]/20 text-[hsl(var(--dovita-yellow))]">
                En Proceso
              </Badge>
            </div>
            
            <Progress value={projectProgress} variant="yellow" className="h-2" />
            <p className="text-sm text-muted-foreground text-right">
              {projectProgress}% completado
            </p>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inDesignPhase ? (
              // Diseño phase - solo mostrar total y mensaje especial
              <div>
                <p className="text-xs opacity-75">Total Proyecto</p>
                <p className="text-3xl font-bold">
                  ${displayTotal.toLocaleString('es-MX')}
                </p>
                <p className="text-sm opacity-90 mt-1">MXN</p>
                <p className="text-xs opacity-90 mt-3 bg-white/10 rounded-lg p-2">
                  Los pagos iniciarán una vez aprobada la fase de diseño
                </p>
              </div>
            ) : (
              // Construcción phase - mostrar pagado/pendiente normal
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs opacity-75">Pagado</p>
                    <p className="text-2xl font-bold">
                      ${(displayPaid / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75">Por Pagar</p>
                    <p className="text-2xl font-bold">
                      ${(displayPending / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
                <Progress 
                  value={(displayPaid / displayTotal) * 100}
                  variant="yellow"
                  className="h-2 bg-white/20"
                />
                <div className="flex items-center justify-between text-xs opacity-75">
                  <span>Total: ${displayTotal.toLocaleString('es-MX')}</span>
                  <span>{((displayPaid / displayTotal) * 100).toFixed(0)}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Appointment */}
        {nextAppointment && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Próxima Cita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{nextAppointment.type}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(nextAppointment.date), "d 'de' MMMM", { locale: es })}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {nextAppointment.time}
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{nextAppointment.teamMember.name}</p>
                  <p className="text-xs text-muted-foreground">{nextAppointment.teamMember.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {nextAppointment.isVirtual ? (
                  <>
                    <Video className="h-4 w-4" />
                    <span>Virtual</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span className="flex-1">{nextAppointment.location}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
                <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/client/photos')}
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-xs">Ver Fotos</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/client/appointments')}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Citas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/client/chat')}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Chat</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/client/documents')}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Documentos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Design/Photos Gallery Preview */}
        {recentImages.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {inDesignPhase ? 'Diseños Recientes' : 'Fotos Recientes'}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => navigate('/client/photos')}
                >
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {recentImages.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => handleImageClick()}
                  >
                    <img
                      src={item.url}
                      alt={item.description}
                      className="w-full h-full object-cover hover:scale-110 transition-transform"
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
