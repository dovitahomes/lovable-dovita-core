import { useOutletContext } from "react-router-dom";
import { ClientCalendar } from "@/components/client/ClientCalendar";

interface OutletContext {
  projectId: string | null;
}

export default function Citas() {
  const { projectId } = useOutletContext<OutletContext>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Calendario</h2>
        <p className="text-sm text-muted-foreground">Tus citas y eventos del proyecto</p>
      </div>

      <ClientCalendar projectId={projectId} />
    </div>
  );
}
