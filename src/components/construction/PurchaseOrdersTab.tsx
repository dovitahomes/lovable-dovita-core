import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertTriangle } from "lucide-react";
import { PurchaseOrderDialog } from "./PurchaseOrderDialog";
import { toast } from "sonner";

interface PurchaseOrdersTabProps {
  projectId: string;
  budgetId: string;
}

export function PurchaseOrdersTab({ projectId, budgetId }: PurchaseOrdersTabProps) {
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [consumption, setConsumption] = useState<Map<string, any>>(new Map());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [threshold, setThreshold] = useState(80);

  useEffect(() => {
    loadBudgetItems();
    loadThreshold();
  }, [budgetId]);

  const loadThreshold = async () => {
    const { data } = await supabase
      .from("consumption_config")
      .select("near_completion_threshold_pct")
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setThreshold(data.near_completion_threshold_pct);
    }
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

    // Load consumption for each subpartida
    const consumptionMap = new Map();
    for (const item of items || []) {
      const { data } = await supabase.rpc("get_subpartida_consumption", {
        p_project_id: projectId,
        p_subpartida_id: item.subpartida_id,
      });

      if (data && data.length > 0) {
        consumptionMap.set(item.subpartida_id, data[0]);
      }
    }
    setConsumption(consumptionMap);
  };

  const handleCreateOrder = (item: any) => {
    setSelectedItem(item);
    setShowDialog(true);
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "solicitado":
        return "bg-purple-500";
      case "ordenado":
        return "bg-yellow-500";
      case "recibido":
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getProgressPercentage = (cons: any) => {
    if (!cons || cons.qty_budgeted === 0) {
      return { requested: 0, ordered: 0, received: 0 };
    }
    
    const requested = (cons.qty_requested / cons.qty_budgeted) * 100;
    const ordered = (cons.qty_ordered / cons.qty_budgeted) * 100;
    const received = (cons.qty_received / cons.qty_budgeted) * 100;
    
    return { requested, ordered, received };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Compra por Subpartida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgetItems.map((item) => {
            const cons = consumption.get(item.subpartida_id);
            const progress = cons ? getProgressPercentage(cons) : { requested: 0, ordered: 0, received: 0 };
            const nearLimit = cons?.near_limit || false;

            return (
              <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
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
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCreateOrder(item)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva OC
                  </Button>
                </div>

                {nearLimit && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Esta subpartida ha alcanzado el {threshold}% de consumo
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cantidad Presupuestada: {item.cant_necesaria} {item.unidad}</span>
                    <span className="text-muted-foreground">
                      Solicitado: {cons?.qty_requested || 0} | 
                      Ordenado: {cons?.qty_ordered || 0} | 
                      Recibido: {cons?.qty_received || 0}
                    </span>
                  </div>

                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Received (green) */}
                    <div
                      className={`absolute top-0 left-0 h-full ${getProgressColor("recibido")}`}
                      style={{ width: `${Math.min(progress.received, 100)}%` }}
                    />
                    {/* Ordered (yellow) */}
                    <div
                      className={`absolute top-0 left-0 h-full ${getProgressColor("ordenado")}`}
                      style={{ width: `${Math.min(progress.ordered, 100)}%` }}
                    />
                    {/* Requested (purple) */}
                    <div
                      className={`absolute top-0 left-0 h-full ${getProgressColor("solicitado")}`}
                      style={{ width: `${Math.min(progress.requested, 100)}%` }}
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow">
                      {progress.requested.toFixed(1)}%
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-purple-500" />
                      <span>Solicitado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-yellow-500" />
                      <span>Ordenado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-500" />
                      <span>Recibido</span>
                    </div>
                  </div>
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
