import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface BudgetItem {
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
}

interface BudgetItemRowProps {
  item: BudgetItem;
  index: number;
  tuNodes: any[];
  clienteView: boolean;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function BudgetItemRow({
  item,
  index,
  tuNodes,
  clienteView,
  onEdit,
  onRemove
}: BudgetItemRowProps) {
  const mayor = tuNodes.find(n => n.id === item.mayor_id);
  const partida = tuNodes.find(n => n.id === item.partida_id);
  const subpartida = item.subpartida_id ? tuNodes.find(n => n.id === item.subpartida_id) : null;

  const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
  const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
  const total = cantNecesaria * precioUnit;

  if (clienteView) {
    return (
      <div className="grid grid-cols-8 gap-2 p-2 hover:bg-muted/50 rounded-lg text-sm border-b">
        <div className="col-span-2">
          <div className="font-medium">{mayor?.name}</div>
          <div className="text-xs text-muted-foreground">{partida?.name}</div>
          {subpartida && <div className="text-xs text-muted-foreground">{subpartida.name}</div>}
        </div>
        <div className="col-span-2 text-sm">{item.descripcion}</div>
        <div className="text-center">{item.unidad}</div>
        <div className="text-right">{cantNecesaria.toFixed(2)}</div>
        <div className="text-right">
          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precioUnit)}
        </div>
        <div className="text-right font-semibold">
          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-2 p-2 hover:bg-muted/50 rounded-lg group text-sm border-b">
      <div className="col-span-2">
        <div className="font-medium text-xs">{mayor?.name}</div>
        <div className="text-xs text-muted-foreground">{partida?.name}</div>
        {subpartida && <div className="text-xs text-muted-foreground">{subpartida.name}</div>}
      </div>
      <div className="text-xs">{item.descripcion}</div>
      <div className="text-center text-xs">{item.unidad}</div>
      <div className="text-right text-xs">{item.cant_real.toFixed(2)}</div>
      <div className="text-center text-xs">{item.desperdicio_pct}%</div>
      <div className="text-right text-xs">{cantNecesaria.toFixed(2)}</div>
      <div className="text-right text-xs">
        ${item.costo_unit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </div>
      <div className="text-center text-xs">{item.honorarios_pct}%</div>
      <div className="text-right text-xs">
        ${precioUnit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </div>
      <div className="text-right font-semibold text-xs">
        ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </div>
      <div className="text-xs">{item.proveedor_alias}</div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
        <Button variant="ghost" size="sm" onClick={() => onEdit(index)}>
          <Edit className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}