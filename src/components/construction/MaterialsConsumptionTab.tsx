import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaterialsConsumption, useRegisterMaterialConsumption, useDeleteMaterialConsumption } from "@/hooks/useMaterialsConsumption";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Package } from "lucide-react";

interface MaterialsConsumptionTabProps {
  stageId: string;
  projectId: string;
}

export function MaterialsConsumptionTab({ stageId, projectId }: MaterialsConsumptionTabProps) {
  const { data: consumptions, isLoading } = useMaterialsConsumption(stageId);
  const registerMutation = useRegisterMaterialConsumption();
  const deleteMutation = useDeleteMaterialConsumption();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    budget_item_id: "",
    quantity_used: 0,
    unit_cost: 0,
    notes: "",
  });

  // Obtener partidas del presupuesto ejecutivo del proyecto
  const { data: budgetItems } = useQuery({
    queryKey: ["budget-items-for-consumption", projectId],
    queryFn: async () => {
      const { data: budgets } = await supabase
        .from("budgets")
        .select("id")
        .eq("project_id", projectId)
        .eq("type", "ejecutivo")
        .eq("status", "publicado")
        .order("version", { ascending: false })
        .limit(1);

      if (!budgets || budgets.length === 0) return [];

      const { data, error } = await supabase
        .from("budget_items")
        .select("*, tu_nodes!partida_id(name)")
        .eq("budget_id", budgets[0].id);

      if (error) throw error;
      return data;
    },
    enabled: dialogOpen,
  });

  const handleOpenDialog = () => {
    setFormData({ budget_item_id: "", quantity_used: 0, unit_cost: 0, notes: "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    registerMutation.mutate({
      stage_id: stageId,
      ...formData,
    });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este registro de consumo?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Consumo de Materiales
            </CardTitle>
            <Button onClick={handleOpenDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Consumo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando consumos...
            </div>
          ) : !consumptions || consumptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay consumos registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partida</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptions.map((consumption) => (
                  <TableRow key={consumption.id}>
                    <TableCell className="font-medium">
                      {consumption.budget_items?.descripcion || "—"}
                    </TableCell>
                    <TableCell>
                      {consumption.quantity_used} {consumption.budget_items?.unidad || ""}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(consumption.unit_cost)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(consumption.total)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {consumption.notes || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(consumption.created_at).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(consumption.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Consumo de Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Partida del Presupuesto *</Label>
              <Select
                value={formData.budget_item_id}
                onValueChange={(v) => {
                  const item = budgetItems?.find((i) => i.id === v);
                  setFormData({
                    ...formData,
                    budget_item_id: v,
                    unit_cost: item?.costo_unit || 0,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar partida" />
                </SelectTrigger>
                <SelectContent>
                  {budgetItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.descripcion} ({item.unidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cantidad Usada *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity_used}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity_used: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Costo Unitario *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_cost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Total</Label>
              <Input
                type="text"
                readOnly
                value={new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                }).format(formData.quantity_used * formData.unit_cost)}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.budget_item_id || formData.quantity_used <= 0}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
