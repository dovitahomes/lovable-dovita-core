import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectById } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { ConstructionStagesTab } from "@/components/construction/ConstructionStagesTab";
import { GanttProgressTab } from "@/components/construction/GanttProgressTab";

export default function ConstruccionEtapas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project } = useProjectById(id!);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(`/construccion/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Etapas y Avance</h1>
          {project && (
            <p className="text-muted-foreground">
              {project.clients?.name || "Sin nombre"}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Etapas
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <Calendar className="h-4 w-4" />
            Avance Gantt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stages">
          <ConstructionStagesTab 
            projectId={id} 
            onSelectStage={(stageId) => {
              setSelectedStage(stageId);
            }}
          />
        </TabsContent>

        <TabsContent value="progress">
          <GanttProgressTab projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
