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

export default function ImagenAuth() {
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
      <div className="container mx-auto py-8">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Imagen de Login</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la imagen de fondo que se muestra en la página de inicio de sesión
        </p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nueva Imagen
          </CardTitle>
          <CardDescription>
            Formato recomendado: JPG o PNG, 2160x1440px (landscape), máximo 5MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                <ImageIcon className="h-4 w-4" />
                Seleccionar Imagen
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {uploading && (
              <span className="text-sm text-muted-foreground">
                Subiendo imagen...
              </span>
            )}
          </div>

          {previewUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-64 object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images List */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes Subidas</CardTitle>
          <CardDescription>
            Solo una imagen puede estar activa a la vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!images || images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay imágenes subidas</p>
              <p className="text-sm mt-2">Sube tu primera imagen de hero para el login</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative rounded-lg border border-border overflow-hidden bg-card hover:shadow-lg transition-all"
                >
                  {/* Image */}
                  <div className="aspect-video relative">
                    {imageUrls[image.id] ? (
                      <img
                        src={imageUrls[image.id]}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Skeleton className="w-full h-full" />
                    )}
                    
                    {/* Badge Active */}
                    {image.active && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        Activa
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {new Date(image.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={image.active ? "secondary" : "outline"}
                        onClick={() => toggleActive(image.id, image.active)}
                        disabled={toggleMutation.isPending}
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
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(image.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen se eliminará permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
