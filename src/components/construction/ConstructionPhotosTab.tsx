import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket, getSignedUrl, deleteFromBucket } from "@/lib/storage/storage-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, MapPin, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ConstructionPhotosTabProps {
  projectId: string;
}

export function ConstructionPhotosTab({ projectId }: ConstructionPhotosTabProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState("");
  const [visibilidad, setVisibilidad] = useState<"interno" | "cliente">("interno");
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
    getCurrentLocation();
  }, [projectId]);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const loadPhotos = async () => {
    const { data, error } = await supabase
      .from("construction_photos")
      .select("*")
      .eq("project_id", projectId)
      .order("fecha_foto", { ascending: false });

    if (!error && data) {
      setPhotos(data);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const file = acceptedFiles[0];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Upload to storage using helper (path: projectId/YYYY-MM-uuid.ext)
      const { path } = await uploadToBucket({
        bucket: "construction-photos",
        projectId,
        file,
        filename: file.name
      });

      // Insert photo record
      const { error: insertError } = await supabase
        .from("construction_photos")
        .insert({
          project_id: projectId,
          file_url: path, // Store only the path
          file_name: file.name,
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          descripcion: description || null,
          visibilidad,
          uploaded_by: user.id,
          fecha_foto: new Date().toISOString(),
        });

      if (insertError) {
        // Cleanup: delete uploaded file if DB insert fails
        await deleteFromBucket("construction-photos", path);
        throw insertError;
      }

      toast.success("Foto subida exitosamente");
      setDescription("");
      loadPhotos();
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error("Error al subir la foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  const viewPhoto = async (photo: any) => {
    setSelectedPhoto(photo);
    setPhotoDialogOpen(true);
    
    // Get signed URL for private bucket
    try {
      const { url } = await getSignedUrl({
        bucket: "construction-photos",
        path: photo.file_url,
        expiresInSeconds: 600 // 10 minutes
      });
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error getting signed URL:", error);
      toast.error("Error al cargar la foto");
    }
  };

  const deletePhoto = async (photo: any) => {
    if (!confirm(`¿Eliminar esta foto?`)) return;

    try {
      // Delete from storage
      await deleteFromBucket("construction-photos", photo.file_url);

      // Delete record
      const { error } = await supabase
        .from("construction_photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw error;

      toast.success("Foto eliminada");
      loadPhotos();
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error("Error al eliminar la foto");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir Foto de Obra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Latitud</Label>
              <Input
                type="number"
                step="any"
                value={location?.lat || ""}
                onChange={(e) => setLocation(prev => ({ ...prev!, lat: parseFloat(e.target.value) || 0 }))}
                placeholder="19.4326"
              />
            </div>
            <div>
              <Label>Longitud</Label>
              <Input
                type="number"
                step="any"
                value={location?.lng || ""}
                onChange={(e) => setLocation(prev => ({ ...prev!, lng: parseFloat(e.target.value) || 0 }))}
                placeholder="-99.1332"
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la foto..."
              rows={3}
            />
          </div>

          <div>
            <Label>Visibilidad</Label>
            <Select value={visibilidad} onValueChange={(v: any) => setVisibilidad(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interno">Solo Interno</SelectItem>
                <SelectItem value="cliente">Visible para Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploading ? (
              <p>Subiendo...</p>
            ) : isDragActive ? (
              <p>Suelta la imagen aquí...</p>
            ) : (
              <p>Arrastra una imagen o haz clic para seleccionar</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Galería de Fotografías</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay fotografías aún</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => viewPhoto(photo)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePhoto(photo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {photo.descripcion && (
                    <p className="text-sm text-muted-foreground mt-2">{photo.descripcion}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(photo.fecha_foto).toLocaleDateString('es-MX')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={photoDialogOpen} onOpenChange={(open) => {
        setPhotoDialogOpen(open);
        if (!open) {
          setPreviewUrl(null);
          setSelectedPhoto(null);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Fotografía de Construcción</DialogTitle>
          </DialogHeader>
          {selectedPhoto && previewUrl && (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt={selectedPhoto.descripcion || "Foto de construcción"}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
              {selectedPhoto.descripcion && (
                <p className="text-sm">{selectedPhoto.descripcion}</p>
              )}
              {selectedPhoto.latitude && selectedPhoto.longitude && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude.toFixed(6)}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Subida: {new Date(selectedPhoto.fecha_foto).toLocaleString('es-MX')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
