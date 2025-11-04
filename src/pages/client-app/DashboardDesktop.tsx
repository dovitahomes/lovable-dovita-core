import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mockPhotos } from "@/lib/client-data";
import { useProject } from "@/contexts/ProjectContext";
import { getProjectHeroImage } from "@/lib/project-utils";
import { Calendar, DollarSign, Image, Clock, MapPin } from "lucide-react";

export default function DashboardDesktop() {
  const { currentProject } = useProject();
  const project = currentProject;

  // Filter photos by current project
  const projectPhotos = mockPhotos.filter(photo => photo.projectId === project?.id);

  if (!project) {
    return <div className="h-full flex items-center justify-center">Cargando proyecto...</div>;
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
                <p className="text-4xl font-bold">{project.progress}%</p>
                <p className="text-sm text-white/80">Progreso</p>
              </div>
              <div className="h-12 w-px bg-white/30" />
              <div>
                <p className="text-sm text-white/80">Presupuesto</p>
                <p className="text-xl font-semibold">
                  ${(project.totalPaid / 1000000).toFixed(1)}M / ${(project.totalAmount / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{project.progress}%</div>
            <Progress value={project.progress} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {project.currentPhase}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              ${project.totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              de ${project.totalAmount.toLocaleString()} total
            </p>
            <Progress 
              value={(project.totalPaid / project.totalAmount) * 100} 
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
