import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPhotos } from '@/lib/client-app/client-data';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { shouldShowConstructionPhotos } from '@/lib/project-utils';
import { MapPin, Calendar, Image as ImageIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import PhotoViewer from '@/components/client-app/PhotoViewer';
import PreviewBar from '@/components/client-app/PreviewBar';

export default function Photos() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const navigate = useNavigate();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');

  // Check if should show construction photos
  if (!shouldShowConstructionPhotos(currentProject)) {
    return (
      <div style={{ paddingTop: isPreviewMode ? '48px' : '0' }}>
        <PreviewBar />
        <div className="h-full overflow-y-auto p-4">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-1">Fotos de Avance</h1>
            <p className="text-sm text-white/90">
              Las fotos de construcción estarán disponibles próximamente
            </p>
          </div>
          <Card className="p-8">
            <div className="text-center space-y-4">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Fase de Diseño en Curso</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Las fotos de avance de obra estarán disponibles cuando inicie la fase de construcción. 
                Por ahora puedes revisar los renders y documentos de diseño en la sección de Documentos.
              </p>
              <Button onClick={() => navigate('/client/documents')}>
                Ver Documentos de Diseño
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Filter photos by current project
  const projectPhotos = mockPhotos.filter(photo => photo.projectId === currentProject?.id);

  // Get unique phases
  const phases = ['all', ...Array.from(new Set(projectPhotos.map(photo => photo.phase)))];

  // Filter photos by phase
  const filteredPhotos = selectedPhase === 'all' 
    ? projectPhotos 
    : projectPhotos.filter(photo => photo.phase === selectedPhase);

  const handlePhotoClick = (index: number) => {
    // Find the original index in the full project photos array
    const photo = filteredPhotos[index];
    const originalIndex = projectPhotos.findIndex(p => p.id === photo.id);
    setSelectedPhotoIndex(originalIndex);
  };

  return (
    <div style={{ paddingTop: isPreviewMode ? '48px' : '0' }}>
      <PreviewBar />
      <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold mb-1">Fotos de Avance</h1>
            <p className="text-sm text-white/90">
              Visualiza el progreso de tu proyecto
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <span className="font-semibold">{filteredPhotos.length}</span>
            </div>
            <p className="text-xs text-white/80">fotos</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Phase Filter */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por Fase</span>
          </div>
          <Tabs value={selectedPhase} onValueChange={setSelectedPhase}>
            <TabsList className="w-full grid grid-cols-4">
              {phases.map((phase) => (
                <TabsTrigger 
                  key={phase} 
                  value={phase}
                  className="text-xs"
                >
                  {phase === 'all' ? 'Todas' : phase}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {projectPhotos.filter(p => p.phase === 'Cimentación').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Cimentación</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {projectPhotos.filter(p => p.phase === 'Estructura').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Estructura</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-secondary">
              {projectPhotos.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </Card>
        </div>

        {/* Photo Gallery */}
        <div className="grid grid-cols-2 gap-3">
          {filteredPhotos.map((photo, index) => (
            <Card 
              key={photo.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => handlePhotoClick(index)}
            >
              <div className="relative aspect-square">
                <img
                  src={photo.url}
                  alt={photo.description}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm">
                  {photo.phase}
                </Badge>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-medium mb-1">
                      {photo.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(photo.date), "d MMM yyyy", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Obra - Juriquilla
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No hay fotos disponibles para esta fase
            </p>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={projectPhotos}
          currentIndex={selectedPhotoIndex}
          open={selectedPhotoIndex !== null}
          onOpenChange={(open) => !open && setSelectedPhotoIndex(null)}
          onNavigate={setSelectedPhotoIndex}
        />
      )}
      </div>
    </div>
  );
}
