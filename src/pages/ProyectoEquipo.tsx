import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProjectTeamTab from "@/components/project/ProjectTeamTab";

export default function ProyectoEquipo() {
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
          onClick={() => navigate(`/proyectos/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Equipo del Proyecto</h1>
      </div>
      
      <ProjectTeamTab projectId={id} />
    </div>
  );
}
