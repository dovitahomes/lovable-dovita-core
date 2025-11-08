import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCrmAttachments, useUploadCrmAttachment, useDeleteCrmAttachment, getAttachmentSignedUrl, type AttachmentEntityType } from "@/hooks/crm/useCrmAttachments";
import { Upload, FileText, Image as ImageIcon, File, Trash2, Download, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateOnly } from "@/lib/datetime";
import { Progress } from "@/components/ui/progress";

interface AttachmentsTabProps {
  entityType: AttachmentEntityType;
  entityId: string;
}

export function AttachmentsTab({ entityType, entityId }: AttachmentsTabProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteAttachment, setDeleteAttachment] = useState<any>(null);

  const { data: attachments = [], isLoading } = useCrmAttachments(entityType, entityId);
  const uploadMutation = useUploadCrmAttachment();
  const deleteMutation = useDeleteCrmAttachment();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

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

  const handleDeleteConfirm = async () => {
    if (!deleteAttachment) return;
    await deleteMutation.mutateAsync(deleteAttachment);
    setDeleteAttachment(null);
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Archivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Archivo *</Label>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm text-muted-foreground">Suelta el archivo aquí...</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-1">Arrastra un archivo o haz clic para seleccionar</p>
                      <p className="text-xs text-muted-foreground">Tamaño máximo: 50MB</p>
                    </>
                  )}
                </div>
                {selectedFile && (
                  <Card className="p-3 mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(selectedFile.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Card>
                )}
              </div>
              
              <div>
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descripción del archivo"
                  rows={3}
                />
              </div>

              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subiendo...</span>
                  </div>
                  <Progress value={66} />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUploadOpen(false);
                    setSelectedFile(null);
                    setNotes("");
                  }}
                  disabled={uploadMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadMutation.isPending || !selectedFile}
                >
                  {uploadMutation.isPending ? "Subiendo..." : "Subir Archivo"}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAttachment} onOpenChange={() => setDeleteAttachment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el archivo "{deleteAttachment?.file_name}" del almacenamiento y la base de datos.
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
    </div>
  );
}
