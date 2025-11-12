import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { ExecutiveBudgetItem, TUNode } from "./ExecutiveBudgetWizard";
import { cn } from "@/lib/utils";

interface VirtualizedBudgetItemsTableProps {
  subpartida: TUNode;
  items: ExecutiveBudgetItem[];
  allItems: ExecutiveBudgetItem[];
  onUpdateItem: (index: number, field: keyof ExecutiveBudgetItem, value: any) => void;
  onRemoveItem: (index: number) => void;
}

export function VirtualizedBudgetItemsTable({
  subpartida,
  items,
  allItems,
  onUpdateItem,
  onRemoveItem,
}: VirtualizedBudgetItemsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const calculateItemTotal = (item: ExecutiveBudgetItem) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    return cantNecesaria * precioUnit;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  return (
    <div className="space-y-3">
      {/* Subpartida Header with Subtotal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {subpartida.code}
          </Badge>
          <span className="font-semibold">{subpartida.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Badge>
          <span className="text-sm font-bold text-primary">
            Subtotal: {formatCurrency(subtotal)}
          </span>
        </div>
      </div>

      {/* Virtualized Table */}
      <div
        ref={parentRef}
        className="border rounded-lg overflow-auto"
        style={{ height: '400px' }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow>
              <TableHead className="min-w-[200px]">Descripción</TableHead>
              <TableHead className="min-w-[100px]">Unidad</TableHead>
              <TableHead className="min-w-[90px] text-right">Cant. Real</TableHead>
              <TableHead className="min-w-[80px] text-right">Desp. %</TableHead>
              <TableHead className="min-w-[100px] text-right">Cant. Nec.</TableHead>
              <TableHead className="min-w-[120px] text-right">Costo Unit.</TableHead>
              <TableHead className="min-w-[80px] text-right">Hon. %</TableHead>
              <TableHead className="min-w-[120px] text-right">Precio Unit.</TableHead>
              <TableHead className="min-w-[100px]">Proveedor</TableHead>
              <TableHead className="min-w-[120px] text-right sticky right-10 bg-background">Total</TableHead>
              <TableHead className="w-[60px] sticky right-0 bg-background">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const item = items[virtualRow.index];
              const globalIndex = allItems.findIndex(i => i === item);
              const total = calculateItemTotal(item);

              return (
                <TableRow
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  className="hover:bg-muted/50 absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    height: '56px',
                  }}
                >
                  {/* Descripción */}
                  <TableCell className="min-w-[200px]">
                    <Input
                      placeholder="Descripción del item"
                      value={item.descripcion}
                      onChange={(e) => onUpdateItem(globalIndex, 'descripcion', e.target.value)}
                      className="text-sm h-8"
                    />
                  </TableCell>

                  {/* Unidad */}
                  <TableCell className="min-w-[100px]">
                    <Input
                      placeholder="Unidad"
                      value={item.unidad}
                      onChange={(e) => onUpdateItem(globalIndex, 'unidad', e.target.value)}
                      className="text-sm h-8"
                    />
                  </TableCell>

                  {/* Cantidad Real */}
                  <TableCell className="min-w-[90px]">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={item.cant_real}
                      onChange={(e) => onUpdateItem(globalIndex, 'cant_real', parseFloat(e.target.value) || 0)}
                      className="text-sm h-8 text-right"
                      min="0"
                      step="0.01"
                    />
                  </TableCell>

                  {/* Desperdicio % */}
                  <TableCell className="min-w-[80px]">
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.desperdicio_pct}
                      onChange={(e) => onUpdateItem(globalIndex, 'desperdicio_pct', parseFloat(e.target.value) || 0)}
                      className="text-sm h-8 text-right"
                      min="0"
                      step="0.1"
                    />
                  </TableCell>

                  {/* Cantidad Necesaria (Calculada) */}
                  <TableCell className="min-w-[100px] text-right">
                    <span className="text-sm text-muted-foreground font-mono">
                      {(item.cant_real * (1 + item.desperdicio_pct / 100)).toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Costo Unitario */}
                  <TableCell className="min-w-[120px]">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={item.costo_unit}
                      onChange={(e) => onUpdateItem(globalIndex, 'costo_unit', parseFloat(e.target.value) || 0)}
                      className="text-sm h-8 text-right"
                      min="0"
                      step="0.01"
                    />
                  </TableCell>

                  {/* Honorarios % */}
                  <TableCell className="min-w-[80px]">
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.honorarios_pct}
                      onChange={(e) => onUpdateItem(globalIndex, 'honorarios_pct', parseFloat(e.target.value) || 0)}
                      className="text-sm h-8 text-right"
                      min="0"
                      step="0.1"
                    />
                  </TableCell>

                  {/* Precio Unitario (Calculado) */}
                  <TableCell className="min-w-[120px] text-right">
                    <span className="text-sm font-medium font-mono">
                      ${(item.costo_unit * (1 + item.honorarios_pct / 100)).toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Proveedor */}
                  <TableCell className="min-w-[100px]">
                    <Input
                      placeholder="Prov"
                      value={item.proveedor_alias}
                      onChange={(e) => onUpdateItem(globalIndex, 'proveedor_alias', e.target.value)}
                      className="text-sm h-8"
                      maxLength={6}
                    />
                  </TableCell>

                  {/* Total */}
                  <TableCell className="min-w-[120px] text-right sticky right-10 bg-background">
                    <span className={cn(
                      "text-sm font-bold font-mono",
                      total > 0 ? "text-primary" : "text-muted-foreground"
                    )}>
                      {formatCurrency(total)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="w-[60px] sticky right-0 bg-background">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(globalIndex)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
