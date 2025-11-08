import { useState } from "react";
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
  useAllFeaturedRenders, 
  useCreateFeaturedRender, 
  useUpdateFeaturedRender,
  useDeleteFeaturedRender 
} from "@/hooks/useFeaturedRender";
import { useProjectsList } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, Trash2, Upload, Eye } from "lucide-react";
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

export default function RenderDelMes() {
  const { data: renders, isLoading } = useAllFeaturedRenders();
  const { data: projects } = useProjectsList({});
  const createMutation = useCreateFeaturedRender();
  const updateMutation = useUpdateFeaturedRender();
  const deleteMutation = useDeleteFeaturedRender();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    mes_ano: new Date().toISOString().slice(0, 7),
    titulo: "",
    autor: "",
    proyecto_id: "",
    caption: "",
    imagen_path: "",
    active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Upload immediately
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `render-${Date.now()}.${fileExt}`;
        const filePath = `renders/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project_photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        setFormData({ ...formData, imagen_path: filePath });
        toast({ description: "Imagen cargada exitosamente" });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({ 
          variant: "destructive",
          description: "Error al cargar imagen" 
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imagen_path) {
      toast({ 
        variant: "destructive",
        description: "Debes cargar una imagen" 
      });
      return;
    }

    await createMutation.mutateAsync(formData);
    setIsFormOpen(false);
    setFormData({
      mes_ano: new Date().toISOString().slice(0, 7),
      titulo: "",
      autor: "",
      proyecto_id: "",
      caption: "",
      imagen_path: "",
      active: true,
    });
    setSelectedFile(null);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Render del Mes</h1>
          <p className="text-muted-foreground">
            Gestiona el render destacado que se muestra en el Dashboard
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? "Cancelar" : "Nuevo Render"}
        </Button>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Render del Mes</CardTitle>
            <CardDescription>
              Sube un render destacado para el mes seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mes_ano">Mes y Año</Label>
                  <Input
                    id="mes_ano"
                    type="month"
                    value={formData.mes_ano}
                    onChange={(e) => setFormData({ ...formData, mes_ano: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Casa Moderna en Coyoacán"
                    required
                  />
                </div>

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
                    value={formData.proyecto_id}
                    onValueChange={(value) => setFormData({ ...formData, proyecto_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguno</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.clients?.name || 'Sin cliente'}
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
                <Label htmlFor="imagen">Imagen del Render</Label>
                <div className="flex gap-2">
                  <Input
                    id="imagen"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {uploading && <Skeleton className="h-10 w-20" />}
                  {formData.imagen_path && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Cargada
                    </Badge>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={createMutation.isPending || uploading || !formData.imagen_path}
                className="w-full"
              >
                {createMutation.isPending ? "Guardando..." : "Guardar Render del Mes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Renders Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {renders && renders.length > 0 ? (
              renders.map((render) => (
                <div
                  key={render.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{render.titulo}</h3>
                        <Badge variant={render.active ? "default" : "secondary"}>
                          {render.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {render.mes_ano} {render.autor && `• Por: ${render.autor}`}
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
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(render.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay renders configurados
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
