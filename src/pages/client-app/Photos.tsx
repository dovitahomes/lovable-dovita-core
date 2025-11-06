import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPhotos } from '@/lib/client-app/client-data';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { shouldShowConstructionPhotos, isInDesignPhase } from '@/lib/project-utils';
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
      <div>
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
  
  // Determine if in design phase
  const inDesignPhase = isInDesignPhase(currentProject);
  
  // Get unique phases from project photos
  const projectPhases = Array.from(new Set(projectPhotos.map(photo => photo.phase)));

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
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Galería del Proyecto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {inDesignPhase ? 'Renders y visualizaciones del diseño' : 'Avance de construcción'}
            </p>
          </div>

          {/* Phase Filter */}
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedPhase === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPhase('all')}
                className="whitespace-nowrap"
              >
                Todas
              </Button>
              {projectPhases.map((phase) => (
                <Button
                  key={phase}
                  variant={selectedPhase === phase ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPhase(phase)}
                  className="whitespace-nowrap"
                >
                  {phase}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total {inDesignPhase ? 'Renders' : 'Fotos'}</p>
                <p className="text-2xl font-bold">{filteredPhotos.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Última actualización</p>
                <p className="text-sm font-semibold mt-1">
                  {filteredPhotos.length > 0
                    ? format(new Date(filteredPhotos[0].date), "d MMM", { locale: es })
                    : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
                onClick={() => handlePhotoClick(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.description}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {photo.description}
                    </p>
                    <p className="text-white/75 text-xs">
                      {format(new Date(photo.date), "d 'de' MMM", { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Viewer */}
      <PhotoViewer
        open={selectedPhotoIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPhotoIndex(null);
        }}
        photos={projectPhotos}
        currentIndex={selectedPhotoIndex ?? 0}
        onNavigate={setSelectedPhotoIndex}
      />
    </div>
  );
}
