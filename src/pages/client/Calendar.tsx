import { useOutletContext } from "react-router-dom";
import { ClientCalendar } from "@/components/client/ClientCalendar";
import { Loader2 } from "lucide-react";

interface ClientOutletContext {
  projectId: string | null;
}

export default function Calendar() {
  const { projectId } = useOutletContext<ClientOutletContext>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ClientCalendar projectId={projectId} />;
}
