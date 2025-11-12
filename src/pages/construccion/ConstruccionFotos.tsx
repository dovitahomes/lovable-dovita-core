import { useParams, useNavigate } from "react-router-dom";
import { useProjectById } from "@/hooks/useProjects";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ConstructionPhotosTab } from "@/components/construction/ConstructionPhotosTab";
import ConstruccionFotosMobile from "./ConstruccionFotosMobile";

export default function ConstruccionFotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project } = useProjectById(id!);
  const isMobile = useIsMobile();

  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
      </div>
    );
  }

  // Render mobile version for touch devices
  if (isMobile) {
    return <ConstruccionFotosMobile />;
  }

  // Desktop version
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(`/construccion/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Fotografías de Obra</h1>
          {project && (
            <p className="text-muted-foreground">
              {project.clients?.name || "Sin nombre"}
            </p>
          )}
        </div>
      </div>

      <ConstructionPhotosTab projectId={id} />
    </div>
  );
}
