import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Table as TableIcon } from "lucide-react";
import { ExecutiveBudgetItem, TUNode } from "../ExecutiveBudgetWizard";
import { VirtualizedBudgetItemsTable } from "../VirtualizedBudgetItemsTable";

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

      {/* Virtualized Items Table by Subpartida */}
      <div className="space-y-6">
        {selectedSubpartidas.map((subpartida) => {
          const subpartidaItems = getItemsBySubpartida(subpartida.id);

          return (
            <Card key={subpartida.id}>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TableIcon className="h-5 w-5 text-primary" />
                    <span>Items de Subpartida</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleAddItem(subpartida)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {subpartidaItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-1">Sin items configurados</p>
                    <p className="text-xs">Agrega al menos un item para esta subpartida</p>
                  </div>
                ) : (
                  <VirtualizedBudgetItemsTable
                    subpartida={subpartida}
                    items={subpartidaItems}
                    allItems={items}
                    onUpdateItem={handleUpdateItem}
                    onRemoveItem={handleRemoveItem}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
