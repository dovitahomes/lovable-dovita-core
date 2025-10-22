import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, Send, FileDown, Plus, Upload, Eye, EyeOff, 
  Share2, AlertTriangle, History, FileText 
} from "lucide-react";
import { BudgetItemRow } from "@/components/BudgetItemRow";
import { BudgetItemDialog } from "@/components/BudgetItemDialog";
import * as XLSX from 'xlsx';

interface BudgetItem {
  id?: string;
  mayor_id: string;
  partida_id: string;
  subpartida_id: string | null;
  descripcion: string;
  unidad: string;
  cant_real: number;
  desperdicio_pct: number;
  costo_unit: number;
  honorarios_pct: number;
  proveedor_alias: string;
  order_index: number;
}

export default function PresupuestoEjecutivo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'nuevo-ejecutivo';

  const [projectId, setProjectId] = useState("");
  const [ivaEnabled, setIvaEnabled] = useState(true);
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteView, setClienteView] = useState(false);
  const [sharedWithConstruction, setSharedWithConstruction] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('status', 'activo');
      if (error) throw error;
      return data;
    }
  });

  const { data: tuNodes } = useQuery({
    queryKey: ['tu_nodes_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('*')
        .eq('project_scope', 'global')
        .order('code');
      if (error) throw error;
      return data;
    }
  });

  const { data: budget } = useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, budget_items(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew
  });

  useEffect(() => {
    if (budget) {
      setProjectId(budget.project_id);
      setIvaEnabled(budget.iva_enabled);
      setNotas(budget.notas || "");
      setItems(budget.budget_items || []);
      setClienteView(budget.cliente_view_enabled);
      setSharedWithConstruction(budget.shared_with_construction);
    }
  }, [budget]);

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      let budgetId = id;

      if (isNew) {
        const { data: newBudget, error: budgetError } = await supabase
          .from('budgets')
          .insert({
            project_id: projectId,
            type: 'ejecutivo',
            iva_enabled: ivaEnabled,
            status: publish ? 'publicado' : 'borrador',
            notas,
            created_by: user.id,
            published_at: publish ? new Date().toISOString() : null,
            cliente_view_enabled: clienteView,
            shared_with_construction: sharedWithConstruction
          })
          .select()
          .single();

        if (budgetError) throw budgetError;
        budgetId = newBudget.id;
      } else {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({
            iva_enabled: ivaEnabled,
            status: publish ? 'publicado' : 'borrador',
            notas,
            published_at: publish ? new Date().toISOString() : null,
            cliente_view_enabled: clienteView,
            shared_with_construction: sharedWithConstruction
          })
          .eq('id', id!);

        if (updateError) throw updateError;
        await supabase.from('budget_items').delete().eq('budget_id', id!);
      }

      // Insert items and save to price history
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(
            items.map((item, idx) => ({
              budget_id: budgetId,
              mayor_id: item.mayor_id,
              partida_id: item.partida_id,
              subpartida_id: item.subpartida_id,
              descripcion: item.descripcion,
              unidad: item.unidad,
              cant_real: item.cant_real,
              desperdicio_pct: item.desperdicio_pct,
              costo_unit: item.costo_unit,
              honorarios_pct: item.honorarios_pct,
              proveedor_alias: item.proveedor_alias,
              order_index: idx
            }))
          );

        if (itemsError) throw itemsError;

        // Save prices to history for subpartidas
        for (const item of items) {
          if (item.subpartida_id && item.costo_unit > 0) {
            await supabase.rpc('save_price_history', {
              subpartida_id_param: item.subpartida_id,
              precio_param: item.costo_unit,
              unidad_param: item.unidad,
              proveedor_param: item.proveedor_alias
            });
          }
        }
      }

      return budgetId;
    },
    onSuccess: (budgetId) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      toast.success("Presupuesto guardado exitosamente");
      if (isNew) navigate(`/presupuestos/${budgetId}`);
    },
    onError: (error: any) => toast.error("Error al guardar: " + error.message)
  });

  const handleAddItem = () => {
    setSelectedItem({
      mayor_id: "",
      partida_id: "",
      subpartida_id: null,
      descripcion: "",
      unidad: "",
      cant_real: 0,
      desperdicio_pct: 0,
      costo_unit: 0,
      honorarios_pct: 0,
      proveedor_alias: "",
      order_index: items.length
    });
    setDialogOpen(true);
  };

  const handleEditItem = (index: number) => {
    setSelectedItem({ ...items[index] });
    setDialogOpen(true);
  };

  const handleSaveItem = (item: BudgetItem) => {
    if (selectedItem?.id) {
      setItems(items.map(i => i.id === selectedItem.id ? item : i));
    } else {
      setItems([...items, item]);
    }
    setDialogOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleExportExcel = () => {
    const exportData = items.map(item => {
      const mayor = tuNodes?.find(n => n.id === item.mayor_id);
      const partida = tuNodes?.find(n => n.id === item.partida_id);
      const subpartida = tuNodes?.find(n => n.id === item.subpartida_id);
      
      const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
      const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
      const total = cantNecesaria * precioUnit;

      if (clienteView) {
        return {
          'Mayor': mayor?.name,
          'Partida': partida?.name,
          'Subpartida': subpartida?.name,
          'Descripción': item.descripcion,
          'Unidad': item.unidad,
          'Cantidad': cantNecesaria,
          'Precio Unit.': precioUnit,
          'Total': total
        };
      } else {
        return {
          'Mayor': mayor?.name,
          'Partida': partida?.name,
          'Subpartida': subpartida?.name,
          'Descripción': item.descripcion,
          'Unidad': item.unidad,
          'Cant. Real': item.cant_real,
          'Desperdicio %': item.desperdicio_pct,
          'Cant. Necesaria': cantNecesaria,
          'Costo Unit.': item.costo_unit,
          'Honorarios %': item.honorarios_pct,
          'Precio Unit.': precioUnit,
          'Total': total,
          'Proveedor': item.proveedor_alias
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presupuesto");
    XLSX.writeFile(wb, `presupuesto-ejecutivo-${clienteView ? 'cliente' : 'interno'}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel exportado");
  };

  const handleSaveAsTemplate = async () => {
    const templateName = prompt("Nombre de la plantilla:");
    if (!templateName) return;

    const { error } = await supabase.from('budget_templates').insert({
      name: templateName,
      type: 'ejecutivo',
      items: JSON.stringify(items)
    } as any);

    if (error) {
      toast.error("Error al guardar plantilla");
    } else {
      toast.success("Plantilla guardada exitosamente");
    }
  };

  const calculateItemTotal = (item: BudgetItem) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    return cantNecesaria * precioUnit;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateIVA = () => {
    return ivaEnabled ? calculateSubtotal() * 0.16 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateIVA();
  };

  const handleShareWithConstruction = async () => {
    setSharedWithConstruction(!sharedWithConstruction);
    setClienteView(!sharedWithConstruction);
    toast.success(
      !sharedWithConstruction 
        ? "Se compartirá con construcción al publicar" 
        : "Se desvinculará de construcción al publicar"
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/presupuestos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <h1 className="text-3xl font-bold">
          {isNew ? 'Nuevo' : 'Editar'} Presupuesto Ejecutivo
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Proyecto *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.clients?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={ivaEnabled}
                onCheckedChange={(checked) => setIvaEnabled(checked as boolean)}
              />
              <label>Incluir IVA (16%)</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={clienteView}
                onCheckedChange={(checked) => setClienteView(checked as boolean)}
              />
              <label>Vista Cliente (ocultar datos sensibles)</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={sharedWithConstruction}
                onCheckedChange={handleShareWithConstruction}
              />
              <label>Compartir con Construcción</label>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Partidas:</span>
              <span className="font-semibold">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calculateSubtotal())}
              </span>
            </div>
            {ivaEnabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (16%):</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calculateIVA())}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg border-t pt-2">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-primary">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calculateTotal())}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Partidas - Vista {clienteView ? 'Cliente' : 'Interna'}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setClienteView(!clienteView)}>
                {clienteView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileDown className="h-4 w-4 mr-2" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveAsTemplate}>
                <FileText className="h-4 w-4 mr-2" /> Plantilla
              </Button>
              <Button size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" /> Agregar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-1">
              {items.map((item, idx) => (
                <BudgetItemRow
                  key={idx}
                  item={item}
                  index={idx}
                  tuNodes={tuNodes || []}
                  clienteView={clienteView}
                  onEdit={handleEditItem}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Agrega partidas al presupuesto ejecutivo
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => saveMutation.mutate(false)}>
          <Save className="h-4 w-4 mr-2" /> Guardar Borrador
        </Button>
        <Button onClick={() => saveMutation.mutate(true)}>
          <Send className="h-4 w-4 mr-2" /> Publicar
        </Button>
        {sharedWithConstruction && (
          <Button variant="secondary">
            <Share2 className="h-4 w-4 mr-2" /> Compartido con Construcción
          </Button>
        )}
      </div>

      {selectedItem && (
        <BudgetItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={selectedItem}
          tuNodes={tuNodes || []}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}