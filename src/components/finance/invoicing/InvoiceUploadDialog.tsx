import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvoiceParser } from "@/hooks/finance/useInvoiceParser";
import { useUploadCfdi } from "@/hooks/useUploadCfdi";
import { useProviders } from "@/hooks/useProviders";
import { useClientsList } from "@/hooks/useClients";
import { Upload, FileText, FilePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface InvoiceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InvoiceUploadDialog({ open, onOpenChange, onSuccess }: InvoiceUploadDialogProps) {
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [emisorId, setEmisorId] = useState<string>("");
  const [receptorId, setReceptorId] = useState<string>("");
  
  const { parseXML, parsing } = useInvoiceParser();
  const { uploadCfdi, uploading } = useUploadCfdi();
  const { data: providers } = useProviders();
  const { data: clients } = useClientsList();

  const { getRootProps: getXmlRootProps, getInputProps: getXmlInputProps, isDragActive: isXmlDragActive } = useDropzone({
    accept: { 'text/xml': ['.xml'] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setXmlFile(file);
        
        // Auto-parse
        const parsed = await parseXML(file);
        if (parsed) {
          setParsedData(parsed);
          
          // Auto-match emisor por nombre (providers no tienen campo rfc)
          const matchedEmisor = providers?.find(p => 
            p.name?.toLowerCase().includes(parsed.emisor.nombre?.toLowerCase() || '')
          );
          if (matchedEmisor) {
            setEmisorId(matchedEmisor.id);
          }
          
          // Auto-match receptor por tax_id si es egreso
          const matchedReceptor = clients?.find(c => 
            c.tax_id?.toLowerCase() === parsed.receptor.rfc?.toLowerCase()
          );
          if (matchedReceptor) {
            setReceptorId(matchedReceptor.id);
          }
        }
      }
    },
  });

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setPdfFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async () => {
    if (!xmlFile || !emisorId) {
      toast.error('Selecciona archivo XML y proveedor');
      return;
    }

    try {
      await uploadCfdi({
        xmlFile,
        pdfFile: pdfFile || undefined,
        emisorId,
        receptorId: receptorId || undefined,
      });

      // Reset form
      setXmlFile(null);
      setPdfFile(null);
      setParsedData(null);
      setEmisorId("");
      setReceptorId("");
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Error al subir CFDI: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar Factura XML SAT</DialogTitle>
          <DialogDescription>
            Sube el archivo XML de la factura. El sistema extraerá automáticamente los datos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* XML Upload */}
          <div className="space-y-2">
            <Label>Archivo XML *</Label>
            <div
              {...getXmlRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                isXmlDragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
                xmlFile && "border-emerald-500 bg-emerald-500/5"
              )}
            >
              <input {...getXmlInputProps()} />
              {xmlFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-emerald-600" />
                  <p className="text-sm font-medium">{xmlFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(xmlFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra el XML aquí o haz clic para seleccionar
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PDF Upload (Optional) */}
          <div className="space-y-2">
            <Label>Archivo PDF (Opcional)</Label>
            <div
              {...getPdfRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                isPdfDragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50",
                pdfFile && "border-blue-500 bg-blue-500/5"
              )}
            >
              <input {...getPdfInputProps()} />
              {pdfFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FilePlus className="h-6 w-6 text-blue-600" />
                  <p className="text-sm font-medium">{pdfFile.name}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FilePlus className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra el PDF aquí (opcional)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">✅ Datos extraídos del XML:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Folio:</span>{' '}
                  <span className="font-medium">{parsedData.folio || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>{' '}
                  <span className="font-medium">${parsedData.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Emisor:</span>{' '}
                  <span className="font-medium">{parsedData.emisor?.nombre || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Emisor Selection */}
          <div className="space-y-2">
            <Label>Proveedor (Emisor) *</Label>
            <Select value={emisorId} onValueChange={setEmisorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona proveedor" />
              </SelectTrigger>
              <SelectContent>
                {providers?.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Receptor Selection (Optional) */}
          <div className="space-y-2">
            <Label>Cliente (Receptor) - Opcional</Label>
            <Select value={receptorId} onValueChange={setReceptorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                    {client.tax_id && ` (${client.tax_id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading || parsing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!xmlFile || !emisorId || uploading || parsing}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Cargar Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
