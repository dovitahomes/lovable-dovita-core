import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProject } from "@/contexts/client-app/ProjectContext";
import { useProjectPhotos } from "@/hooks/useProjectPhotos";
import { shouldShowConstructionPhotos } from "@/lib/project-utils";
import { Download, Maximize2, Image as ImageIcon, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PhotoViewer from "@/components/client-app/PhotoViewer";
import { CameraCapture } from "@/components/construction/CameraCapture";
import { useAuth } from '@/app/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export default function PhotosDesktop() {
  const { currentProject } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  
  // Fetch photos using unified hook
  const { data: photos = [], isLoading } = useProjectPhotos(currentProject?.id || null);

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
        <Card className="max-w-2xl p-12">
          <div className="text-center space-y-6">
            <ImageIcon className="h-20 w-20 mx-auto text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Fase de Diseño en Curso</h1>
              <p className="text-muted-foreground text-lg">
                Las fotos de avance de obra estarán disponibles cuando inicie la fase de construcción
              </p>
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Por ahora puedes revisar los renders y documentos de diseño en la sección de Documentos. 
              Una vez que el proyecto pase a la fase de construcción, aquí podrás ver el progreso fotográfico de tu obra.
            </p>
            <Button size="lg" onClick={() => navigate('/client/documents')}>
              Ver Documentos de Diseño
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2 flex items-center justify-center">
        <p>Cargando fotos...</p>
      </div>
    );
  }

  const handleDownloadAll = async () => {
    for (const photo of photos) {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${photo.descripcion || 'foto'}-${format(new Date(photo.fecha_foto), 'yyyy-MM-dd')}.jpg`;
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


      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {photos.map((photo: any, index) => (
          <Card 
            key={photo.id}
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all"
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <div className="relative aspect-square">
              <img 
                src={photo.url} 
                alt={photo.descripcion || 'Foto'}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute top-2 right-2">
                <Badge>{format(new Date(photo.fecha_foto || new Date()), "d MMM yyyy", { locale: es })}</Badge>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-1">{photo.descripcion || 'Sin descripción'}</h3>
              <p className="text-xs text-muted-foreground">Construcción</p>
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
    </div>
  );
}
