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
import { toast } from "sonner";
import { ArrowLeft, Save, Send, FileDown, Plus, Trash2 } from "lucide-react";
import { generateBudgetPDF } from "@/utils/pdfGenerator";

interface BudgetItem {
  id?: string;
  mayor_id: string;
  partida_id: string;
  descripcion: string;
  unidad: string;
  cant_real: number;
  desperdicio_pct: number;
  costo_unit: number;
  honorarios_pct: number;
  order_index: number;
}

export default function PresupuestoParametrico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'nuevo';

  const [projectId, setProjectId] = useState("");
  const [ivaEnabled, setIvaEnabled] = useState(true);
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [selectedMayor, setSelectedMayor] = useState("");

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

  const { data: mayores } = useQuery({
    queryKey: ['tu_mayores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('*')
        .eq('type', 'mayor')
        .eq('project_scope', 'global')
        .order('code');
      if (error) throw error;
      return data;
    }
  });

  const { data: partidas } = useQuery({
    queryKey: ['tu_partidas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('*')
        .eq('type', 'partida')
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
            type: 'parametrico',
            iva_enabled: ivaEnabled,
            status: publish ? 'publicado' : 'borrador',
            notas,
            created_by: user.id,
            published_at: publish ? new Date().toISOString() : null
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
            published_at: publish ? new Date().toISOString() : null
          })
          .eq('id', id!);

        if (updateError) throw updateError;

        // Delete existing items
        await supabase.from('budget_items').delete().eq('budget_id', id!);
      }

      // Insert items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(
            items.map((item, idx) => ({
              budget_id: budgetId,
              mayor_id: item.mayor_id,
              partida_id: item.partida_id,
              subpartida_id: null,
              descripcion: item.descripcion,
              unidad: item.unidad || 'pieza',
              cant_real: item.cant_real || 1,
              desperdicio_pct: item.desperdicio_pct || 0,
              costo_unit: item.costo_unit || 0,
              honorarios_pct: item.honorarios_pct || 0,
              order_index: idx
            }))
          );

        if (itemsError) throw itemsError;
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
    if (!selectedMayor) {
      toast.error("Selecciona un mayor primero");
      return;
    }

    setItems([...items, {
      mayor_id: selectedMayor,
      partida_id: "",
      descripcion: "",
      unidad: "pieza",
      cant_real: 1,
      desperdicio_pct: 0,
      costo_unit: 0,
      honorarios_pct: 0,
      order_index: items.length
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: BudgetItem) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    return cantNecesaria * precioUnit;
  };

  const calculateMayorSubtotal = (mayorId: string) => {
    return items
      .filter(item => item.mayor_id === mayorId)
      .reduce((sum, item) => sum + calculateItemTotal(item), 0);
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

  const getMayoresUsed = () => {
    const mayorIds = [...new Set(items.map(item => item.mayor_id))];
    return mayores?.filter(m => mayorIds.includes(m.id)) || [];
  };

  const handleExportPDF = async () => {
    if (!projectId) {
      toast.error("Selecciona un proyecto");
      return;
    }

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('*, clients(*)')
        .eq('id', projectId)
        .single();

      const { data: corporateContent } = await supabase
        .from('contenido_corporativo')
        .select('*')
        .limit(1)
        .maybeSingle();

      // Preparar items agrupados por mayor para el PDF
      const itemsWithDetails = items.map(item => {
        const mayor = mayores?.find(m => m.id === item.mayor_id);
        const partida = partidas?.find(p => p.id === item.partida_id);
        return {
          ...item,
          mayor_code: mayor?.code || '',
          mayor_name: mayor?.name || '',
          partida_code: partida?.code || '',
          partida_name: partida?.name || item.descripcion || '',
          total_item: calculateItemTotal(item)
        };
      });

      generateBudgetPDF({
        budget: {
          type: 'parametrico',
          version: budget?.version || 1,
          iva_enabled: ivaEnabled,
          notas
        },
        project,
        items: itemsWithDetails,
        corporateContent,
        subtotal: calculateSubtotal(),
        iva: calculateIVA(),
        total: calculateTotal()
      });

      toast.success("PDF generado correctamente");
    } catch (error: any) {
      toast.error("Error al generar PDF: " + error.message);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/presupuestos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <h1 className="text-3xl font-bold">
          {isNew ? 'Nuevo' : 'Editar'} Presupuesto Paramétrico
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
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
                      {p.clients?.name} - Proyecto
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

            <div>
              <Label>Notas</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <CardTitle>Partidas del Presupuesto</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedMayor} onValueChange={setSelectedMayor}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar mayor para agregar" />
                </SelectTrigger>
                <SelectContent>
                  {mayores?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem} disabled={!selectedMayor}>
                <Plus className="h-4 w-4 mr-2" /> Agregar Partida
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-6">
              {getMayoresUsed().map((mayor) => {
                const mayorItems = items.filter(item => item.mayor_id === mayor.id);
                return (
                  <Card key={mayor.id} className="border-2">
                    <CardHeader className="bg-muted/50">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          {mayor.code} - {mayor.name}
                        </CardTitle>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">Subtotal: </span>
                          <span className="font-bold text-primary">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calculateMayorSubtotal(mayor.id))}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {mayorItems.map((item, idx) => {
                        const globalIdx = items.findIndex(i => i === item);
                        const partida = partidas?.find(p => p.id === item.partida_id);
                        return (
                          <div key={globalIdx} className="border rounded-lg p-3 space-y-3 bg-background">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Partida *</Label>
                                    <Select
                                      value={item.partida_id}
                                      onValueChange={(v) => {
                                        handleItemChange(globalIdx, 'partida_id', v);
                                        const p = partidas?.find(p => p.id === v);
                                        if (p) handleItemChange(globalIdx, 'descripcion', p.name);
                                      }}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Seleccionar" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {partidas?.filter(p => p.parent_id === mayor.id).map((p) => (
                                          <SelectItem key={p.id} value={p.id}>
                                            {p.code} - {p.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Descripción</Label>
                                    <Input
                                      className="h-9"
                                      value={item.descripcion}
                                      onChange={(e) => handleItemChange(globalIdx, 'descripcion', e.target.value)}
                                      placeholder={partida?.name || ''}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                  <div>
                                    <Label className="text-xs">Costo *</Label>
                                    <Input
                                      className="h-9"
                                      type="number"
                                      step="0.01"
                                      value={item.costo_unit}
                                      onChange={(e) => handleItemChange(globalIdx, 'costo_unit', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Unidad</Label>
                                    <Input
                                      className="h-9"
                                      value={item.unidad}
                                      onChange={(e) => handleItemChange(globalIdx, 'unidad', e.target.value)}
                                      placeholder="pieza"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Cantidad</Label>
                                    <Input
                                      className="h-9"
                                      type="number"
                                      step="0.01"
                                      value={item.cant_real}
                                      onChange={(e) => handleItemChange(globalIdx, 'cant_real', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Total</Label>
                                    <div className="h-9 flex items-center font-semibold text-sm">
                                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calculateItemTotal(item))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(globalIdx)}
                                className="ml-2"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Selecciona un mayor y agrega partidas al presupuesto
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
        <Button variant="secondary" onClick={handleExportPDF}>
          <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
        </Button>
      </div>
    </div>
  );
}