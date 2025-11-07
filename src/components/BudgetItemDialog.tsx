import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket } from "@/lib/storage/storage-helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, AlertTriangle, History } from "lucide-react";
import { getPricingVarianceThreshold } from "@/utils/businessRules";
import { useModuleAccess } from "@/hooks/useModuleAccess";

interface BudgetItem {
  id?: string;
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
  order_index: number;
}

interface BudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BudgetItem;
  tuNodes: any[];
  onSave: (item: BudgetItem) => void;
  projectId?: string;
  sucursalId?: string;
}

export function BudgetItemDialog({
  open,
  onOpenChange,
  item,
  tuNodes,
  onSave,
  projectId,
  sucursalId
}: BudgetItemDialogProps) {
  const [formData, setFormData] = useState<BudgetItem>(item);
  const [priceVariance, setPriceVariance] = useState<any>(null);
  const [showVarianceAlert, setShowVarianceAlert] = useState(false);
  const [variancePercent, setVariancePercent] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { can } = useModuleAccess();
  const canEditSensitiveData = can("presupuestos", "edit"); // Solo colaboradores/admin

  const mayores = tuNodes.filter(n => n.type === 'mayor');
  const partidas = tuNodes.filter(n => n.type === 'partida' && n.parent_id === formData.mayor_id);
  const subpartidas = tuNodes.filter(n => n.type === 'subpartida' && n.parent_id === formData.partida_id);

  const { data: priceHistory } = useQuery({
    queryKey: ['price_history', formData.subpartida_id],
    queryFn: async () => {
      if (!formData.subpartida_id) return [];
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('subpartida_id', formData.subpartida_id)
        .order('observed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!formData.subpartida_id
  });

  useEffect(() => {
    setFormData(item);
  }, [item]);

  useEffect(() => {
    const checkVariance = async () => {
      if (formData.subpartida_id && formData.costo_unit > 0) {
        const { data: history, error } = await supabase
          .from('price_history')
          .select('precio_unit')
          .eq('subpartida_id', formData.subpartida_id)
          .order('observed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && history) {
          const threshold = await getPricingVarianceThreshold(projectId, sucursalId);
          const previousPrice = history.precio_unit;
          const variance = ((formData.costo_unit - previousPrice) / previousPrice) * 100;
          
          setVariancePercent(variance);
          
          if (Math.abs(variance) >= threshold) {
            setShowVarianceAlert(true);
          }
          
          setPriceVariance({ has_variance: Math.abs(variance) >= threshold, variance_pct: variance });
        }
      }
    };

    checkVariance();
  }, [formData.subpartida_id, formData.costo_unit, projectId, sucursalId]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!formData.id) throw new Error("Guarda el item primero");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { path } = await uploadToBucket({
        bucket: 'documentos',
        projectId: formData.id,
        file,
        filename: file.name
      });

      const { error: insertError } = await supabase
        .from('budget_attachments')
        .insert({
          budget_item_id: formData.id,
          file_name: file.name,
          file_url: path,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Cotización subida");
    },
    onError: (error: any) => toast.error("Error: " + error.message)
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleSubpartidaChange = (subpartidaId: string) => {
    const subpartida = tuNodes.find(n => n.id === subpartidaId);
    setFormData({
      ...formData,
      subpartida_id: subpartidaId,
      unidad: subpartida?.unit_default || formData.unidad
    });
  };

  const handleSave = () => {
    if (!formData.mayor_id || !formData.partida_id || !formData.unidad) {
      toast.error("Completa los campos requeridos");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  const cantNecesaria = formData.cant_real * (1 + formData.desperdicio_pct / 100);
  const precioUnit = formData.costo_unit * (1 + formData.honorarios_pct / 100);
  const total = cantNecesaria * precioUnit;

  return (
    <>
      <AlertDialog open={showVarianceAlert} onOpenChange={setShowVarianceAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Advertencia de Variación de Precio</AlertDialogTitle>
            <AlertDialogDescription>
              El costo supera la variación permitida ({variancePercent.toFixed(1)}%). 
              El precio anterior era diferente al que estás ingresando.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowVarianceAlert(false)}>Continuar de todos modos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Partida</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="detalles">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detalles">Detalles</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
            <TabsTrigger value="historial">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="detalles" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Mayor *</Label>
                <Select
                  value={formData.mayor_id}
                  onValueChange={(v) => setFormData({ ...formData, mayor_id: v, partida_id: "", subpartida_id: null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {mayores.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.code} - {m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Partida *</Label>
                <Select
                  value={formData.partida_id}
                  onValueChange={(v) => setFormData({ ...formData, partida_id: v, subpartida_id: null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {partidas.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subpartida</Label>
                <Select
                  value={formData.subpartida_id || ""}
                  onValueChange={handleSubpartidaChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin subpartida</SelectItem>
                    {subpartidas.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Descripción</Label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div>
                <Label>Unidad *</Label>
                <Input
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  placeholder="m2, m3, kg"
                />
              </div>

              <div>
                <Label>Cantidad Real</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cant_real}
                  onChange={(e) => setFormData({ ...formData, cant_real: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {canEditSensitiveData && (
                <>
                  <div>
                    <Label>Desperdicio %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.desperdicio_pct}
                      onChange={(e) => setFormData({ ...formData, desperdicio_pct: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>Cantidad Necesaria</Label>
                    <Input value={cantNecesaria.toFixed(2)} disabled />
                  </div>

                  <div>
                    <Label>Costo Unitario</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.costo_unit}
                      onChange={(e) => setFormData({ ...formData, costo_unit: parseFloat(e.target.value) || 0 })}
                    />
                    {priceVariance?.has_variance && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        Variación {priceVariance.variance_pct.toFixed(1)}% vs precio anterior
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Honorarios %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.honorarios_pct}
                      onChange={(e) => setFormData({ ...formData, honorarios_pct: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <Label>Precio Unitario</Label>
                    <Input value={precioUnit.toFixed(2)} disabled />
                  </div>

                  <div className="col-span-2">
                    <Label>Proveedor</Label>
                    <Input
                      value={formData.proveedor_alias}
                      onChange={(e) => setFormData({ ...formData, proveedor_alias: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className={canEditSensitiveData ? "" : "col-span-2"}>
                <Label>Total</Label>
                <Input
                  value={new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}
                  disabled
                  className="font-bold"
                />
              </div>
            </div>
          </TabsContent>

          {canEditSensitiveData && (
            <>
              <TabsContent value="cotizaciones" className="space-y-4">
                <div>
                  <Label>Subir Cotización</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> Subir Archivo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sube cotizaciones para respaldar el costo unitario
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="historial" className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico de Precios
                  </Label>
                  {priceHistory && priceHistory.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {priceHistory.map((record: any) => (
                        <div key={record.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <div className="font-medium">
                              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(record.precio_unit)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(record.observed_at).toLocaleDateString('es-MX')}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.source || 'Sin fuente'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-4">
                      No hay histórico de precios para esta subpartida
                    </p>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="flex gap-2">
          <Button onClick={handleSave}>Guardar</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}