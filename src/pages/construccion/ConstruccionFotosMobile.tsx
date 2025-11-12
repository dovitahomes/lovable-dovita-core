import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from '@/lib/storage-helpers';
import { PhotoCardMobile } from '@/components/construction/mobile/PhotoCardMobile';
import { MobilePhotoUploadForm } from '@/components/construction/mobile/MobilePhotoUploadForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ConstruccionFotosMobile() {
  const { id } = useParams();
  const [photos, setPhotos] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadPhotos();
      loadStages();
    }
  }, [id]);

  const loadStages = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('construction_stages')
      .select('id, name, progress')
      .eq('project_id', id)
      .order('start_date', { ascending: true });

    if (!error && data) {
      setStages(data);
    }
  };

  const loadPhotos = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('construction_photos')
        .select(`
          *,
          construction_stages(name)
        `)
        .eq('project_id', id)
        .eq('is_active', true)
        .order('fecha_foto', { ascending: false });

      if (!error && data) {
        setPhotos(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const viewPhoto = async (photo: any) => {
    try {
      const { url } = await getSignedUrl({
        bucket: 'project_photos',
        path: photo.file_url,
        expiresInSeconds: 600
      });
      
      setPreviewUrl(url);
      setSelectedPhoto(photo);
      setPhotoDialogOpen(true);
    } catch (error) {
      console.error('Error loading photo:', error);
      toast.error('No se pudo cargar la foto');
    }
  };

  const deletePhoto = async (photoId: string, filePath: string) => {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return;

    try {
      const { error } = await supabase
        .from('construction_photos')
        .update({ is_active: false })
        .eq('id', photoId);

      if (error) throw error;

      toast.success('Foto eliminada');
      loadPhotos();
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error(error.message || 'Error al eliminar la foto');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Fotografías de Obra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} registradas
          </p>
        </div>
      </div>

      {/* Photos Grid with Infinite Scroll */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay fotografías aún</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Toca el botón de cámara para capturar tu primera foto
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {photos.map((photo) => (
              <PhotoCardMobile
                key={photo.id}
                photo={photo}
                onView={viewPhoto}
                onDelete={deletePhoto}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB Button */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 h-16 w-16 rounded-full shadow-2xl z-30 animate-pulse hover:animate-none"
        onClick={() => setUploadDialogOpen(true)}
      >
        <Camera className="h-8 w-8" />
      </Button>

      {/* Upload Dialog */}
      <MobilePhotoUploadForm
        projectId={id!}
        stages={stages}
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={loadPhotos}
      />

      {/* Photo Viewer Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={(open) => {
        setPhotoDialogOpen(open);
        if (!open) {
          setPreviewUrl(null);
          setSelectedPhoto(null);
        }
      }}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Fotografía de Construcción</DialogTitle>
          </DialogHeader>
          {selectedPhoto && previewUrl && (
            <div className="px-6 pb-6 space-y-4">
              <img
                src={previewUrl}
                alt={selectedPhoto.descripcion || 'Foto de construcción'}
                className="w-full rounded-lg"
              />
              {selectedPhoto.descripcion && (
                <p className="text-sm">{selectedPhoto.descripcion}</p>
              )}
              {selectedPhoto.construction_stages?.name && (
                <p className="text-xs text-muted-foreground">
                  Etapa: {selectedPhoto.construction_stages.name}
                </p>
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
