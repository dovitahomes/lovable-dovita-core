import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  useCompanyManuals,
  useCreateCompanyManual,
  useUpdateCompanyManual,
  useDeleteCompanyManual,
} from "@/hooks/useCompanyManuals";
import { uploadToBucket, getSignedUrl } from "@/lib/storage-helpers";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Trash2, Edit2, Plus, Search, Download, Eye, File } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS = [
  "Ventas",
  "Construcción",
  "Diseño",
  "Administración",
  "Recursos Humanos",
  "Finanzas",
  "Legal",
  "Otros",
];

const ROLES = ["admin", "colaborador", "cliente"];

export default function ManualsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data: manuals, isLoading } = useCompanyManuals(categoryFilter, searchTerm);
  const createMutation = useCreateCompanyManual();
  const updateMutation = useUpdateCompanyManual();
  const deleteMutation = useDeleteCompanyManual();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingManual, setEditingManual] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    file_path: "",
    categoria: "",
    visible_para_roles: [] as string[],
  });

  const handleOpenDialog = (manual?: any) => {
    if (manual) {
      setEditingManual(manual);
      setFormData({
        titulo: manual.titulo,
        descripcion: manual.descripcion || "",
        file_path: manual.file_path,
        categoria: manual.categoria || "",
        visible_para_roles: manual.visible_para_roles || [],
      });
    } else {
      setEditingManual(null);
      setFormData({
        titulo: "",
        descripcion: "",
        file_path: "",
        categoria: "",
        visible_para_roles: [],
      });
    }
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        description: "Formato no permitido. Solo PDF, Word, Excel y PowerPoint",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        description: "El archivo debe pesar menos de 20MB",
      });
      return;
    }

    setUploading(true);

    try {
      const { path } = await uploadToBucket({
        file,
        bucket: 'documentos',
        filename: `manuals/${Date.now()}-${file.name}`,
      });

      setFormData({ ...formData, file_path: path });
      toast({ description: "Archivo cargado exitosamente" });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        description: "Error al cargar archivo",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleRole = (role: string) => {
    const currentRoles = formData.visible_para_roles;
    if (currentRoles.includes(role)) {
      setFormData({
        ...formData,
        visible_para_roles: currentRoles.filter((r) => r !== role),
      });
    } else {
      setFormData({
        ...formData,
        visible_para_roles: [...currentRoles, role],
      });
    }
  };

  const toggleAllRoles = () => {
    if (formData.visible_para_roles.length === ROLES.length) {
      setFormData({ ...formData, visible_para_roles: [] });
    } else {
      setFormData({ ...formData, visible_para_roles: [...ROLES] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast({
        variant: "destructive",
        description: "El título es obligatorio",
      });
      return;
    }

    if (!formData.file_path && !editingManual) {
      toast({
        variant: "destructive",
        description: "Debes cargar un archivo",
      });
      return;
    }

    if (formData.visible_para_roles.length === 0) {
      toast({
        variant: "destructive",
        description: "Debes seleccionar al menos un rol",
      });
      return;
    }

    try {
      if (editingManual) {
        await updateMutation.mutateAsync({
          id: editingManual.id,
          updates: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setDialogOpen(false);
      setEditingManual(null);
    } catch (error) {
      console.error('Error saving manual:', error);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleDownload = async (manual: any) => {
    try {
      const { url } = await getSignedUrl({ bucket: 'documentos', path: manual.file_path });
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        description: "Error al descargar archivo",
      });
    }
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="h-5 w-5 text-green-500" />;
    if (['ppt', 'pptx'].includes(ext || '')) return <FileText className="h-5 w-5 text-orange-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Manuales de Operación
              </CardTitle>
              <CardDescription>
                Gestiona los manuales y documentación de la empresa
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Manual
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {manuals && manuals.length > 0 ? (
              manuals.map((manual) => (
                <div
                  key={manual.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center">
                      {getFileIcon(manual.file_path)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{manual.titulo}</h3>
                        {manual.categoria && (
                          <Badge variant="outline">{manual.categoria}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {manual.visible_para_roles?.map((role: string) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                      {manual.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {manual.descripcion}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Actualizado: {format(new Date(manual.updated_at), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(manual)}
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(manual)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(manual.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {searchTerm || categoryFilter
                    ? "No se encontraron manuales con ese criterio"
                    : "No hay manuales configurados"}
                </p>
                {!searchTerm && !categoryFilter && (
                  <Button onClick={() => handleOpenDialog()} className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Manual
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingManual ? "Editar Manual" : "Nuevo Manual de Operación"}
            </DialogTitle>
            <DialogDescription>
              {editingManual
                ? "Actualiza la información del manual"
                : "Agrega un nuevo manual o documento de operación"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Manual de Ventas 2024"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del manual..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Archivo *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Formatos: PDF, Word, Excel, PowerPoint (máx 20MB)
              </p>
              {uploading && (
                <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
              )}
              {formData.file_path && !uploading && (
                <p className="text-sm text-green-600">✓ Archivo cargado exitosamente</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Visible para roles *</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-roles"
                    checked={formData.visible_para_roles.length === ROLES.length}
                    onCheckedChange={toggleAllRoles}
                  />
                  <Label htmlFor="all-roles" className="font-semibold cursor-pointer">
                    Todos los roles
                  </Label>
                </div>
                {ROLES.map((role) => (
                  <div key={role} className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id={role}
                      checked={formData.visible_para_roles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <Label htmlFor={role} className="cursor-pointer capitalize">
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || uploading}
            >
              {editingManual ? "Actualizar" : "Crear"} Manual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar manual?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El manual será eliminado permanentemente.
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
    </>
  );
}
