import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket, getSignedUrl, deleteFromBucket } from "@/lib/storage/storage-helpers";
import type { BucketName } from "@/lib/storage/buckets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, Download, Eye, Trash2, FileText, FolderOpen, CheckCircle2 } from "lucide-react";

type UserRole = 'admin' | 'colaborador' | 'contador' | 'cliente' | 'user';

interface DocumentManagerProps {
  projectId: string;
  userRole?: UserRole;
}

const TIPOS_CARPETA = [
  "Cliente",
  "Predio",
  "Licencias",
  "Wishlist",
  "Presupuesto",
  "Contratos",
  "Planos",
  "Fotografías",
  "Otro"
];

export function DocumentManager({ projectId, userRole = 'user' }: DocumentManagerProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [uploadData, setUploadData] = useState({
    tipo_carpeta: "",
    etiqueta: "",
    visibilidad: "interno" as "cliente" | "interno" | "admin",
    firmado: false
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', projectId, selectedFolder],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (selectedFolder !== "all") {
        query = query.eq('tipo_carpeta', selectedFolder);
      }

      // Filter by visibility based on user role
      if (userRole === 'cliente') {
        query = query.eq('visibilidad', 'cliente');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, data }: { file: File; data: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Choose bucket based on visibility
      const bucket: BucketName = data.visibilidad === "cliente" ? "project_docs" : "documentos";

      // Upload to storage with standardized path
      const { path } = await uploadToBucket({
        bucket,
        projectId,
        file,
        filename: file.name
      });

      // Create document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          nombre: file.name,
          tipo_carpeta: data.tipo_carpeta,
          etiqueta: data.etiqueta || null,
          visibilidad: data.visibilidad,
          firmado: data.firmado,
          file_url: path, // Store only the path
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id
        });

      if (insertError) {
        // Cleanup: delete uploaded file if DB insert fails
        await deleteFromBucket(bucket, path);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success("Documento subido exitosamente");
      resetForm();
    },
    onError: (error: any) => toast.error("Error al subir documento: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      // Choose bucket based on visibility
      const bucket: BucketName = doc.visibilidad === "cliente" ? "project_docs" : "documentos";

      // Delete from storage (doc.file_url is now just the path)
      const success = await deleteFromBucket(bucket, doc.file_url);
      if (!success) throw new Error("Error al eliminar archivo de storage");

      // Delete record
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success("Documento eliminado");
    },
    onError: (error: any) => toast.error("Error al eliminar: " + error.message)
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    toast.success(`${acceptedFiles.length} archivo(s) listo(s) para subir`);
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
    }
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecciona al menos un archivo");
      return;
    }
    if (!uploadData.tipo_carpeta) {
      toast.error("Selecciona una carpeta");
      return;
    }

    for (const file of files) {
      await uploadMutation.mutateAsync({ file, data: uploadData });
    }
  };

  const resetForm = () => {
    setFiles([]);
    setUploadData({
      tipo_carpeta: "",
      etiqueta: "",
      visibilidad: "interno",
      firmado: false
    });
    setUploadOpen(false);
  };

  const handlePreview = async (doc: any) => {
    try {
      // Choose bucket based on visibility
      const bucket: BucketName = doc.visibilidad === "cliente" ? "project_docs" : "documentos";
      
      // Get signed URL for private bucket
      const { url } = await getSignedUrl({
        bucket,
        path: doc.file_url,
        expiresInSeconds: 600 // 10 minutes
      });

      if (doc.file_type?.startsWith('image/') || doc.file_type === 'application/pdf') {
        setPreviewUrl(url);
        setPreviewOpen(true);
      } else {
        // For other file types, just download
        window.open(url, '_blank');
      }
    } catch (error: any) {
      toast.error("Error al obtener URL: " + error.message);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      // Choose bucket based on visibility
      const bucket: BucketName = doc.visibilidad === "cliente" ? "project_docs" : "documentos";
      
      // Get signed URL for private bucket
      const { url } = await getSignedUrl({
        bucket,
        path: doc.file_url,
        expiresInSeconds: 300 // 5 minutes
      });

      const link = document.createElement('a');
      link.href = url;
      link.download = doc.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast.error("Error al descargar: " + error.message);
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const variants = {
      cliente: { variant: "default" as const, label: "Cliente" },
      interno: { variant: "secondary" as const, label: "Interno" },
      admin: { variant: "outline" as const, label: "Admin" }
    };
    const config = variants[visibility as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const groupedDocs = documents?.reduce((acc, doc) => {
    if (!acc[doc.tipo_carpeta]) {
      acc[doc.tipo_carpeta] = [];
    }
    acc[doc.tipo_carpeta].push(doc);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestor de Documentos</h2>
        {userRole !== 'cliente' && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" /> Subir Documentos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Subir Nuevos Documentos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-lg">Suelta los archivos aquí...</p>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
                      <p className="text-sm text-muted-foreground">
                        PDF, imágenes, Word, Excel
                      </p>
                    </div>
                  )}
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Archivos seleccionados:</Label>
                    <div className="space-y-1">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                          <FileText className="h-4 w-4" />
                          <span className="flex-1">{file.name}</span>
                          <span className="text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Carpeta/Tipo *</Label>
                    <Select
                      value={uploadData.tipo_carpeta}
                      onValueChange={(value) => setUploadData({ ...uploadData, tipo_carpeta: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar carpeta" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_CARPETA.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Etiqueta</Label>
                    <Input
                      value={uploadData.etiqueta}
                      onChange={(e) => setUploadData({ ...uploadData, etiqueta: e.target.value })}
                      placeholder="Ej: Original, Copia, etc."
                    />
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
                        <SelectItem value="cliente">Cliente (visible para todos)</SelectItem>
                        <SelectItem value="interno">Interno (colaboradores y admin)</SelectItem>
                        <SelectItem value="admin">Admin (solo administradores)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={uploadData.firmado}
                        onCheckedChange={(checked) => setUploadData({ ...uploadData, firmado: checked as boolean })}
                      />
                      <label className="text-sm">Documento firmado</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpload} disabled={files.length === 0 || !uploadData.tipo_carpeta}>
                    Subir {files.length > 0 ? `${files.length} archivo(s)` : ''}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={selectedFolder} onValueChange={setSelectedFolder}>
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="all">
            <FolderOpen className="h-4 w-4 mr-2" /> Todos
          </TabsTrigger>
          {TIPOS_CARPETA.map((tipo) => (
            <TabsTrigger key={tipo} value={tipo}>
              {tipo} ({groupedDocs?.[tipo]?.length || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedFolder} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedFolder === "all" ? "Todos los Documentos" : selectedFolder}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Cargando...</div>
              ) : documents && documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Carpeta</TableHead>
                      <TableHead>Etiqueta</TableHead>
                      <TableHead>Visibilidad</TableHead>
                      <TableHead>Estado</TableHead>
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
                            {doc.nombre}
                          </div>
                        </TableCell>
                        <TableCell>{doc.tipo_carpeta}</TableCell>
                        <TableCell>{doc.etiqueta || '-'}</TableCell>
                        <TableCell>{getVisibilityBadge(doc.visibilidad)}</TableCell>
                        <TableCell>
                          {doc.firmado && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Firmado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePreview(doc)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {userRole !== 'cliente' && (
                              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(doc)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay documentos en esta carpeta</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="w-full h-[70vh] overflow-auto">
              {previewUrl.endsWith('.pdf') ? (
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