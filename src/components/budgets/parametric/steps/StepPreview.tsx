import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText, CheckCircle, XCircle } from "lucide-react";
import { BudgetItem, Mayor } from "../ParametricBudgetWizard";
import { cn } from "@/lib/utils";

interface StepPreviewProps {
  formData: {
    project_id?: string;
    iva_enabled?: boolean;
    notas?: string;
  };
  selectedMayores: Mayor[];
  items: BudgetItem[];
}

export function StepPreview({ formData, selectedMayores, items }: StepPreviewProps) {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', formData.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('id', formData.project_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!formData.project_id,
  });

  const { data: partidas } = useQuery({
    queryKey: ['tu_partidas_preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('*')
        .eq('type', 'partida');
      if (error) throw error;
      return data;
    },
  });

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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateIVA = () => {
    return (formData.iva_enabled ?? true) ? calculateSubtotal() * 0.16 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateIVA();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (projectLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Preview del Presupuesto</h3>
        <p className="text-muted-foreground">
          Revisa toda la información antes de guardar
        </p>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cliente:</span>
            <span className="font-semibold">{project?.clients?.name || 'Sin cliente'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Proyecto:</span>
            <span className="font-semibold">{project?.project_name || 'Proyecto'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">IVA (16%):</span>
            <div className="flex items-center gap-2">
              {(formData.iva_enabled ?? true) ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">Incluido</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">No incluido</span>
                </>
              )}
            </div>
          </div>
          {formData.notas && (
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Notas:</p>
                  <p className="text-sm">{formData.notas}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mayores Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Mayor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMayores.map((mayor) => {
            const mayorItems = items.filter((item) => item.mayor_id === mayor.id);
            const mayorSubtotal = calculateMayorSubtotal(mayor.id);

            return (
              <div
                key={mayor.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                      {mayor.code}
                    </Badge>
                    <span className="font-semibold">{mayor.name}</span>
                  </div>
                  <span className="font-bold text-primary">
                    {formatCurrency(mayorSubtotal)}
                  </span>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-border">
                  {mayorItems.map((item, idx) => {
                    const partida = partidas?.find((p) => p.id === item.partida_id);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {partida?.code || '---'}
                          </Badge>
                          <span className="truncate text-muted-foreground">
                            {item.descripcion || partida?.name || 'Sin descripción'}
                          </span>
                        </div>
                        <span className="font-semibold ml-4 shrink-0">
                          {formatCurrency(calculateItemTotal(item))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Totales del Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-lg">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
          </div>

          {(formData.iva_enabled ?? true) && (
            <div className="flex items-center justify-between text-lg">
              <span className="text-muted-foreground">IVA (16%):</span>
              <span className="font-semibold">{formatCurrency(calculateIVA())}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-2xl font-bold border-t pt-3">
            <span>Total:</span>
            <span className="text-primary">{formatCurrency(calculateTotal())}</span>
          </div>

          <div className="pt-3 border-t text-center">
            <Badge variant="secondary" className="text-xs">
              {selectedMayores.length} mayor{selectedMayores.length !== 1 ? 'es' : ''} •{' '}
              {items.length} partida{items.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
