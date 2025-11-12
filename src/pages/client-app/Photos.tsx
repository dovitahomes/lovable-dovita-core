import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useClientPhotos } from '@/hooks/client-app/useClientData';
import { useEventNotifications } from '@/hooks/client-app/useEventNotifications';
import { shouldShowConstructionPhotos, isInDesignPhase } from '@/lib/project-utils';
import { MapPin, Calendar, Image as ImageIcon, Filter, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import PhotoViewer from '@/components/client-app/PhotoViewer';
import { CameraCapture } from '@/components/construction/CameraCapture';
import { useAuth } from '@/app/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { PhotosGridSkeleton, ClientEmptyState, ClientErrorState } from '@/components/client-app/ClientSkeletons';
import { useClientError } from '@/hooks/client-app/useClientError';
import { MapPreview } from '@/components/construction/MapPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function Photos() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const { handleError } = useClientError();
  const navigate = useNavigate();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lat: number; lng: number; description?: string } | null>(null);

  // Fetch photos using unified hook that respects mock/real toggle
  // Escuchar notificaciones en tiempo real de cambios en citas
  useEventNotifications(currentProject?.id);
  const { data: projectPhotos = [], isLoading, error, refetch } = useClientPhotos(currentProject?.id || null);

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
      <div className="h-full overflow-y-auto p-4 pb-[130px]">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4 rounded-lg">
          <h1 className="text-2xl font-bold mb-1">Fotos de Avance</h1>
          <p className="text-sm text-white/90">
            Las fotos de construcción estarán disponibles próximamente
          </p>
        </div>
        <ClientEmptyState
          icon={ImageIcon}
          title="Fase de Diseño en Curso"
          description="Las fotos de avance de obra estarán disponibles cuando inicie la fase de construcción. Por ahora puedes revisar los renders y documentos de diseño en la sección de Documentos."
          action={
            <Button onClick={() => navigate('/client/documents')}>
              Ver Documentos de Diseño
            </Button>
          }
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full overflow-y-auto pb-[130px]">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4">
          <h1 className="text-2xl font-bold mb-1">Fotos de Avance</h1>
          <p className="text-sm text-white/90">
            Visualiza el progreso de tu proyecto
          </p>
        </div>
        <div className="px-4">
          <ClientErrorState
            title="Error al cargar fotos"
            description="No pudimos obtener las fotos de tu proyecto. Verifica tu conexión e intenta nuevamente."
            onRetry={() => refetch()}
            icon={ImageIcon}
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto pb-[130px]">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4">
          <h1 className="text-2xl font-bold mb-1">Fotos de Avance</h1>
          <p className="text-sm text-white/90">
            Visualiza el progreso de tu proyecto
          </p>
        </div>
        <div className="px-4">
          <PhotosGridSkeleton />
        </div>
      </div>
    );
  }

  // Determine if in design phase
  const inDesignPhase = isInDesignPhase(currentProject);
  
  // Get unique phases from project photos (handle both mock and real data)
  const projectPhases = Array.from(new Set(
    projectPhotos.map(photo => 'Construcción') // Simplified - no phase field in real data
  ));

  // Get unique phases for tabs
  const phases = ['all'];

  // Filter photos by phase
  const filteredPhotos = projectPhotos;

  const handlePhotoClick = (index: number) => {
    // Find the original index in the full project photos array
    const photo = filteredPhotos[index];
    const originalIndex = projectPhotos.findIndex(p => p.id === photo.id);
    setSelectedPhotoIndex(originalIndex);
  };

  const handleViewMap = (photo: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent photo click
    if (photo.latitude && photo.longitude) {
      setSelectedMapLocation({
        lat: photo.latitude,
        lng: photo.longitude,
        description: photo.descripcion
      });
      setMapDialogOpen(true);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-[130px]">
      {/* Header con Degradado Azul */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold mb-1">Fotos de Avance</h1>
            <p className="text-sm text-white/90">
              Visualiza el progreso de tu proyecto
            </p>
          </div>
          {/* Badge Contador */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <span className="font-semibold">{filteredPhotos.length}</span>
            </div>
            <p className="text-xs text-white/80 mt-1">fotos</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Galería de Fotos (Grid 2 columnas) */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {filteredPhotos.map((photo, index) => (
              <Card 
                key={photo.id} 
                className="overflow-hidden cursor-pointer hover-scale press-feedback transition-smooth"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handlePhotoClick(index)}
              >
                {/* Layout Grid con Imagen + Mini-mapa si hay geolocalización */}
                <div className={photo.latitude && photo.longitude ? "grid grid-cols-[1fr_80px] gap-0" : ""}>
                  {/* Contenedor de Imagen */}
                  <div className="relative aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.descripcion || 'Foto'}
                      className="w-full h-full object-cover"
                    />
                    {/* Badge de Fecha */}
                    <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-white">
                      {format(new Date(photo.fecha_foto || new Date()), "d MMM", { locale: es })}
                    </Badge>
                    {/* Overlay de Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium line-clamp-2">
                          {photo.descripcion || 'Sin descripción'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mini-mapa Thumbnail (solo si hay geolocalización) */}
                  {photo.latitude && photo.longitude && (
                    <div 
                      className="relative aspect-square bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => handleViewMap(photo, e)}
                    >
                      <MapPreview
                        latitude={photo.latitude}
                        longitude={photo.longitude}
                        description={photo.descripcion}
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
                
                {/* Información debajo */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(photo.fecha_foto || new Date()), "d MMM yyyy", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {photo.latitude && photo.longitude ? 'Ver en mapa' : currentProject?.location || 'Obra'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <ClientEmptyState
            icon={ImageIcon}
            title="No hay fotos"
            description="No hay fotos disponibles para esta fase"
          />
        )}
      </div>

      {/* FAB - Floating Action Button (solo para staff) */}
      {isStaff && (
        <Button
          size="lg"
          className="fixed right-4 bottom-24 h-14 w-14 rounded-full shadow-lg z-50"
          onClick={() => setCameraOpen(true)}
        >
          <Camera className="h-6 w-6" />
        </Button>
      )}

      {/* Camera Capture Modal */}
      {currentProject && (
        <CameraCapture
          projectId={currentProject.id}
          open={cameraOpen}
          onOpenChange={setCameraOpen}
        />
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewer
        open={selectedPhotoIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPhotoIndex(null);
        }}
        photos={projectPhotos as any}
        currentIndex={selectedPhotoIndex ?? 0}
        onNavigate={setSelectedPhotoIndex}
      />

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
