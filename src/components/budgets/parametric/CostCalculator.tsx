import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CostCalculatorProps {
  open: boolean;
  onClose: () => void;
  onApply: (values: {
    costo_unit: number;
    cant_real: number;
    desperdicio_pct: number;
    honorarios_pct: number;
  }) => void;
  initialValues?: {
    costo_unit?: number;
    cant_real?: number;
    desperdicio_pct?: number;
    honorarios_pct?: number;
  };
}

export function CostCalculator({ open, onClose, onApply, initialValues }: CostCalculatorProps) {
  const [costoUnit, setCostoUnit] = useState(initialValues?.costo_unit || 0);
  const [cantReal, setCantReal] = useState(initialValues?.cant_real || 1);
  const [desperdicioPct, setDesperdicioPct] = useState(initialValues?.desperdicio_pct || 0);
  const [honorariosPct, setHonorariosPct] = useState(initialValues?.honorarios_pct || 15);

  // Calculations
  const cantNecesaria = cantReal * (1 + desperdicioPct / 100);
  const costoConHonorarios = costoUnit * (1 + honorariosPct / 100);
  const subtotal = cantReal * costoUnit;
  const totalDesperdicio = (cantNecesaria - cantReal) * costoUnit;
  const totalHonorarios = cantReal * costoUnit * (honorariosPct / 100);
  const total = cantNecesaria * costoConHonorarios;

  const handleApply = () => {
    onApply({
      costo_unit: costoUnit,
      cant_real: cantReal,
      desperdicio_pct: desperdicioPct,
      honorarios_pct: honorariosPct,
    });
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Costos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Inputs Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costo Unitario *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={costoUnit}
                    onChange={(e) => setCostoUnit(parseFloat(e.target.value) || 0)}
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cantidad Real *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cantReal}
                    onChange={(e) => setCantReal(parseFloat(e.target.value) || 0)}
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Desperdicio (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={desperdicioPct}
                    onChange={(e) => setDesperdicioPct(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Honorarios (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={honorariosPct}
                    onChange={(e) => setHonorariosPct(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculations Section */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                DESGLOSE DE CÁLCULOS
              </h4>

              {/* Step by Step */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (Cantidad × Costo):</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    + Desperdicio ({desperdicioPct}%):
                  </span>
                  <span className="font-semibold text-amber-600">
                    +{formatCurrency(totalDesperdicio)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    + Honorarios ({honorariosPct}%):
                  </span>
                  <span className="font-semibold text-blue-600">
                    +{formatCurrency(totalHonorarios)}
                  </span>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Cantidad necesaria (con desperdicio):</span>
                  <span className="font-semibold">{cantNecesaria.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Precio unitario final (con honorarios):</span>
                  <span className="font-semibold">{formatCurrency(costoConHonorarios)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Aplicar Valores
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
