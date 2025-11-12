import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProject } from "@/contexts/client-app/ProjectContext";
import { useClientPhotos } from "@/hooks/client-app/useClientData";
import { shouldShowConstructionPhotos } from "@/lib/project-utils";
import { Download, Maximize2, Image as ImageIcon, Camera, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoViewer from "@/components/client-app/PhotoViewer";
import { CameraCapture } from "@/components/construction/CameraCapture";
import { useAuth } from '@/app/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PhotosGridSkeletonDesktop, ClientLoadingState, ClientEmptyState, ClientErrorState } from '@/components/client-app/ClientSkeletons';
import { useClientError } from '@/hooks/client-app/useClientError';
import { MapPreview } from '@/components/construction/MapPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function PhotosDesktop() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const { handleError } = useClientError();
  const navigate = useNavigate();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lat: number; lng: number; description?: string } | null>(null);
  
  // Fetch photos using unified hook that respects mock/real toggle
  const { data: photos = [], isLoading, error, refetch } = useClientPhotos(currentProject?.id || null);

  // Check user role - only staff can upload
  const [isStaff, setIsStaff] = useState(false);
  
  // UseEffect to check role
  useEffect(() => {
    if (user) {
      supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setIsStaff(data?.role_name !== 'cliente');
        });
    }
  }, [user]);
  
  // Check if should show construction photos
  if (!shouldShowConstructionPhotos(currentProject)) {
    return (
      <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2 flex items-center justify-center">
        <ClientEmptyState
          icon={ImageIcon}
          title="Fase de Diseño en Curso"
          description="Las fotos de avance de obra estarán disponibles cuando inicie la fase de construcción. Por ahora puedes revisar los renders y documentos de diseño en la sección de Documentos."
          action={
            <Button size="lg" onClick={() => navigate('/client/documents')}>
              Ver Documentos de Diseño
            </Button>
          }
        />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
        <div>
          <h1 className="text-3xl font-bold mb-2">Galería de Fotos</h1>
          <p className="text-muted-foreground">Explora el progreso visual de tu proyecto</p>
        </div>
        <ClientErrorState
          title="Error al cargar fotos"
          description="No pudimos obtener las fotos de tu proyecto. Verifica tu conexión e intenta nuevamente."
          onRetry={() => refetch()}
          icon={ImageIcon}
        />
      </div>
    );
  }
  
  if (isLoading) {
    return <PhotosGridSkeletonDesktop count={12} />;
  }

  const handleDownloadAll = async () => {
    for (const photo of photos) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${photo.description || 'foto'}-${format(new Date(photo.date), 'yyyy-MM-dd')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    }
  };

  const handleViewMap = (photo: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent photo click
    if (photo.latitude && photo.longitude) {
      setSelectedMapLocation({
        lat: photo.latitude,
        lng: photo.longitude,
        description: photo.description || photo.descripcion
      });
      setMapDialogOpen(true);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Galería de Fotos</h1>
          <p className="text-muted-foreground">{photos.length} fotos del progreso de tu obra</p>
        </div>
        <div className="flex gap-2">
          {isStaff && (
            <Button onClick={() => setCameraOpen(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Capturar Foto
            </Button>
          )}
          <Button onClick={handleDownloadAll} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar Todas
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 animate-fade-in">
        {photos.map((photo: any, index) => (
          <Card 
            key={photo.id}
            className="group cursor-pointer overflow-hidden hover-lift transition-smooth"
            style={{ animationDelay: `${index * 0.03}s` }}
            onClick={() => setSelectedPhotoIndex(index)}
          >
            {/* Layout con imagen + mini-mapa si hay geolocalización */}
            <div className={photo.latitude && photo.longitude ? "grid grid-cols-[1fr_100px] gap-0" : ""}>
              <div className="relative aspect-square">
                <img 
                  src={photo.url} 
                  alt={photo.description || 'Foto'}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute top-2 right-2">
                  <Badge>{format(new Date(photo.date || new Date()), "d MMM yyyy", { locale: es })}</Badge>
                </div>
              </div>

              {/* Mini-mapa Thumbnail */}
              {photo.latitude && photo.longitude && (
                <div 
                  className="relative aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => handleViewMap(photo, e)}
                >
                  <MapPreview
                    latitude={photo.latitude}
                    longitude={photo.longitude}
                    description={photo.description}
                    height="100%"
                    className="h-full"
                  />
                  {/* Overlay con ícono MapPin */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                    <MapPin className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-1">{photo.description || 'Sin descripción'}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {photo.latitude && photo.longitude ? (
                  <>
                    <MapPin className="h-3 w-3" />
                    Ver en mapa
                  </>
                ) : (
                  'Construcción'
                )}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Camera Capture Modal */}
      {currentProject && (
        <CameraCapture
          projectId={currentProject.id}
          open={cameraOpen}
          onOpenChange={setCameraOpen}
        />
      )}

      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={photos as any}
          currentIndex={selectedPhotoIndex}
          open={selectedPhotoIndex !== null}
          onOpenChange={(open) => !open && setSelectedPhotoIndex(null)}
          onNavigate={setSelectedPhotoIndex}
        />
      )}

      {/* Map Dialog */}
      {selectedMapLocation && (
        <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedMapLocation.description || "Ubicación de la Foto"}
              </DialogTitle>
            </DialogHeader>
            <MapPreview
              latitude={selectedMapLocation.lat}
              longitude={selectedMapLocation.lng}
              description={selectedMapLocation.description}
              height="400px"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
