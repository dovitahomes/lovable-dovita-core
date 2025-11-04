import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mockPhotos, mockMinistraciones } from "@/lib/client-data";
import { useProject } from "@/contexts/ProjectContext";
import { getProjectHeroImage, calculateProjectProgress, getCurrentPhase, isInDesignPhase } from "@/lib/project-utils";
import { Calendar, DollarSign, Image, Clock, MapPin } from "lucide-react";

export default function DashboardDesktop() {
  const { currentProject } = useProject();
  const project = currentProject;

  // Filter photos by current project
  const projectPhotos = mockPhotos.filter(photo => photo.projectId === project?.id);

  if (!project) {
    return <div className="h-full flex items-center justify-center">Cargando proyecto...</div>;
  }

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

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-4 pr-2">
      <div>
        <h1 className="text-2xl font-bold mb-2">Bienvenido a tu Proyecto</h1>
        <p className="text-muted-foreground">Resumen general de tu construcción</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="col-span-1 lg:col-span-2 xl:col-span-3 relative overflow-hidden h-[220px]">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url(${getProjectHeroImage(project)})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80" />
          </div>
          
          <CardContent className="relative z-10 h-full flex flex-col justify-between p-6">
            <div>
              <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
                {project.currentPhase}
              </Badge>
              <h2 className="text-2xl font-bold text-white mb-2">{project.name}</h2>
              <p className="text-white/90 flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4" />
                {project.location}
              </p>
            </div>
            
            <div className="flex items-center gap-8 text-white">
              <div>
                <p className="text-4xl font-bold">{projectProgress}%</p>
                <p className="text-sm text-white/80">Progreso</p>
              </div>
              <div className="h-12 w-px bg-white/30" />
              <div>
                <p className="text-sm text-white/80">{inDesignPhase ? 'Pagos Diseño' : 'Presupuesto'}</p>
                <p className="text-xl font-semibold">
                  ${(displayPaid / 1000000).toFixed(1)}M / ${(displayTotal / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fase Actual</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{currentPhase?.progress || 0}%</div>
            <Progress value={currentPhase?.progress || 0} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {currentPhase?.name || project.currentPhase}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {inDesignPhase ? 'Pagos Diseño' : 'Presupuesto'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              ${displayPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              de ${displayTotal.toLocaleString()} total
            </p>
            <Progress 
              value={(displayPaid / displayTotal) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Cita</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">15 Nov</div>
            <p className="text-xs text-muted-foreground">
              Inspección de fontanería
            </p>
            <Badge className="mt-2">10:00 AM</Badge>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Fases del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.phases.map((phase) => (
              <div key={phase.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{phase.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{phase.progress}%</span>
                    <Badge variant={phase.progress === 100 ? "default" : phase.progress > 0 ? "secondary" : "outline"}>
                      {phase.status === 'completed' ? 'Completado' : phase.status === 'in-progress' ? 'En progreso' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
                <Progress value={phase.progress} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fotos Recientes</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{projectPhotos.length}</div>
            <p className="text-xs text-muted-foreground mb-4">
              Total de fotos subidas
            </p>
            <div className="grid grid-cols-3 gap-2">
              {projectPhotos.slice(0, 6).map((photo) => (
                <img 
                  key={photo.id}
                  src={photo.url} 
                  alt={photo.description}
                  className="aspect-square object-cover rounded-md"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
