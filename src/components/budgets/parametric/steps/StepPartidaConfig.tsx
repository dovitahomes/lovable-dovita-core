import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Calculator, FileText } from "lucide-react";
import { toast } from "sonner";
import { BudgetItem, Mayor } from "../ParametricBudgetWizard";
import { cn } from "@/lib/utils";
import { PartidaSearch } from "../PartidaSearch";
import { CostCalculator } from "../CostCalculator";
import { TemplateSelector } from "../TemplateSelector";
import { PriceAlert } from "../PriceAlert";

interface StepPartidaConfigProps {
  selectedMayores: Mayor[];
  items: BudgetItem[];
  onItemsChange: (items: BudgetItem[]) => void;
}

export function StepPartidaConfig({ selectedMayores, items, onItemsChange }: StepPartidaConfigProps) {
  const [expandedMayor, setExpandedMayor] = useState<string | null>(
    selectedMayores.length > 0 ? selectedMayores[0].id : null
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [calculatorItemIndex, setCalculatorItemIndex] = useState<number | null>(null);
  const [templateMayorId, setTemplateMayorId] = useState<string | null>(null);

  const { data: partidas, isLoading } = useQuery({
    queryKey: ['tu_partidas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('*')
        .eq('type', 'partida')
        .order('code');
      if (error) throw error;
      return data;
    },
  });

  const handleAddItem = (mayorId: string) => {
    const newItem: BudgetItem = {
      mayor_id: mayorId,
      partida_id: "",
      descripcion: "",
      unidad: "pieza",
      cant_real: 1,
      desperdicio_pct: 0,
      costo_unit: 0,
      honorarios_pct: 15,
      order_index: items.length,
    };
    onItemsChange([...items, newItem]);
  };

  const handlePartidaSelect = (partida: any, mayorId: string) => {
    const newItem: BudgetItem = {
      mayor_id: mayorId,
      partida_id: partida.id,
      descripcion: partida.name,
      unidad: "pieza",
      cant_real: 1,
      desperdicio_pct: 0,
      costo_unit: 0,
      honorarios_pct: 15,
      order_index: items.length,
    };
    onItemsChange([...items, newItem]);
    toast.success(`Partida "${partida.name}" agregada`);
  };

  const handleOpenCalculator = (index: number) => {
    setCalculatorItemIndex(index);
    setShowCalculator(true);
  };

  const handleApplyCalculator = (values: {
    costo_unit: number;
    cant_real: number;
    desperdicio_pct: number;
    honorarios_pct: number;
  }) => {
    if (calculatorItemIndex === null) return;
    const newItems = [...items];
    newItems[calculatorItemIndex] = {
      ...newItems[calculatorItemIndex],
      ...values,
    };
    onItemsChange(newItems);
    setCalculatorItemIndex(null);
  };

  const handleOpenTemplateSelector = (mayorId: string) => {
    setTemplateMayorId(mayorId);
    setShowTemplateSelector(true);
  };

  const handleApplyTemplate = (templateItems: BudgetItem[]) => {
    onItemsChange([...items, ...templateItems]);
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  };

  const calculateItemTotal = (item: BudgetItem) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    return cantNecesaria * precioUnit;
  };

  const calculateMayorSubtotal = (mayorId: string) => {
    return items
      .filter((item) => item.mayor_id === mayorId)
      .reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const getMayorItems = (mayorId: string) => {
    return items.filter((item) => item.mayor_id === mayorId);
  };

  const getPartidasForMayor = (mayorId: string) => {
    return partidas?.filter((p) => p.parent_id === mayorId) || [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Configuración de Partidas</h3>
        <p className="text-muted-foreground">
          Agrega partidas y configura costos para cada mayor seleccionado
        </p>
      </div>

      {selectedMayores.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay mayores seleccionados</p>
              <p className="text-sm mt-1">Regresa al paso anterior para seleccionar mayores</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {selectedMayores.map((mayor) => {
            const mayorItems = getMayorItems(mayor.id);
            const mayorPartidas = getPartidasForMayor(mayor.id);
            const isExpanded = expandedMayor === mayor.id;

            return (
              <Card key={mayor.id} className="border-2">
                <CardHeader
                  className={cn(
                    "cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    isExpanded && "bg-muted/50"
                  )}
                  onClick={() => setExpandedMayor(isExpanded ? null : mayor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                        {mayor.code}
                      </Badge>
                      <CardTitle className="text-lg">{mayor.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {mayorItems.length} partida{mayorItems.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Subtotal: </span>
                      <span className="font-bold text-primary">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(calculateMayorSubtotal(mayor.id))}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-4 space-y-4">
                    {/* Search and Actions */}
                    <div className="space-y-3">
                      <PartidaSearch
                        partidas={partidas || []}
                        mayorId={mayor.id}
                        onSelect={(partida) => handlePartidaSelect(partida, mayor.id)}
                      />

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddItem(mayor.id)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Partida
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTemplateSelector(mayor.id)}
                          className="flex-1"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Usar Template
                        </Button>
                      </div>
                    </div>

                    {/* Items List */}
                    {mayorItems.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No hay partidas. Haz clic en "Agregar Partida" para comenzar.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item, globalIdx) => {
                          if (item.mayor_id !== mayor.id) return null;

                          const partida = partidas?.find((p) => p.id === item.partida_id);

                          return (
                            <div
                              key={globalIdx}
                              className="border rounded-lg p-3 space-y-3 bg-background"
                            >
                              <div className="flex gap-3">
                                {/* Partida Selection */}
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">Partida *</Label>
                                  <Select
                                    value={item.partida_id}
                                    onValueChange={(v) => {
                                      handleItemChange(globalIdx, 'partida_id', v);
                                      const p = partidas?.find((p) => p.id === v);
                                      if (p) handleItemChange(globalIdx, 'descripcion', p.name);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 bg-background">
                                      <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background/95 backdrop-blur-sm border-border z-50">
                                      {mayorPartidas.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                          {p.code} - {p.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Description */}
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">Descripción</Label>
                                  <Input
                                    className="h-9"
                                    value={item.descripcion}
                                    onChange={(e) =>
                                      handleItemChange(globalIdx, 'descripcion', e.target.value)
                                    }
                                    placeholder={partida?.name || ''}
                                  />
                                </div>

                                {/* Remove Button */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(globalIdx)}
                                  className="h-9 w-9 p-0 mt-5"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>

                              {/* Price Alert */}
                              {item.partida_id && item.costo_unit > 0 && (
                                <PriceAlert
                                  partidaId={item.partida_id}
                                  currentPrice={item.costo_unit}
                                  className="mb-2"
                                />
                              )}

                              {/* Numeric Fields */}
                              <div className="flex items-end gap-2 mb-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenCalculator(globalIdx)}
                                  className="gap-2"
                                >
                                  <Calculator className="h-4 w-4" />
                                  Calculadora
                                </Button>
                              </div>

                              <div className="grid grid-cols-5 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Costo Unit. *</Label>
                                  <Input
                                    className="h-9"
                                    type="number"
                                    step="0.01"
                                    value={item.costo_unit}
                                    onChange={(e) =>
                                      handleItemChange(globalIdx, 'costo_unit', parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Cantidad *</Label>
                                  <Input
                                    className="h-9"
                                    type="number"
                                    step="0.01"
                                    value={item.cant_real}
                                    onChange={(e) =>
                                      handleItemChange(globalIdx, 'cant_real', parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Unidad</Label>
                                  <Input
                                    className="h-9"
                                    value={item.unidad}
                                    onChange={(e) =>
                                      handleItemChange(globalIdx, 'unidad', e.target.value)
                                    }
                                    placeholder="pieza"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Desp. %</Label>
                                  <Input
                                    className="h-9"
                                    type="number"
                                    step="0.01"
                                    value={item.desperdicio_pct}
                                    onChange={(e) =>
                                      handleItemChange(globalIdx, 'desperdicio_pct', parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs">Honor. %</Label>
                                  <Input
                                    className="h-9"
                                    type="number"
                                    step="0.01"
                                    value={item.honorarios_pct}
                                    onChange={(e) =>
                                      handleItemChange(globalIdx, 'honorarios_pct', parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </div>
                              </div>

                              {/* Total */}
                              <div className="flex justify-end pt-2 border-t">
                                <div className="text-right">
                                  <span className="text-xs text-muted-foreground">Total: </span>
                                  <span className="font-bold text-sm">
                                    {new Intl.NumberFormat('es-MX', {
                                      style: 'currency',
                                      currency: 'MXN',
                                    }).format(calculateItemTotal(item))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Cost Calculator Modal */}
      {calculatorItemIndex !== null && (
        <CostCalculator
          open={showCalculator}
          onClose={() => {
            setShowCalculator(false);
            setCalculatorItemIndex(null);
          }}
          onApply={handleApplyCalculator}
          initialValues={items[calculatorItemIndex]}
        />
      )}

      {/* Template Selector Modal */}
      {templateMayorId && (
        <TemplateSelector
          open={showTemplateSelector}
          onClose={() => {
            setShowTemplateSelector(false);
            setTemplateMayorId(null);
          }}
          mayorId={templateMayorId}
          onApplyTemplate={handleApplyTemplate}
        />
      )}
    </div>
  );
}
