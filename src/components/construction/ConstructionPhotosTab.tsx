import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, MapPin, Eye } from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ConstructionPhotosTabProps {
  projectId: string;
}

export function ConstructionPhotosTab({ projectId }: ConstructionPhotosTabProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [visibilidad, setVisibilidad] = useState<"interno" | "cliente">("interno");
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  useEffect(() => {
    loadPhotos();
    getCurrentLocation();
  }, [projectId]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
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

    if (error) {
      toast.error("Error al cargar fotos");
      return;
    }
    setPhotos(data || []);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const file = acceptedFiles[0];

    try {
      const { data: user } = await supabase.auth.getUser();
      const fileExt = file.name.split(".").pop();
      const fileName = `${projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("construction_photos")
        .insert({
          project_id: projectId,
          file_url: publicUrl,
          file_name: file.name,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          descripcion: descripcion || null,
          visibilidad,
          uploaded_by: user?.user?.id || null,
        });

      if (insertError) throw insertError;

      toast.success("Foto subida correctamente");
      setDescripcion("");
      loadPhotos();
    } catch (error: any) {
      toast.error("Error al subir foto: " + error.message);
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

  const viewPhoto = (photo: any) => {
    setSelectedPhoto(photo);
    setShowPhotoDialog(true);
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
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="19.4326"
              />
            </div>
            <div>
              <Label>Longitud</Label>
              <Input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-99.1332"
              />
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
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
          <CardTitle>Galería de Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay fotos subidas
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                  onClick={() => viewPhoto(photo)}
                >
                  <img
                    src={photo.file_url}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  {(photo.latitude || photo.longitude) && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
                      <MapPin className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.file_url}
                alt={selectedPhoto.file_name}
                className="w-full rounded-lg"
              />
              <div className="space-y-2">
                {selectedPhoto.descripcion && (
                  <p className="text-sm">{selectedPhoto.descripcion}</p>
                )}
                {(selectedPhoto.latitude || selectedPhoto.longitude) && (
                  <p className="text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {selectedPhoto.latitude}, {selectedPhoto.longitude}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedPhoto.fecha_foto).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
