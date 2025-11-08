import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, Check, MapPin } from 'lucide-react';
import { useConstructionPhotosUpload } from '@/hooks/useConstructionPhotosUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CameraCaptureProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraCapture({ projectId, open, onOpenChange }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [visibilidad, setVisibilidad] = useState<'cliente' | 'interno'>('cliente');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const uploadMutation = useConstructionPhotosUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Auto-get location when photo is selected
      getLocation();
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocalización no disponible');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        setGettingLocation(false);
      }
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadMutation.mutateAsync({
      projectId,
      file: selectedFile,
      description,
      visibilidad,
      latitude: location?.lat || null,
      longitude: location?.lng || null,
    });

    handleClose();
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setDescription('');
    setVisibilidad('cliente');
    setLocation(null);
    onOpenChange(false);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capturar Foto de Obra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden file input with camera capture */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Preview or Camera Button */}
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-64 border-dashed"
              onClick={handleCameraClick}
            >
              <div className="text-center space-y-2">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Toca para abrir la cámara
                </p>
              </div>
            </Button>
          )}

          {/* Description */}
          {preview && (
            <>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Ej: Instalación de fontanería"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibilidad</Label>
                <Select
                  value={visibilidad}
                  onValueChange={(value: 'cliente' | 'interno') => setVisibilidad(value)}
                >
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Visible para Cliente</SelectItem>
                    <SelectItem value="interno">Solo Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {gettingLocation ? (
                  <span>Obteniendo ubicación...</span>
                ) : location ? (
                  <span>Ubicación capturada</span>
                ) : (
                  <span>Sin ubicación</span>
                )}
              </div>
            </>
          )}
        </div>

        {preview && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !selectedFile}
            >
              {uploadMutation.isPending ? (
                'Subiendo...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar Foto
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
