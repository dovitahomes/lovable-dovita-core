import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText, CheckCircle, XCircle, Eye, Share2 } from "lucide-react";
import { ExecutiveBudgetItem, TUNode } from "../ExecutiveBudgetWizard";

interface StepPreviewProps {
  formData: {
    project_id?: string;
    iva_enabled?: boolean;
    cliente_view_enabled?: boolean;
    shared_with_construction?: boolean;
    notas?: string;
  };
  selectedSubpartidas: TUNode[];
  items: ExecutiveBudgetItem[];
}

export function StepPreview({ formData, selectedSubpartidas, items }: StepPreviewProps) {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', formData.project_id],
    queryFn: async () => {
      if (!formData.project_id) return null;
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

  const calculateItemTotal = (item: ExecutiveBudgetItem) => {
    const cantNecesaria = item.cant_real * (1 + item.desperdicio_pct / 100);
    const precioUnit = item.costo_unit * (1 + item.honorarios_pct / 100);
    return cantNecesaria * precioUnit;
  };

  const calculateSubpartidaSubtotal = (subpartidaId: string) => {
    return items
      .filter((item) => item.subpartida_id === subpartidaId)
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
        <h3 className="text-2xl font-bold">Preview del Presupuesto Ejecutivo</h3>
        <p className="text-muted-foreground">
          Revisa toda la información antes de guardar o publicar
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Vista Cliente:</span>
            <div className="flex items-center gap-2">
              {formData.cliente_view_enabled ? (
                <>
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">Habilitada</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Deshabilitada</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Compartir con Construcción:</span>
            <div className="flex items-center gap-2">
              {formData.shared_with_construction ? (
                <>
                  <Share2 className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">Sí</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">No</span>
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

      {/* Subpartidas Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Subpartida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSubpartidas.map((subpartida) => {
            const subpartidaItems = items.filter((item) => item.subpartida_id === subpartida.id);
            const subpartidaSubtotal = calculateSubpartidaSubtotal(subpartida.id);

            return (
              <div
                key={subpartida.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                      {subpartida.code}
                    </Badge>
                    <span className="font-semibold">{subpartida.name}</span>
                  </div>
                  <span className="font-bold text-primary">
                    {formatCurrency(subpartidaSubtotal)}
                  </span>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-border">
                  {subpartidaItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="truncate text-muted-foreground">
                          {item.descripcion}
                        </span>
                        {item.proveedor_alias && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.proveedor_alias}
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold ml-4 shrink-0">
                        {formatCurrency(calculateItemTotal(item))}
                      </span>
                    </div>
                  ))}
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
              {selectedSubpartidas.length} subpartida{selectedSubpartidas.length !== 1 ? 's' : ''} •{' '}
              {items.length} item{items.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
