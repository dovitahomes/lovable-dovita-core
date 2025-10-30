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
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, FileDown, Plus, Trash2, ChevronDown } from "lucide-react";
import { generateBudgetPDF } from "@/utils/pdfGenerator";
import { useProviders } from "@/hooks/useProviders";

interface BudgetItem {
  id?: string;
  mayor_id: string;
  partida_id: string;
  subpartida_id: null;
  descripcion: string;
  unidad: string;
  cant_real: number;
  desperdicio_pct: number;
  costo_unit: number;
  honorarios_pct: number;
  order_index: number;
  provider_id?: string;
}

export default function BudgetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [ivaEnabled, setIvaEnabled] = useState(true);
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [expandedMayores, setExpandedMayores] = useState<Set<string>>(new Set());

  const { data: budget, isLoading } = useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, budget_items(*), projects(*, clients(*))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
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

  const { data: providers } = useProviders();

  useEffect(() => {
    if (budget) {
      setIvaEnabled(budget.iva_enabled);
      setNotas(budget.notas || "");
      // Map budget_items to our BudgetItem interface
      const mappedItems = (budget.budget_items || []).map(item => ({
        id: item.id,
        mayor_id: item.mayor_id,
        partida_id: item.partida_id || "",
        subpartida_id: null,
        descripcion: item.descripcion || "",
        unidad: item.unidad,
        cant_real: item.cant_real,
        desperdicio_pct: item.desperdicio_pct,
        costo_unit: item.costo_unit,
        honorarios_pct: item.honorarios_pct,
        order_index: item.order_index,
        provider_id: item.provider_id
      }));
      setItems(mappedItems);
    }
  }, [budget]);

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
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

      await supabase.from('budget_items').delete().eq('budget_id', id!);

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('budget_items')
              .insert(
            items.map((item, idx) => ({
              budget_id: id,
              mayor_id: item.mayor_id,
              partida_id: item.partida_id,
              subpartida_id: null,
              descripcion: item.descripcion,
              unidad: item.unidad || 'pieza',
              cant_real: item.cant_real || 1,
              desperdicio_pct: item.desperdicio_pct || 0,
              costo_unit: item.costo_unit || 0,
              honorarios_pct: item.honorarios_pct || 0,
              provider_id: item.provider_id || null,
              order_index: idx
            }))
          );

        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      toast.success("Presupuesto guardado");
    },
    onError: (error: any) => toast.error("Error: " + error.message)
  });

  const handleAddPartida = (mayorId: string) => {
    setItems([...items, {
      mayor_id: mayorId,
      partida_id: "",
      subpartida_id: null,
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
    const cantNecesaria = item.cant_real * (1 + (item.desperdicio_pct || 0) / 100);
    const precioUnit = item.costo_unit * (1 + (item.honorarios_pct || 0) / 100);
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

  const toggleMayor = (mayorId: string) => {
    const newExpanded = new Set(expandedMayores);
    if (newExpanded.has(mayorId)) {
      newExpanded.delete(mayorId);
    } else {
      newExpanded.add(mayorId);
    }
    setExpandedMayores(newExpanded);
  };

  const getPartidasForMayor = (mayorId: string) => {
    return partidas?.filter(p => p.parent_id === mayorId) || [];
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Cargando...</div>;
  }

  if (!budget) {
    return <div className="container mx-auto p-6">No se encontró el presupuesto</div>;
  }

  if (budget.type !== 'parametrico') {
    return <div className="container mx-auto p-6">Este editor es solo para presupuestos paramétricos</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/erp/budgets')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <h1 className="text-3xl font-bold">
          Presupuesto Paramétrico - {budget.projects?.clients?.name}
        </h1>
        <Badge>{budget.status === 'publicado' ? 'Publicado' : 'Borrador'}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          <CardTitle>Partidas por Mayor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mayores?.map((mayor) => {
            const mayorItems = items.filter(item => item.mayor_id === mayor.id);
            const mayorPartidas = getPartidasForMayor(mayor.id);
            const isExpanded = expandedMayores.has(mayor.id);

            return (
              <Collapsible key={mayor.id} open={isExpanded} onOpenChange={() => toggleMayor(mayor.id)}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                          <CardTitle className="text-lg">{mayor.code} - {mayor.name}</CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calculateMayorSubtotal(mayor.id))}
                        </Badge>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3 pt-3">
                      {mayorItems.map((item, idx) => {
                        const globalIdx = items.findIndex(i => i === item);
                        return (
                          <div key={globalIdx} className="border rounded-lg p-3 space-y-3">
                             <div className="flex justify-between items-start">
                              <div className="grid grid-cols-3 gap-3 flex-1">
                                <div>
                                  <Label>Partida *</Label>
                                  <Select
                                    value={item.partida_id}
                                    onValueChange={(v) => {
                                      handleItemChange(globalIdx, 'partida_id', v);
                                      const partida = mayorPartidas.find(p => p.id === v);
                                      if (partida) {
                                        handleItemChange(globalIdx, 'descripcion', partida.name);
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {mayorPartidas.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                          {p.code} - {p.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Proveedor</Label>
                                  <Select
                                    value={item.provider_id || ""}
                                    onValueChange={(v) => handleItemChange(globalIdx, 'provider_id', v || undefined)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Opcional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Sin proveedor</SelectItem>
                                      {providers?.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                          {p.code_short} - {p.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Monto *</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.costo_unit}
                                    onChange={(e) => handleItemChange(globalIdx, 'costo_unit', parseFloat(e.target.value) || 0)}
                                  />
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
                            <div className="text-right text-sm">
                              <span className="text-muted-foreground">Total: </span>
                              <span className="font-semibold">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(calculateItemTotal(item))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPartida(mayor.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Partida
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => saveMutation.mutate(false)}>
          <Save className="h-4 w-4 mr-2" /> Guardar Borrador
        </Button>
        <Button onClick={() => saveMutation.mutate(true)}>
          <Send className="h-4 w-4 mr-2" /> Publicar
        </Button>
      </div>
    </div>
  );
}
