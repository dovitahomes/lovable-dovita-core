import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mockProjectData, mockPhotos } from "@/lib/client-data";
import { Calendar, DollarSign, Image, Clock } from "lucide-react";

export default function DashboardDesktop() {
  const project = mockProjectData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bienvenido a tu Proyecto</h1>
        <p className="text-muted-foreground">Resumen general de tu construcción</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={project.heroImage} 
              alt={project.name} 
              className="w-full h-[400px] object-cover rounded-lg"
            />
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
          <CardContent className="space-y-4">
            {[
              { name: "Cimentación", progress: 100, status: "Completado" },
              { name: "Estructura", progress: 85, status: "En progreso" },
              { name: "Instalaciones", progress: 60, status: "En progreso" },
              { name: "Acabados", progress: 0, status: "Pendiente" },
            ].map((phase) => (
              <div key={phase.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{phase.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{phase.progress}%</span>
                    <Badge variant={phase.progress === 100 ? "default" : phase.progress > 0 ? "secondary" : "outline"}>
                      {phase.status}
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
            <div className="text-2xl font-bold mb-2">{mockPhotos.length}</div>
            <p className="text-xs text-muted-foreground mb-4">
              Total de fotos subidas
            </p>
            <div className="grid grid-cols-3 gap-2">
              {mockPhotos.slice(0, 6).map((photo) => (
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
