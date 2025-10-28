import { ClientChat } from "@/components/client/ClientChat";
import { useMyProjects } from "@/features/client/hooks";

export default function ClientChatView() {
  const { currentProject } = useMyProjects();
  const projectId = currentProject?.id || null;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Chat del Proyecto</h1>
      <ClientChat projectId={projectId} />
    </div>
  );
}
