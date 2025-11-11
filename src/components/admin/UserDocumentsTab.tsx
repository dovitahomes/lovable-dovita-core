import { useState } from 'react';
import { useUserDocuments, UserDocument } from '@/hooks/useUserDocuments';
import { useUploadUserDocument, useDeleteUserDocument } from '@/hooks/useUploadUserDocument';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const DOCUMENT_CATEGORIES = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'identificacion', label: 'Identificación Oficial' },
  { value: 'comprobante_domicilio', label: 'Comprobante de Domicilio' },
  { value: 'rfc', label: 'RFC' },
  { value: 'imss', label: 'IMSS' },
  { value: 'titulo', label: 'Título Profesional' },
  { value: 'otro', label: 'Otro' },
];

interface UserDocumentsTabProps {
  userId: string;
}

export function UserDocumentsTab({ userId }: UserDocumentsTabProps) {
  const isMobile = useIsMobile();
  const { data: documents = [], isLoading, error } = useUserDocuments(userId);
  const uploadMutation = useUploadUserDocument();
  const deleteMutation = useDeleteUserDocument();
  
  // Debug logging
  console.log('[UserDocumentsTab] userId:', userId);
  console.log('[UserDocumentsTab] documents:', documents);
  console.log('[UserDocumentsTab] error:', error);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; document: UserDocument | null }>({
    open: false,
    document: null,
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !category) return;
    
    await uploadMutation.mutateAsync({
      userId,
      file: selectedFile,
      category,
    });
    
    setSelectedFile(null);
    setCategory('');
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleDelete = async () => {
    if (!deleteDialog.document) return;
    
    // Extract file path from URL
    const url = deleteDialog.document.file_url;
    const path = url.split('/user-documents/')[1];
    
    await deleteMutation.mutateAsync({
      documentId: deleteDialog.document.id,
      userId,
      filePath: path,
    });
    
    // Log admin access to employee document
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id !== userId) {
        // @ts-ignore - RPC function added in migration, types will be regenerated on next deploy
        await supabase.rpc('log_user_document_access', {
          p_document_id: deleteDialog.document.id,
          p_action: 'delete'
        });
      }
    } catch (error) {
      console.error('Error logging document access:', error);
    }
    
    setDeleteDialog({ open: false, document: null });
  };
  
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className={cn("p-4", isMobile && "p-3")}>
        <h3 className={cn("font-semibold mb-4", isMobile && "text-sm mb-3")}>
          Subir Nuevo Documento
        </h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload" className={cn(isMobile && "text-sm")}>
              Archivo
            </Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className={cn(isMobile && "text-base")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className={cn(isMobile && "text-sm")}>
              Categoría
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger 
                id="category"
                className={cn(isMobile && "h-11")}
              >
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !category || uploadMutation.isPending}
            className={cn("w-full", isMobile && "h-11")}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? 'Subiendo...' : 'Subir Documento'}
          </Button>
        </div>
      </Card>
      
      {/* Documents List */}
      <div className="space-y-3">
        <h3 className="font-semibold">Documentos ({documents.length})</h3>
        
        {isLoading && <p className="text-sm text-muted-foreground">Cargando documentos...</p>}
        
        {error && (
          <Card className="p-4 border-destructive">
            <p className="text-sm text-destructive">Error al cargar documentos: {error.message}</p>
          </Card>
        )}
        
        {!isLoading && !error && documents.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay documentos subidos</p>
        )}
        
        {documents.map((doc) => (
          <Card key={doc.id} className={cn("p-4", isMobile && "p-3")}>
            <div className={cn(
              "flex items-start",
              isMobile ? "flex-col gap-2" : "justify-between"
            )}>
              <div className="flex items-start gap-3 flex-1 w-full">
                <FileText className={cn(
                  "text-muted-foreground mt-0.5",
                  isMobile ? "w-4 h-4" : "w-5 h-5"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    isMobile && "text-sm"
                  )}>
                    {doc.file_name}
                  </p>
                  <div className={cn(
                    "flex items-center gap-2 mt-1",
                    isMobile && "flex-wrap"
                  )}>
                    <Badge variant="secondary" className={cn(isMobile && "text-xs")}>
                      {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </span>
                    {!isMobile && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "flex items-center gap-2",
                isMobile && "w-full justify-end mt-2"
              )}>
                <Button
                  variant="ghost"
                  size={isMobile ? "default" : "sm"}
                  onClick={async () => {
                    window.open(doc.file_url, '_blank');
                    
                    // Log admin access to employee document
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user && user.id !== userId) {
                        // @ts-ignore - RPC function added in migration, types will be regenerated on next deploy
                        await supabase.rpc('log_user_document_access', {
                          p_document_id: doc.id,
                          p_action: 'download'
                        });
                      }
                    } catch (error) {
                      console.error('Error logging document access:', error);
                    }
                  }}
                  className={cn(isMobile && "flex-1")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isMobile && <span className="text-sm">Descargar</span>}
                </Button>
                <Button
                  variant="ghost"
                  size={isMobile ? "default" : "sm"}
                  onClick={() => setDeleteDialog({ open: true, document: doc })}
                  className={cn(isMobile && "flex-1")}
                >
                  <Trash2 className="w-4 h-4 text-destructive mr-2" />
                  {isMobile && <span className="text-sm text-destructive">Eliminar</span>}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, document: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{deleteDialog.document?.file_name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
