import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { ExecutiveBudgetItem, TUNode } from "../ExecutiveBudgetWizard";
import { cn } from "@/lib/utils";

interface StepItemsConfigProps {
  selectedSubpartidas: TUNode[];
  items: ExecutiveBudgetItem[];
  onItemsChange: (items: ExecutiveBudgetItem[]) => void;
}

export function StepItemsConfig({
  selectedSubpartidas,
  items,
  onItemsChange,
}: StepItemsConfigProps) {
  
  const handleAddItem = (subpartida: TUNode) => {
    const newItem: ExecutiveBudgetItem = {
      mayor_id: "",
      partida_id: "",
      subpartida_id: subpartida.id,
      descripcion: subpartida.name,
      unidad: "pieza",
      cant_real: 1,
      desperdicio_pct: 0,
      costo_unit: 0,
      honorarios_pct: 0,
      proveedor_alias: "",
      order_index: items.length,
    };
    onItemsChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ExecutiveBudgetItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    onItemsChange(updatedItems);
  };

  const calculateItemTotal = (item: ExecutiveBudgetItem) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    return cantNecesaria * precioUnit;
  };

  const getItemsBySubpartida = (subpartidaId: string) => {
    return items.filter(item => item.subpartida_id === subpartidaId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Configuración de Items</h3>
        <p className="text-muted-foreground">
          Agrega y configura los items de cada subpartida seleccionada
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{selectedSubpartidas.length}</div>
            <div className="text-sm text-muted-foreground">Subpartidas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{items.length}</div>
            <div className="text-sm text-muted-foreground">Items Totales</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(items.reduce((sum, item) => sum + calculateItemTotal(item), 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Estimado</div>
          </CardContent>
        </Card>
      </div>

      {/* Items by Subpartida */}
      <div className="space-y-4">
        {selectedSubpartidas.map((subpartida) => {
          const subpartidaItems = getItemsBySubpartida(subpartida.id);

          return (
            <Card key={subpartida.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="secondary">{subpartida.code}</Badge>
                    <span>{subpartida.name}</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddItem(subpartida)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {subpartidaItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Agrega al menos un item para esta subpartida</p>
                  </div>
                ) : (
                  subpartidaItems.map((item, itemIndex) => {
                    const globalIndex = items.findIndex(i => i === item);
                    const total = calculateItemTotal(item);

                    return (
                      <div
                        key={globalIndex}
                        className="grid grid-cols-12 gap-2 p-3 rounded-lg border bg-muted/30 items-center"
                      >
                        {/* Descripción */}
                        <div className="col-span-12 md:col-span-3">
                          <Input
                            placeholder="Descripción"
                            value={item.descripcion}
                            onChange={(e) => handleUpdateItem(globalIndex, 'descripcion', e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        {/* Unidad */}
                        <div className="col-span-6 md:col-span-2">
                          <Input
                            placeholder="Unidad"
                            value={item.unidad}
                            onChange={(e) => handleUpdateItem(globalIndex, 'unidad', e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        {/* Cantidad Real */}
                        <div className="col-span-6 md:col-span-1">
                          <Input
                            type="number"
                            placeholder="Cant."
                            value={item.cant_real}
                            onChange={(e) => handleUpdateItem(globalIndex, 'cant_real', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        {/* Desperdicio % */}
                        <div className="col-span-6 md:col-span-1">
                          <Input
                            type="number"
                            placeholder="Desp%"
                            value={item.desperdicio_pct}
                            onChange={(e) => handleUpdateItem(globalIndex, 'desperdicio_pct', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                            min="0"
                            step="0.1"
                          />
                        </div>

                        {/* Costo Unit */}
                        <div className="col-span-6 md:col-span-2">
                          <Input
                            type="number"
                            placeholder="Costo Unit."
                            value={item.costo_unit}
                            onChange={(e) => handleUpdateItem(globalIndex, 'costo_unit', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        {/* Honorarios % */}
                        <div className="col-span-6 md:col-span-1">
                          <Input
                            type="number"
                            placeholder="Hon%"
                            value={item.honorarios_pct}
                            onChange={(e) => handleUpdateItem(globalIndex, 'honorarios_pct', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                            min="0"
                            step="0.1"
                          />
                        </div>

                        {/* Proveedor */}
                        <div className="col-span-8 md:col-span-1">
                          <Input
                            placeholder="Prov"
                            value={item.proveedor_alias}
                            onChange={(e) => handleUpdateItem(globalIndex, 'proveedor_alias', e.target.value)}
                            className="text-sm"
                            maxLength={6}
                          />
                        </div>

                        {/* Total + Delete */}
                        <div className="col-span-4 md:col-span-1 flex items-center justify-end gap-2">
                          <span className={cn(
                            "text-sm font-semibold whitespace-nowrap",
                            total > 0 ? "text-primary" : "text-muted-foreground"
                          )}>
                            {formatCurrency(total)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(globalIndex)}
                            className="h-8 w-8 p-0 shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
