import { useState, useRef } from 'react';
import { Camera, MapPin, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useConstructionPhotosUpload } from '@/hooks/useConstructionPhotosUpload';
import { QuickStageSelector } from './QuickStageSelector';
import { CategorySelector } from './CategorySelector';
import { VoiceToTextInput } from './VoiceToTextInput';
import { toast } from 'sonner';

interface MobilePhotoUploadFormProps {
  projectId: string;
  stages: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MobilePhotoUploadForm({
  projectId,
  stages,
  open,
  onOpenChange,
  onSuccess
}: MobilePhotoUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [stageId, setStageId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState('otros');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationProgress, setLocationProgress] = useState(0);
  const [step, setStep] = useState<'capture' | 'stage' | 'category' | 'description' | 'confirm'>('capture');

  const uploadMutation = useConstructionPhotosUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setStep('stage');
      };
      reader.readAsDataURL(file);
      
      // Auto-get location
      getLocation();
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible');
      return;
    }

    setGettingLocation(true);
    setLocationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setLocationProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearInterval(progressInterval);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationProgress(100);
        setGettingLocation(false);
        toast.success('Ubicación capturada ✓');
      },
      (error) => {
        clearInterval(progressInterval);
        console.error('Error obteniendo ubicación:', error);
        setGettingLocation(false);
        setLocationProgress(0);
        toast.error('No se pudo obtener la ubicación');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadMutation.mutateAsync({
      projectId,
      file: selectedFile,
      description: description || undefined,
      visibilidad: 'interno',
      categoria,
      stageId: stageId || null,
      latitude: location?.lat || null,
      longitude: location?.lng || null,
    });

    handleClose();
    onSuccess();
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setDescription('');
    setStageId(null);
    setCategoria('otros');
    setLocation(null);
    setLocationProgress(0);
    setStep('capture');
    onOpenChange(false);
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {step === 'capture' && 'Capturar Foto'}
            {step === 'stage' && 'Selecciona Etapa'}
            {step === 'category' && 'Selecciona Categoría'}
            {step === 'description' && 'Agrega Descripción'}
            {step === 'confirm' && 'Confirmar y Subir'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Step: Capture */}
          {step === 'capture' && !preview && (
            <div className="space-y-6 py-6">
              <Button
                variant="outline"
                className="w-full h-64 border-dashed border-2"
                onClick={openCamera}
              >
                <div className="text-center space-y-3">
                  <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Toca para abrir la cámara</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      La ubicación se capturará automáticamente
                    </p>
                  </div>
                </div>
              </Button>

              {/* Location progress */}
              {gettingLocation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Obteniendo ubicación...</span>
                    <span className="font-medium">{locationProgress}%</span>
                  </div>
                  <Progress value={locationProgress} className="h-2" />
                </div>
              )}

              {location && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Ubicación capturada ✓</span>
                </div>
              )}
            </div>
          )}

          {/* Step: Stage Selection */}
          {step === 'stage' && preview && (
            <div className="space-y-4 py-6">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <QuickStageSelector
                stages={stages}
                selectedStageId={stageId}
                onSelect={setStageId}
              />
            </div>
          )}

          {/* Step: Category Selection */}
          {step === 'category' && (
            <div className="space-y-4 py-6">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <Label>Categoría de la foto</Label>
              <CategorySelector
                selectedCategory={categoria}
                onSelect={setCategoria}
              />
            </div>
          )}

          {/* Step: Description */}
          {step === 'description' && (
            <div className="space-y-4 py-6">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <VoiceToTextInput
                value={description}
                onChange={setDescription}
                placeholder="Describe lo que se ve en la foto..."
              />
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4 py-6">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Etapa:</span>
                  <span className="font-medium">
                    {stageId ? stages.find(s => s.id === stageId)?.name : 'Sin etapa'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoría:</span>
                  <span className="font-medium capitalize">{categoria}</span>
                </div>
                {description && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Descripción:</span>
                    <p className="mt-1">{description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {location ? 'Con ubicación GPS' : 'Sin ubicación'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t space-y-2">
          {step === 'capture' && preview && (
            <Button size="lg" className="w-full" onClick={() => setStep('stage')}>
              Continuar
            </Button>
          )}

          {step === 'stage' && (
            <div className="space-y-2">
              <Button size="lg" className="w-full" onClick={() => setStep('category')}>
                Continuar
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setStep('capture')}>
                Atrás
              </Button>
            </div>
          )}

          {step === 'category' && (
            <div className="space-y-2">
              <Button size="lg" className="w-full" onClick={() => setStep('description')}>
                Continuar
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setStep('stage')}>
                Atrás
              </Button>
            </div>
          )}

          {step === 'description' && (
            <div className="space-y-2">
              <Button size="lg" className="w-full" onClick={() => setStep('confirm')}>
                Continuar
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setStep('category')}>
                Atrás
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-2">
              <Button
                size="lg"
                className="w-full h-14"
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !selectedFile}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Upload className="h-5 w-5 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Subir Foto
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setStep('description')}>
                Atrás
              </Button>
            </div>
          )}

          <Button variant="ghost" size="lg" className="w-full" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
