import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useAllAuthHeroImages, 
  useCreateAuthHeroImage, 
  useToggleAuthHeroImage,
  useDeleteAuthHeroImage 
} from "@/hooks/useAuthHeroImage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, Trash2, Upload, Eye, EyeOff } from "lucide-react";
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
import { getSignedUrl } from "@/lib/storage-helpers";

export default function ImagenAuthManagement() {
  const { data: images, isLoading } = useAllAuthHeroImages();
  const createMutation = useCreateAuthHeroImage();
  const toggleMutation = useToggleAuthHeroImage();
  const deleteMutation = useDeleteAuthHeroImage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Generar signed URLs para las imágenes
  useEffect(() => {
    if (images) {
      Promise.all(
        images.map(async (img) => {
          const { url } = await getSignedUrl({
            bucket: 'auth-hero-images',
            path: img.image_path,
            expiresInSeconds: 3600,
          });
          return { id: img.id, url };
        })
      ).then((urls) => {
        const urlMap = urls.reduce((acc, { id, url }) => {
          acc[id] = url;
          return acc;
        }, {} as Record<string, string>);
        setImageUrls(urlMap);
      });
    }
  }, [images]);

  // Preview local del archivo seleccionado
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validaciones
      if (!file.type.startsWith('image/')) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar 5MB");
        return;
      }
      
      setSelectedFile(file);
      
      // Upload inmediato
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `hero-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('auth-hero-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Crear registro en DB
        await createMutation.mutateAsync(filePath);
        
        // Limpiar
        setSelectedFile(null);
        setPreviewUrl("");
        
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error("Error al cargar imagen");
      } finally {
        setUploading(false);
      }
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await toggleMutation.mutateAsync({ id, active: !currentActive });
  };

  const handleDelete = async () => {
    if (deleteId) {
      const image = images?.find(img => img.id === deleteId);
      if (image) {
        await deleteMutation.mutateAsync({ 
          id: deleteId, 
          imagePath: image.image_path 
        });
      }
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nueva Imagen
          </CardTitle>
          <CardDescription>
            La imagen de fondo para la página de login (máx. 5MB, JPG/PNG/WEBP)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <label htmlFor="hero-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground">
                  Haz clic para seleccionar una imagen
                </div>
                <input
                  id="hero-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {uploading && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
            </div>
          )}

          {previewUrl && !uploading && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imágenes Guardadas</CardTitle>
          <CardDescription>
            Gestiona las imágenes de login. Solo una puede estar activa a la vez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!images || images.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay imágenes guardadas aún
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="relative aspect-video">
                    {imageUrls[image.id] ? (
                      <img
                        src={imageUrls[image.id]}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {image.active && (
                      <Badge className="absolute top-2 right-2" variant="default">
                        Activa
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(image.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant={image.active ? "secondary" : "default"}
                          size="sm"
                          onClick={() => toggleActive(image.id, image.active || false)}
                          className="flex-1"
                        >
                          {image.active ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Activar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen se eliminará permanentemente del servidor.
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
