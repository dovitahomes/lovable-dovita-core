import { ClientChat } from "@/components/client/ClientChat";
import { useMyProjects } from "@/features/client/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientChatView() {
  const { projects, currentProject, setCurrentProject, isLoading } = useMyProjects();

  if (isLoading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const projectId = currentProject?.id || null;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Chat del Proyecto</h1>
        <p className="text-sm text-muted-foreground">Conversación con el equipo del proyecto</p>
      </div>

      {projects.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="project-selector" className="text-sm font-medium whitespace-nowrap">
            Proyecto:
          </label>
          <Select
            value={currentProject.id}
            onValueChange={setCurrentProject}
          >
            <SelectTrigger id="project-selector" className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.clients.name} - {new Date(project.created_at).toLocaleDateString('es-MX')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ClientChat projectId={projectId} />
    </div>
  );
}
