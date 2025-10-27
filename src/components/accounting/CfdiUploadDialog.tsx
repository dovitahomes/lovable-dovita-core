import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseCfdiXml } from "@/utils/cfdi/parseCfdi";
import { toast } from "sonner";

interface CfdiUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CfdiUploadDialog({ open, onOpenChange, onSuccess }: CfdiUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecciona un archivo XML");
      return;
    }

    setUploading(true);
    try {
      // Read file content
      const text = await file.text();
      
      // Parse CFDI
      const cfdi = parseCfdiXml(text);

      // Check if UUID already exists
      const { data: existing } = await supabase
        .from('invoices')
        .select('id')
        .eq('uuid', cfdi.timbre.uuid)
        .single();

      if (existing) {
        toast.error("Factura duplicada: Ya existe una factura con este UUID");
        setUploading(false);
        return;
      }

      // Upload XML to storage
      const fileName = `${cfdi.timbre.uuid}.xml`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cfdi')
        .upload(fileName, file, { contentType: 'application/xml', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cfdi')
        .getPublicUrl(fileName);

      // Find emisor/receptor IDs (optional, best effort)
      let emisorId = null;
      let receptorId = null;

      // Try to match RFC in providers (emisor)
      const { data: providers } = await supabase
        .from('providers')
        .select('id, fiscales_json')
        .limit(100);
      
      const matchingProvider = providers?.find(p => 
        p.fiscales_json && 
        typeof p.fiscales_json === 'object' && 
        'rfc' in p.fiscales_json &&
        p.fiscales_json.rfc === cfdi.emisor.rfc
      );
      if (matchingProvider) emisorId = matchingProvider.id;

      // Try to match RFC in clients (receptor)
      const { data: clients } = await supabase
        .from('clients')
        .select('id, fiscal_json')
        .limit(100);
      
      const matchingClient = clients?.find(c => 
        c.fiscal_json && 
        typeof c.fiscal_json === 'object' && 
        'rfc' in c.fiscal_json &&
        c.fiscal_json.rfc === cfdi.receptor.rfc
      );
      if (matchingClient) receptorId = matchingClient.id;

      // Determine tipo: I=ingreso, E=egreso
      const tipo = cfdi.tipoComprobante === 'I' ? 'ingreso' : 'egreso';

      // Insert invoice
      const { error: insertError } = await supabase
        .from('invoices')
        .insert([{
          tipo,
          metodo_pago: (cfdi.metodoPago || 'PUE') as any,
          issued_at: cfdi.fecha.toISOString().split('T')[0],
          uuid: cfdi.timbre.uuid,
          folio: cfdi.folio ? `${cfdi.serie || ''}-${cfdi.folio}` : null,
          total_amount: cfdi.total,
          emisor_id: emisorId,
          receptor_id: receptorId,
          xml_url: publicUrl,
          meta_json: cfdi as any,
          paid: false
        }]);

      if (insertError) throw insertError;

      toast.success("CFDI cargado exitosamente");
      onSuccess?.();
      onOpenChange(false);
      setFile(null);
    } catch (error) {
      console.error('Error uploading CFDI:', error);
      toast.error("Error al cargar CFDI: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir CFDI (XML)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cfdi-file">Archivo XML</Label>
            <Input
              id="cfdi-file"
              type="file"
              accept=".xml"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !file}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Cargando...' : 'Cargar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
