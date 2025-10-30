import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertTriangle } from "lucide-react";
import { PurchaseOrderDialog } from "./PurchaseOrderDialog";
import { toast } from "sonner";
import { getConsumptionThreshold } from "@/utils/businessRules";
import { useBudgetConsumption } from "@/hooks/useBudgetConsumption";
import { ConsumptionBar } from "./ConsumptionBar";

interface PurchaseOrdersTabProps {
  projectId: string;
  budgetId: string;
}

export function PurchaseOrdersTab({ projectId, budgetId }: PurchaseOrdersTabProps) {
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [threshold, setThreshold] = useState(80);

  const { data: consumptionData = [] } = useBudgetConsumption(budgetId);

  useEffect(() => {
    loadBudgetItems();
    loadThreshold();
  }, [budgetId]);

  const loadThreshold = async () => {
    const { data: project } = await supabase
      .from("projects")
      .select("sucursal_id")
      .eq("id", projectId)
      .maybeSingle();
    
    const thr = await getConsumptionThreshold(projectId, project?.sucursal_id);
    setThreshold(thr ?? 80);
  };

  const loadBudgetItems = async () => {
    const { data: items, error } = await supabase
      .from("budget_items")
      .select(`
        *,
        tu_nodes!subpartida_id(id, code, name, unit_default)
      `)
      .eq("budget_id", budgetId)
      .not("subpartida_id", "is", null)
      .order("order_index");

    if (error) {
      toast.error("Error al cargar partidas");
      return;
    }

    setBudgetItems(items || []);
  };

  const handleCreateOrder = (item: any) => {
    setSelectedItem(item);
    setShowDialog(true);
  };

  const getConsumption = (subpartidaId: string) => {
    return consumptionData.find((c) => c.subpartida_id === subpartidaId);
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Compra por Subpartida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgetItems.map((item) => {
            const cons = getConsumption(item.subpartida_id);
            const qtyPlanned = cons?.qty_planned || item.cant_necesaria || 0;
            const qtySolicitada = cons?.qty_solicitada || 0;
            const qtyOrdenada = cons?.qty_ordenada || 0;
            const qtyRecibida = cons?.qty_recibida || 0;
            const nearLimit = qtyPlanned > 0 && (qtySolicitada / qtyPlanned) * 100 >= threshold;

            return (
              <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-primary">
                        {item.tu_nodes?.code}
                      </span>
                      <h4 className="font-semibold">{item.tu_nodes?.name}</h4>
                      {nearLimit && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {threshold}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.descripcion}
                    </p>

                    <div className="mt-4">
                      <ConsumptionBar
                        qtyPlanned={qtyPlanned}
                        qtySolicitada={qtySolicitada}
                        qtyOrdenada={qtyOrdenada}
                        qtyRecibida={qtyRecibida}
                      />
                    </div>

                    {nearLimit && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Esta subpartida ha alcanzado el {threshold}% de consumo
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCreateOrder(item)}
                    className="gap-2 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva OC
                  </Button>
                </div>
              </div>
            );
          })}

          {budgetItems.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No hay subpartidas en este presupuesto
            </div>
          )}
        </CardContent>
      </Card>

      <PurchaseOrderDialog
        open={showDialog}
        onClose={(reload) => {
          setShowDialog(false);
          setSelectedItem(null);
          if (reload) loadBudgetItems();
        }}
        projectId={projectId}
        budgetItem={selectedItem}
      />
    </div>
  );
}
