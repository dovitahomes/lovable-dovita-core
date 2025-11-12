import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl, deleteFromBucket } from "@/lib/storage-helpers";
import { useConstructionPhotosUpload } from "@/hooks/useConstructionPhotosUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, MapPin, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MapPreview } from "./MapPreview";
import { PHOTO_CATEGORIES, getCategoryLabel, getCategoryIcon } from "@/lib/constants/photo-categories";

interface ConstructionPhotosTabProps {
  projectId: string;
}

export function ConstructionPhotosTab({ projectId }: ConstructionPhotosTabProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState("");
  const [visibilidad, setVisibilidad] = useState<"interno" | "cliente">("interno");
  const [categoria, setCategoria] = useState<string>("otros");
  const [stageId, setStageId] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const uploadMutation = useConstructionPhotosUpload();

  useEffect(() => {
    loadPhotos();
    loadStages();
    getCurrentLocation();
  }, [projectId]);

  const loadStages = async () => {
    const { data, error } = await supabase
      .from("construction_stages")
      .select("id, name, progress")
      .eq("project_id", projectId)
      .order("start_date", { ascending: true });

    if (!error && data) {
      setStages(data);
    }
  };

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
      .select(`
        *,
        construction_stages(name)
      `)
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("fecha_foto", { ascending: false });

    if (!error && data) {
      setPhotos(data);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    uploadMutation.mutate({
      projectId,
      file,
      description,
      visibilidad,
      categoria,
      stageId: stageId || null,
      latitude: location?.lat,
      longitude: location?.lng,
    }, {
      onSuccess: () => {
        setDescription("");
        setCategoria("otros");
        setStageId("");
        loadPhotos();
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    disabled: uploadMutation.isPending,
  });

  const viewPhoto = async (photo: any) => {
    try {
      // Generate signed URL for viewing
      const { url } = await getSignedUrl({
        bucket: "project_photos",
        path: photo.file_url,
        expiresInSeconds: 600
      });
      
      setPreviewUrl(url);
      setSelectedPhoto(photo);
      setPhotoDialogOpen(true);
    } catch (error) {
      console.error("Error loading photo:", error);
      toast.error("No se pudo cargar la foto");
    }
  };

  const deletePhoto = async (photoId: string, filePath: string) => {
    if (!confirm("¿Estás seguro de eliminar esta foto?")) return;

    try {
      // Soft delete - just mark as inactive
      const { error } = await supabase
        .from("construction_photos")
        .update({ is_active: false })
        .eq("id", photoId);

      if (error) throw error;

      toast.success("Foto eliminada");
      loadPhotos();
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error(error.message || "Error al eliminar la foto");
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
            <Label>Etapa de Construcción</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una etapa (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguna</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name} - {stage.progress}% completo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categoría</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHOTO_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
            } ${uploadMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploadMutation.isPending ? (
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
              {photos.map((photo) => {
                const CategoryIcon = getCategoryIcon(photo.categoria);
                return (
                  <div key={photo.id} className="relative group">
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Badges en la esquina superior izquierda */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {photo.categoria && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <CategoryIcon className="h-3 w-3" />
                          {getCategoryLabel(photo.categoria)}
                        </Badge>
                      )}
                      {photo.construction_stages?.name && (
                        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                          {photo.construction_stages.name}
                        </Badge>
                      )}
                    </div>

                    {/* Quick actions */}
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
                        onClick={() => deletePhoto(photo.id, photo.file_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Info */}
                    {photo.descripcion && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{photo.descripcion}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(photo.fecha_foto).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                );
              })}
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
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">Ubicación de la Foto</Label>
                  <MapPreview 
                    latitude={selectedPhoto.latitude}
                    longitude={selectedPhoto.longitude}
                    description={selectedPhoto.descripcion}
                    height="300px"
                  />
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
