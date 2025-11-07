import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectById } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Package, FileText, TrendingUp, Camera, Users, Calendar } from "lucide-react";
import { ConstructionStagesTab } from "@/components/construction/ConstructionStagesTab";
import { MaterialsConsumptionTab } from "@/components/construction/MaterialsConsumptionTab";
import { PurchaseOrdersTab } from "@/components/construction/PurchaseOrdersTab";
import { ConstructionPhotosTab } from "@/components/construction/ConstructionPhotosTab";
import { GanttProgressTab } from "@/components/construction/GanttProgressTab";
import { ProjectTeamTab } from "@/components/construction/ProjectTeamTab";

export default function Construccion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project } = useProjectById(id!);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [budgetId, setBudgetId] = useState<string | null>(null);

  // Obtener budget ejecutivo del proyecto
  useEffect(() => {
    if (id) {
      supabase
        .from("budgets")
        .select("id")
        .eq("project_id", id)
        .eq("type", "ejecutivo")
        .eq("status", "publicado")
        .order("version", { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setBudgetId(data.id);
        });
    }
  }, [id]);

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
        <Button variant="outline" onClick={() => navigate('/proyectos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Construcción
          </h1>
          {project && (
            <p className="text-muted-foreground">
              Proyecto: {project.clients?.name || "Sin nombre"}
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
          <TabsTrigger value="materials" className="gap-2" disabled={!selectedStage}>
            <Package className="h-4 w-4" />
            Materiales
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="gap-2">
            <FileText className="h-4 w-4" />
            Órdenes de Compra
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <Calendar className="h-4 w-4" />
            Avance Gantt
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2">
            <Camera className="h-4 w-4" />
            Fotografías
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
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

        <TabsContent value="materials">
          {selectedStage ? (
            <MaterialsConsumptionTab stageId={selectedStage} projectId={id} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Selecciona una etapa en la pestaña "Etapas" para ver su consumo de materiales
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrdersTab projectId={id} budgetId={budgetId || undefined} />
        </TabsContent>

        <TabsContent value="progress">
          <GanttProgressTab projectId={id} />
        </TabsContent>

        <TabsContent value="photos">
          <ConstructionPhotosTab projectId={id} />
        </TabsContent>

        <TabsContent value="team">
          <ProjectTeamTab projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
