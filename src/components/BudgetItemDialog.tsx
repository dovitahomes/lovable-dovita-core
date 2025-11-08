import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, AlertTriangle, History, FileText, Image as ImageIcon, File, Trash2, Download, X } from "lucide-react";
import { getPricingVarianceThreshold } from "@/utils/businessRules";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useBudgetAttachments, useUploadBudgetAttachment, useDeleteBudgetAttachment, getBudgetAttachmentSignedUrl } from "@/hooks/useBudgetAttachments";
import { formatDateOnly } from "@/lib/datetime";

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
  const [deleteAttachment, setDeleteAttachment] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { can } = useModuleAccess();
  const canEditSensitiveData = can("presupuestos", "edit"); // Solo colaboradores/admin
  const queryClient = useQueryClient();

  const { data: attachments = [] } = useBudgetAttachments(formData.id);
  const uploadMutation = useUploadBudgetAttachment();
  const deleteMutation = useDeleteBudgetAttachment();

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && formData.id) {
      uploadMutation.mutate({
        budgetItemId: formData.id,
        file: acceptedFiles[0]
      });
    } else if (!formData.id) {
      toast.error("Guarda primero el item antes de subir archivos");
    }
  }, [formData.id, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
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
            
            // Notify all admins about price variance
            try {
              const { data: admins } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role_name', 'admin');
              
              if (admins && admins.length > 0) {
                const subpartida = tuNodes.find(n => n.id === formData.subpartida_id);
                
                for (const admin of admins) {
                  await supabase.from('notifications').insert({
                    user_id: admin.user_id,
                    type: 'price_variance',
                    title: 'Variación de Precio Detectada',
                    message: `${subpartida?.name || 'Subpartida'}: varianza ${variance.toFixed(1)}% (${previousPrice.toFixed(2)} → ${formData.costo_unit.toFixed(2)} MXN)`,
                    metadata: {
                      budget_item_id: formData.id,
                      variance_pct: variance,
                      old_price: previousPrice,
                      new_price: formData.costo_unit,
                      subpartida_id: formData.subpartida_id,
                      subpartida_name: subpartida?.name,
                    }
                  });
                }
              }
            } catch (e) {
              console.error('Error creating notification:', e);
            }
          }
          
          setPriceVariance({ has_variance: Math.abs(variance) >= threshold, variance_pct: variance });
        }
      }
    };

    checkVariance();
  }, [formData.subpartida_id, formData.costo_unit, projectId, sucursalId, formData.id]);

  const handleDownload = async (attachment: any) => {
    try {
      const url = await getBudgetAttachmentSignedUrl(attachment.file_url);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error("Error al descargar: " + error.message);
    }
  };

  const handlePreview = async (attachment: any) => {
    try {
      const url = await getBudgetAttachmentSignedUrl(attachment.file_url);
      setPreviewUrl(url);
    } catch (error: any) {
      toast.error("Error al previsualizar: " + error.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAttachment) return;
    await deleteMutation.mutateAsync(deleteAttachment);
    setDeleteAttachment(null);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />;
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    
    if (fileType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    
    return <File className="h-8 w-8 text-muted-foreground" />;
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
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-orange-100 p-2">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <AlertDialogTitle>Variación de Precio Detectada</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                  El costo unitario ingresado varía <strong>{variancePercent.toFixed(1)}%</strong> respecto al precio histórico anterior.
                  {variancePercent > 0 ? ' El precio ha aumentado.' : ' El precio ha disminuido.'}
                </AlertDialogDescription>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio anterior:</span>
                      <span className="font-medium">
                        {priceHistory && priceHistory[0] 
                          ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(priceHistory[0].precio_unit)
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio nuevo:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(formData.costo_unit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar Precio</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowVarianceAlert(false)}>
              Continuar de Todos Modos
            </AlertDialogAction>
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
                  <Label>Subir Cotización o Ficha Técnica</Label>
                  <div
                    {...getRootProps()}
                    className={`
                      mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                      ${!formData.id ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input {...getInputProps()} disabled={!formData.id} />
                    <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    {isDragActive ? (
                      <p className="text-sm text-muted-foreground">Suelta el archivo aquí...</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium mb-1">
                          {formData.id 
                            ? 'Arrastra un archivo o haz clic para seleccionar'
                            : 'Guarda el item primero para subir archivos'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, Excel, Imágenes • Máx 50MB
                        </p>
                      </>
                    )}
                  </div>

                  {uploadMutation.isPending && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subiendo archivo...</span>
                      </div>
                      <Progress value={66} />
                    </div>
                  )}

                  {/* Lista de archivos adjuntos */}
                  {attachments.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <Label>Archivos Adjuntos ({attachments.length})</Label>
                      <div className="space-y-2">
                        {attachments.map((att) => (
                          <Card key={att.id} className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {getFileIcon(att.file_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{att.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : ''} • 
                                  {att.created_at ? ` ${formatDateOnly(att.created_at.split('T')[0], 'dd MMM yyyy')}` : ''}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {att.file_type?.startsWith('image/') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handlePreview(att)}
                                    title="Vista previa"
                                  >
                                    <ImageIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownload(att)}
                                  title="Descargar"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setDeleteAttachment(att)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
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

    {/* Preview Dialog */}
    {previewUrl && (
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            <img src={previewUrl} alt="Preview" className="w-full h-auto" />
          </div>
        </DialogContent>
      </Dialog>
    )}

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!deleteAttachment} onOpenChange={() => setDeleteAttachment(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar archivo adjunto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente "{deleteAttachment?.file_name}" del almacenamiento y la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}