import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  useAllFeaturedRenders,
  useCreateFeaturedRender,
  useUpdateFeaturedRender,
  useDeleteFeaturedRender,
} from "@/hooks/useFeaturedRender";
import { useProjectsList } from "@/hooks/useProjects";
import { uploadToBucket, getSignedUrl } from "@/lib/storage-helpers";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Trash2, Edit2, Plus, Search, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function RendersManagement() {
  const { data: renders, isLoading } = useAllFeaturedRenders();
  const { data: projects } = useProjectsList({});
  const createMutation = useCreateFeaturedRender();
  const updateMutation = useUpdateFeaturedRender();
  const deleteMutation = useDeleteFeaturedRender();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingRender, setEditingRender] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    mes_ano: new Date().toISOString().slice(0, 7),
    titulo: "",
    autor: "",
    proyecto_id: null,
    caption: "",
    imagen_path: "",
    active: true,
  });

  const handleOpenDialog = (render?: any) => {
    if (render) {
      setEditingRender(render);
    setFormData({
      mes_ano: render.mes_ano,
      titulo: render.titulo,
      autor: render.autor || "",
      proyecto_id: render.proyecto_id || null,
      caption: render.caption || "",
      imagen_path: render.imagen_path,
      active: render.active,
    });
    } else {
      setEditingRender(null);
    setFormData({
      mes_ano: new Date().toISOString().slice(0, 7),
      titulo: "",
      autor: "",
      proyecto_id: null,
      caption: "",
      imagen_path: "",
      active: true,
    });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const { path } = await uploadToBucket({
        file,
        bucket: 'documentos',
        filename: `corporate/renders/render-${Date.now()}.${file.name.split('.').pop()}`,
      });

      setFormData({ ...formData, imagen_path: path });
      toast({ description: "Imagen cargada exitosamente" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        description: "Error al cargar imagen",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.imagen_path) {
      toast({
        variant: "destructive",
        description: "Debes cargar una imagen",
      });
      return;
    }

    if (!formData.titulo.trim()) {
      toast({
        variant: "destructive",
        description: "El título es obligatorio",
      });
      return;
    }

    try {
      // Sanitizar datos antes de enviar
      const sanitizedData = {
        ...formData,
        proyecto_id: formData.proyecto_id === "ninguno" || formData.proyecto_id === "" 
          ? null 
          : formData.proyecto_id,
        autor: formData.autor.trim() || null,
        caption: formData.caption.trim() || null,
      };

      if (editingRender) {
        await updateMutation.mutateAsync({
          id: editingRender.id,
          updates: sanitizedData,
        });
      } else {
        await createMutation.mutateAsync(sanitizedData);
      }
      setDialogOpen(false);
      setEditingRender(null);
    } catch (error) {
      console.error('Error saving render:', error);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await updateMutation.mutateAsync({
      id,
      updates: { active: !currentActive },
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const filteredRenders = renders?.filter((render) => {
    const search = searchTerm.toLowerCase();
    return (
      render.titulo.toLowerCase().includes(search) ||
      render.autor?.toLowerCase().includes(search) ||
      render.mes_ano.includes(search)
    );
  });

  useEffect(() => {
    if (filteredRenders) {
      filteredRenders.forEach(async (render) => {
        if (render.imagen_path) {
          try {
            const { url } = await getSignedUrl({
              bucket: 'documentos',
              path: render.imagen_path,
              expiresInSeconds: 3600
            });
            setImageUrls(prev => ({ ...prev, [render.id]: url }));
          } catch (error) {
            console.error('Error loading image:', error);
          }
        }
      });
    }
  }, [filteredRenders]);

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
                <ImageIcon className="h-5 w-5" />
                Renders del Mes
              </CardTitle>
              <CardDescription>
                Gestiona los renders destacados que se muestran en el Dashboard
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Render
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, autor o mes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-3">
            {filteredRenders && filteredRenders.length > 0 ? (
              filteredRenders.map((render) => (
                <div
                  key={render.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {imageUrls[render.id] ? (
                        <img
                          src={imageUrls[render.id]}
                          alt={render.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{render.titulo}</h3>
                        <Badge variant={render.active ? "default" : "secondary"}>
                          {render.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(render.mes_ano + '-01'), 'MMMM yyyy', { locale: es })}
                        {render.autor && ` • Por: ${render.autor}`}
                      </p>
                      {render.caption && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {render.caption}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(render.id, render.active)}
                      title={render.active ? "Desactivar" : "Activar"}
                    >
                      {render.active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(render)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(render.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {searchTerm
                    ? "No se encontraron renders con ese criterio"
                    : "No hay renders configurados"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => handleOpenDialog()} className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Render
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
              {editingRender ? "Editar Render" : "Nuevo Render del Mes"}
            </DialogTitle>
            <DialogDescription>
              {editingRender
                ? "Actualiza la información del render destacado"
                : "Crea un nuevo render para destacar en el Dashboard"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mes_ano">Mes y Año *</Label>
                <Input
                  id="mes_ano"
                  type="month"
                  value={formData.mes_ano}
                  onChange={(e) => setFormData({ ...formData, mes_ano: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Casa Moderna en Coyoacán"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="autor">Autor</Label>
                <Input
                  id="autor"
                  value={formData.autor}
                  onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                  placeholder="Arq. Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proyecto_id">Proyecto (Opcional)</Label>
                <Select
                  value={formData.proyecto_id || "ninguno"}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    proyecto_id: value === "ninguno" ? null : value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Ninguno</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name || project.clients?.name || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Descripción</Label>
              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Breve descripción del render..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen del Render *</Label>
              <Input
                id="imagen"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
              )}
              {formData.imagen_path && !uploading && (
                <p className="text-sm text-green-600">✓ Imagen cargada exitosamente</p>
              )}
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
              {editingRender ? "Actualizar" : "Crear"} Render
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar render?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El render será eliminado permanentemente.
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
