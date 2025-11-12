import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectById } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, FileText } from "lucide-react";
import { MaterialsConsumptionTab } from "@/components/construction/MaterialsConsumptionTab";
import { PurchaseOrdersTab } from "@/components/construction/PurchaseOrdersTab";
import { ConstructionStagesTab } from "@/components/construction/ConstructionStagesTab";

export default function ConstruccionMateriales() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project } = useProjectById(id!);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [budgetId, setBudgetId] = useState<string | null>(null);

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
          <h1 className="text-3xl font-bold">Materiales y Compras</h1>
          {project && (
            <p className="text-muted-foreground">
              {project.clients?.name || "Sin nombre"}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials" className="gap-2">
            <Package className="h-4 w-4" />
            Materiales
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="gap-2">
            <FileText className="h-4 w-4" />
            Órdenes de Compra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          {selectedStage ? (
            <MaterialsConsumptionTab stageId={selectedStage} projectId={id} />
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Selecciona una etapa para ver su consumo de materiales
              </p>
              <ConstructionStagesTab 
                projectId={id} 
                onSelectStage={(stageId) => {
                  setSelectedStage(stageId);
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrdersTab projectId={id} budgetId={budgetId || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
