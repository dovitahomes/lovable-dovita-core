import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, ArrowRight, Loader2, Bell } from "lucide-react";
import { useMyProjects } from "@/hooks/useMyProjects";
import { useNavigate } from "react-router-dom";
import { generateRoute } from "@/config/routes";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospecto: { label: "Prospecto", variant: "outline" },
  en_diseno: { label: "En Diseño", variant: "secondary" },
  presupuestado: { label: "Presupuestado", variant: "default" },
  en_construccion: { label: "En Construcción", variant: "default" },
  completado: { label: "Completado", variant: "secondary" },
  pausado: { label: "Pausado", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export function MyProjectsWidget() {
  const { data: projects, isLoading } = useMyProjects();
  const navigate = useNavigate();

  const displayedProjects = projects?.slice(0, 5) || [];
  const hasMore = (projects?.length || 0) > 5;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Mis Proyectos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Mis Proyectos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No estás asignado a ningún proyecto</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Mis Proyectos
          </CardTitle>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/proyectos')}
            >
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop: Tabla */}
        <div className="hidden md:block">
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
              <div className="col-span-4">Proyecto</div>
              <div className="col-span-2">Cliente</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-3">Progreso</div>
              <div className="col-span-1 text-right">Notif.</div>
            </div>
            {displayedProjects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0 hover:bg-accent/50 rounded-lg px-2 transition-colors cursor-pointer"
                onClick={() => navigate(generateRoute.proyectoDetalle(project.id))}
              >
                <div className="col-span-4">
                  <h4 className="font-medium text-foreground truncate">
                    {project.client_name}
                  </h4>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground truncate">
                    Proyecto
                  </p>
                </div>
                <div className="col-span-2">
                  <Badge variant={STATUS_LABELS[project.status]?.variant || "outline"}>
                    {STATUS_LABELS[project.status]?.label || project.status}
                  </Badge>
                </div>
                <div className="col-span-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-2" />
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  {project.unread_notifications > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      {project.unread_notifications}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {displayedProjects.map((project) => (
            <div
              key={project.id}
              className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(generateRoute.proyectoDetalle(project.id))}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {project.client_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">Proyecto</p>
                </div>
                {project.unread_notifications > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1 ml-2">
                    <Bell className="h-3 w-3" />
                    {project.unread_notifications}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={STATUS_LABELS[project.status]?.variant || "outline"}>
                  {STATUS_LABELS[project.status]?.label || project.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{project.progress_percentage}%</span>
                </div>
                <Progress value={project.progress_percentage} className="h-2" />
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate('/proyectos')}
          >
            Ver todos los proyectos ({projects.length})
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
