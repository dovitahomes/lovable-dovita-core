import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDropzone } from "react-dropzone";
import { 
  useProjectDocuments, 
  useUploadProjectDocuments,
  useUpdateDocument,
  useDeleteDocument,
  useSignedUrl 
} from "@/hooks/useProjectDocuments";
import { Upload, Download, Eye, Trash2, FileText, MoreVertical, Search } from "lucide-react";
import { LoadingError } from "@/components/common/LoadingError";

const TIPOS_CARPETA = [
  "Cliente",
  "Predio",
  "Contrato",
  "Licencias",
  "Presupuesto",
  "Planos",
  "Fotografías",
  "Otros"
];

interface DocumentsTabProps {
  projectId: string;
}

export function DocumentsTab({ projectId }: DocumentsTabProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    visibility: "all",
    folderType: "all"
  });
  
  const [uploadData, setUploadData] = useState({
    tipo_carpeta: "",
    etiqueta: "",
    visibilidad: "interno" as "cliente" | "interno" | "admin"
  });
  
  const [files, setFiles] = useState<File[]>([]);

  const { data: documents, isLoading, error } = useProjectDocuments(projectId, filters);
  const uploadMutation = useUploadProjectDocuments(projectId);
  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();
  const { data: previewUrl } = useSignedUrl(previewPath);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  const handleUpload = async () => {
    if (files.length === 0 || !uploadData.tipo_carpeta) {
      return;
    }

    await uploadMutation.mutateAsync({
      files,
      tipo_carpeta: uploadData.tipo_carpeta,
      visibilidad: uploadData.visibilidad,
      etiqueta: uploadData.etiqueta || undefined
    });

    resetForm();
  };

  const resetForm = () => {
    setFiles([]);
    setUploadData({
      tipo_carpeta: "",
      etiqueta: "",
      visibilidad: "interno"
    });
    setUploadOpen(false);
  };

  const handlePreview = (doc: any) => {
    setPreviewPath(doc.file_url);
  };

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage
      .from('project_docs')
      .createSignedUrl(doc.file_url, 60);
    
    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = doc.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUpdateVisibility = (docId: string, visibility: string) => {
    updateMutation.mutate({
      id: docId,
      projectId,
      updates: { visibilidad: visibility }
    });
  };

  const handleUpdateFolder = (docId: string, folder: string) => {
    updateMutation.mutate({
      id: docId,
      projectId,
      updates: { tipo_carpeta: folder }
    });
  };

  const handleDelete = (doc: any) => {
    if (confirm(`¿Eliminar "${doc.nombre}"?`)) {
      deleteMutation.mutate({
        id: doc.id,
        projectId,
        filePath: doc.file_url
      });
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const config = {
      cliente: { variant: "default" as const, label: "Cliente" },
      interno: { variant: "secondary" as const, label: "Interno" },
      admin: { variant: "outline" as const, label: "Admin" }
    };
    const item = config[visibility as keyof typeof config];
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Documentos del Proyecto</h2>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" /> Subir Documentos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.folderType}
              onValueChange={(value) => setFilters({ ...filters, folderType: value })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de carpeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las carpetas</SelectItem>
                {TIPOS_CARPETA.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.visibility}
              onValueChange={(value) => setFilters({ ...filters, visibility: value })}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Visibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="interno">Interno</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <LoadingError
            isLoading={isLoading}
            error={error}
            isEmpty={!documents || documents.length === 0}
            emptyMessage="No hay documentos"
          />
          
          {documents && documents.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Carpeta</TableHead>
                  <TableHead>Visibilidad</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Subido por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-xs">{doc.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.tipo_carpeta}</Badge>
                    </TableCell>
                    <TableCell>{getVisibilityBadge(doc.visibilidad)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size || 0)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" /> Descargar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateVisibility(doc.id, 'cliente')}>
                              Marcar como Cliente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateVisibility(doc.id, 'interno')}>
                              Marcar como Interno
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateVisibility(doc.id, 'admin')}>
                              Marcar como Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(doc)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subir Documentos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">Suelta los archivos aquí...</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">Arrastra archivos o haz clic para seleccionar</p>
                  <p className="text-sm text-muted-foreground">
                    PDF, imágenes, Word, Excel (máx 20MB)
                  </p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Archivos ({files.length}):</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                      <FileText className="h-4 w-4" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de carpeta *</Label>
                <Select
                  value={uploadData.tipo_carpeta}
                  onValueChange={(value) => setUploadData({ ...uploadData, tipo_carpeta: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CARPETA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visibilidad *</Label>
                <Select
                  value={uploadData.visibilidad}
                  onValueChange={(value: any) => setUploadData({ ...uploadData, visibilidad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Etiqueta (opcional)</Label>
                <Input
                  value={uploadData.etiqueta}
                  onChange={(e) => setUploadData({ ...uploadData, etiqueta: e.target.value })}
                  placeholder="Ej: Original, Copia, etc."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={files.length === 0 || !uploadData.tipo_carpeta || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Subiendo...' : `Subir ${files.length} archivo(s)`}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPath} onOpenChange={() => setPreviewPath(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="w-full h-[70vh] overflow-auto">
              {previewUrl.includes('.pdf') || previewPath?.endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full h-auto mx-auto" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
