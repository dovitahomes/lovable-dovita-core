import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ConsumptionBarProps {
  qtyPlanned: number;
  qtySolicitada: number;
  qtyOrdenada: number;
  qtyRecibida: number;
  className?: string;
}

export function ConsumptionBar({
  qtyPlanned,
  qtySolicitada,
  qtyOrdenada,
  qtyRecibida,
  className,
}: ConsumptionBarProps) {
  if (qtyPlanned === 0) {
    return (
      <div className={className}>
        <Badge variant="outline" className="text-xs">
          Sin meta definida
        </Badge>
      </div>
    );
  }

  const pctRecibida = Math.min((qtyRecibida / qtyPlanned) * 100, 100);
  const pctOrdenada = Math.min(((qtyOrdenada - qtyRecibida) / qtyPlanned) * 100, 100 - pctRecibida);
  const pctSolicitada = Math.min(((qtySolicitada - qtyOrdenada) / qtyPlanned) * 100, 100 - pctRecibida - pctOrdenada);

  return (
    <div className={className}>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
        {/* Verde - Recibida */}
        {pctRecibida > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-emerald-500"
            style={{ width: `${pctRecibida}%` }}
          />
        )}
        {/* Amarillo - Ordenada */}
        {pctOrdenada > 0 && (
          <div
            className="absolute top-0 h-full bg-amber-500"
            style={{
              left: `${pctRecibida}%`,
              width: `${pctOrdenada}%`,
            }}
          />
        )}
        {/* Morado - Solicitada */}
        {pctSolicitada > 0 && (
          <div
            className="absolute top-0 h-full bg-purple-500"
            style={{
              left: `${pctRecibida + pctOrdenada}%`,
              width: `${pctSolicitada}%`,
            }}
          />
        )}
      </div>
      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
          Solicitada: {qtySolicitada.toFixed(2)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          Ordenada: {qtyOrdenada.toFixed(2)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Recibida: {qtyRecibida.toFixed(2)}
        </span>
        <span className="font-medium text-foreground">/ {qtyPlanned.toFixed(2)}</span>
      </div>
    </div>
  );
}
