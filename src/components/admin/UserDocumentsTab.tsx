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
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Subir Nuevo Documento</h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Archivo</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
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
            className="w-full"
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
          <Card key={doc.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(doc.file_url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialog({ open: true, document: doc })}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
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
