import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Loader2,
  Eye,
  Download
} from "lucide-react";
import { 
  useCompanyManuals, 
  useCreateCompanyManual, 
  useUpdateCompanyManual, 
  useDeleteCompanyManual 
} from "@/hooks/useCompanyManuals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/common/Skeletons";

const CATEGORIES = [
  { value: "ventas", label: "Ventas" },
  { value: "construccion", label: "Construcción" },
  { value: "diseno", label: "Diseño" },
  { value: "administracion", label: "Administración" },
  { value: "recursos_humanos", label: "Recursos Humanos" },
  { value: "finanzas", label: "Finanzas" },
  { value: "legal", label: "Legal" },
  { value: "otros", label: "Otros" },
];

const ROLES = [
  { value: "admin", label: "Administradores" },
  { value: "colaborador", label: "Colaboradores" },
  { value: "contador", label: "Contadores" },
  { value: "cliente", label: "Clientes" },
];

interface ManualFormData {
  titulo: string;
  descripcion: string;
  categoria: string;
  visible_para_roles: string[];
  file: File | null;
}

const Manuales = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<any>(null);
  const [formData, setFormData] = useState<ManualFormData>({
    titulo: "",
    descripcion: "",
    categoria: "otros",
    visible_para_roles: ["admin", "colaborador"],
    file: null,
  });
  const [uploading, setUploading] = useState(false);

  const { data: manuals, isLoading } = useCompanyManuals();
  const createMutation = useCreateCompanyManual();
  const updateMutation = useUpdateCompanyManual();
  const deleteMutation = useDeleteCompanyManual();

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      categoria: "otros",
      visible_para_roles: ["admin", "colaborador"],
      file: null,
    });
    setEditingManual(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingManual && !formData.file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);

    try {
      let filePath = editingManual?.file_path;

      // Upload file if new
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(`company-manuals/${fileName}`, formData.file);

        if (uploadError) throw uploadError;

        filePath = `company-manuals/${fileName}`;

        // Delete old file if editing
        if (editingManual?.file_path) {
          await supabase.storage
            .from('documentos')
            .remove([editingManual.file_path]);
        }
      }

      if (editingManual) {
        await updateMutation.mutateAsync({
          id: editingManual.id,
          updates: {
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            categoria: formData.categoria,
            visible_para_roles: formData.visible_para_roles,
            file_path: filePath,
          },
        });
      } else {
        await createMutation.mutateAsync({
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          categoria: formData.categoria,
          visible_para_roles: formData.visible_para_roles,
          file_path: filePath!,
        });
      }

      resetForm();
      setIsCreateOpen(false);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al guardar manual");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (manual: any) => {
    setEditingManual(manual);
    setFormData({
      titulo: manual.titulo,
      descripcion: manual.descripcion || "",
      categoria: manual.categoria || "otros",
      visible_para_roles: manual.visible_para_roles || ["admin", "colaborador"],
      file: null,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([filePath]);
      
      // Delete from database
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting manual:", error);
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      // Verificar si signedUrl ya es absoluta o relativa
      let fullUrl: string;
      if (data.signedUrl.startsWith('http://') || data.signedUrl.startsWith('https://')) {
        // Ya es URL absoluta, usar tal cual
        fullUrl = data.signedUrl;
      } else {
        // Es URL relativa, construir URL completa
        const SUPABASE_URL = "https://bkthkotzicohjizmcmsa.supabase.co";
        fullUrl = `${SUPABASE_URL}/storage/v1${data.signedUrl}`;
      }

      window.open(fullUrl, '_blank');
    } catch (error) {
      toast.error("Error al abrir archivo");
    }
  };

  const handleDownload = async (filePath: string, titulo: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = titulo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Archivo descargado");
    } catch (error) {
      toast.error("Error al descargar archivo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manuales de Operación</h1>
            <p className="text-muted-foreground">Gestiona los manuales disponibles para tu equipo</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Manual
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingManual ? "Editar Manual" : "Nuevo Manual"}
              </DialogTitle>
              <DialogDescription>
                {editingManual 
                  ? "Actualiza la información del manual" 
                  : "Agrega un nuevo manual de operación para tu equipo"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  placeholder="Ej: Manual de Ventas 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción breve del contenido del manual"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger id="categoria">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visible para</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                    {ROLES.map((role) => (
                      <Badge
                        key={role.value}
                        variant={formData.visible_para_roles.includes(role.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const newRoles = formData.visible_para_roles.includes(role.value)
                            ? formData.visible_para_roles.filter(r => r !== role.value)
                            : [...formData.visible_para_roles, role.value];
                          setFormData({ ...formData, visible_para_roles: newRoles });
                        }}
                      >
                        {role.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">
                  Archivo {editingManual ? "(Opcional - deja vacío para mantener el actual)" : "*"}
                </Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required={!editingManual}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceptados: PDF, Word, Excel, PowerPoint
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsCreateOpen(false);
                  }}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingManual ? "Actualizando..." : "Subiendo..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {editingManual ? "Actualizar" : "Subir Manual"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !manuals || manuals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay manuales</h3>
            <p className="text-muted-foreground mb-4">Comienza agregando tu primer manual</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Manual
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Manuales Registrados ({manuals.length})</CardTitle>
            <CardDescription>Gestiona los manuales disponibles para tu equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {manuals.map((manual) => (
                <div
                  key={manual.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground">{manual.titulo}</h4>
                        {manual.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {manual.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {manual.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORIES.find(c => c.value === manual.categoria)?.label}
                        </Badge>
                      )}
                      {manual.visible_para_roles?.map((role: string) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {ROLES.find(r => r.value === role)?.label}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {new Date(manual.updated_at).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(manual.file_path)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(manual.file_path, manual.titulo)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(manual)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar manual?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(manual.id, manual.file_path)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Manuales;
