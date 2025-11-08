import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCrmAttachments, useUploadCrmAttachment, useDeleteCrmAttachment, getAttachmentSignedUrl, type AttachmentEntityType } from "@/hooks/crm/useCrmAttachments";
import { Upload, FileText, Image as ImageIcon, File, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateOnly } from "@/lib/datetime";

interface AttachmentsTabProps {
  entityType: AttachmentEntityType;
  entityId: string;
}

export function AttachmentsTab({ entityType, entityId }: AttachmentsTabProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: attachments = [], isLoading } = useCrmAttachments(entityType, entityId);
  const uploadMutation = useUploadCrmAttachment();
  const deleteMutation = useDeleteCrmAttachment();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecciona un archivo");
      return;
    }

    await uploadMutation.mutateAsync({
      entityType,
      entityId,
      file: selectedFile,
      notes: notes || undefined
    });

    setSelectedFile(null);
    setNotes("");
    setUploadOpen(false);
  };

  const handleDownload = async (attachment: any) => {
    try {
      const url = await getAttachmentSignedUrl(attachment.file_url);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error("Error al descargar: " + error.message);
    }
  };

  const handlePreview = async (attachment: any) => {
    try {
      const url = await getAttachmentSignedUrl(attachment.file_url);
      setPreviewUrl(url);
    } catch (error: any) {
      toast.error("Error al previsualizar: " + error.message);
    }
  };

  const handleDelete = async (attachment: any) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    await deleteMutation.mutateAsync(attachment);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-10 w-10 text-muted-foreground" />;
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-10 w-10 text-blue-500" />;
    }
    
    if (fileType.includes('pdf')) {
      return <FileText className="h-10 w-10 text-red-500" />;
    }
    
    return <File className="h-10 w-10 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Adjuntos ({attachments.length})</h3>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Subir Archivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Archivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Archivo *</Label>
                <Input type="file" onChange={handleFileSelect} />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descripción del archivo (opcional)"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={uploadMutation.isPending || !selectedFile}>
                  {uploadMutation.isPending ? "Subiendo..." : "Subir"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay archivos adjuntos</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {attachments.map((att) => (
            <Card key={att.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(att.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{att.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : ''} • {formatDateOnly(att.created_at.split('T')[0], 'dd MMM yyyy')}
                  </p>
                  {att.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{att.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {att.file_type?.startsWith('image/') && (
                    <Button variant="ghost" size="sm" onClick={() => handlePreview(att)}>
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(att)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(att)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
