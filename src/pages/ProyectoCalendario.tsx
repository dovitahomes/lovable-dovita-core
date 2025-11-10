import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectCalendarTab } from "@/components/project/ProjectCalendarTab";
import { generateRoute } from "@/config/routes";

export default function ProyectoCalendario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!id) {
    return <div>Proyecto no encontrado</div>;
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(generateRoute.proyectoDetalle(id))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Calendario del Proyecto</h1>
      </div>
      
      <ProjectCalendarTab projectId={id} />
    </div>
  );
}
