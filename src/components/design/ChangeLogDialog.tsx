import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useSignChangeLog } from "@/hooks/useDesignChangeLogs";
import { uploadToBucket, getSignedUrl } from "@/lib/storage-helpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { Trash2, Eye, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChangeLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeLog: any;
  projectId: string;
}

export function ChangeLogDialog({ open, onOpenChange, changeLog, projectId }: ChangeLogDialogProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [showSignaturePreview, setShowSignaturePreview] = useState(false);
  const [isLoadingSignature, setIsLoadingSignature] = useState(false);
  const signMutation = useSignChangeLog();

  if (!changeLog) return null;

  const handleViewSignature = async () => {
    if (!changeLog.firma_url) return;
    
    setIsLoadingSignature(true);
    try {
      const { url } = await getSignedUrl({
        bucket: 'firmas',
        path: changeLog.firma_url
      });
      setSignaturePreviewUrl(url);
      setShowSignaturePreview(true);
    } catch (error: any) {
      toast.error("Error al cargar firma: " + error.message);
    } finally {
      setIsLoadingSignature(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Por favor, dibuje su firma");
      return;
    }

    try {
      const signatureData = signatureRef.current.toDataURL('image/png');
      const blob = await (await fetch(signatureData)).blob();

      const { path } = await uploadToBucket({
        bucket: 'firmas',
        projectId,
        file: new File([blob], `changelog-firma-${Date.now()}.png`, { type: 'image/png' })
      });

      await signMutation.mutateAsync({
        id: changeLog.id,
        firma_url: path,
        projectId
      });

      toast.success("Bitácora firmada exitosamente");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error al firmar: " + error.message);
    }
  };

  const isSigned = changeLog.firmado;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle de Bitácora de Cambios
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Fecha de reunión:</span>
                    <div className="font-medium">
                      {format(new Date(changeLog.meeting_date), "dd 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Fase:</span>
                    <div className="font-medium">
                      {changeLog.design_phases?.phase_name || 'Sin fase asignada'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Solicitado por:</span>
                    <div className="font-medium">{changeLog.requested_by || '-'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <div>
                      {isSigned ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Firmado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente de firma</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changes List */}
            <div>
              <Label className="text-base mb-3 block">Cambios Solicitados</Label>
              <div className="space-y-2">
                {changeLog.changes_json?.map((change: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">{change.area}</div>
                          <div className="text-sm text-muted-foreground">{change.detalle}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-sm text-muted-foreground">No hay cambios registrados</p>
                )}
              </div>
            </div>

            {/* Notes */}
            {changeLog.notes && (
              <div>
                <Label className="text-base mb-2 block">Notas Adicionales</Label>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {changeLog.notes}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Signature Section */}
            {!isSigned && (
              <div>
                <Label className="text-base mb-3 block">Firma del Cliente</Label>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-sm">
                      Dibuje su firma con el mouse o con el dedo
                    </Label>
                    <div className="border-2 rounded-lg p-2 bg-white shadow-sm">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          className: 'w-full h-48 touch-none',
                          style: { touchAction: 'none' }
                        }}
                        backgroundColor="rgb(255, 255, 255)"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Firma dentro del recuadro para aprobar estos cambios.
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => signatureRef.current?.clear()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar Firma
                    </Button>
                    <Button
                      onClick={handleSign}
                      disabled={signMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {signMutation.isPending ? 'Firmando...' : 'Firmar y Aprobar'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Signed Info */}
            {isSigned && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-green-800 font-medium text-lg mb-1">
                        ✓ Bitácora Firmada
                      </p>
                      <p className="text-sm text-green-700">
                        Firmado el {format(new Date(changeLog.signed_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    {changeLog.firma_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewSignature}
                        disabled={isLoadingSignature}
                        className="border-green-300 hover:bg-green-100"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {isLoadingSignature ? 'Cargando...' : 'Ver Firma'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Preview Dialog */}
      <Dialog open={showSignaturePreview} onOpenChange={setShowSignaturePreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Firma de Aprobación</DialogTitle>
          </DialogHeader>
          {signaturePreviewUrl && (
            <div className="border rounded-lg p-4 bg-white">
              <img 
                src={signaturePreviewUrl} 
                alt="Firma del cliente" 
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
