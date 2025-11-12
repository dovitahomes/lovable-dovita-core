import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MapPin, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPreview } from '@/components/construction/MapPreview';

interface Photo {
  id: number;
  url: string;
  phase: string;
  date: string;
  description: string;
  location: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  descripcion?: string;
  fecha_foto?: string;
}

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}

export default function PhotoViewer({ 
  photos, 
  currentIndex, 
  open, 
  onOpenChange,
  onNavigate 
}: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const currentPhoto = photos[currentIndex];

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
      setZoom(1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setZoom(1);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPhoto.description}-${currentPhoto.date}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      window.open(currentPhoto.url, '_blank');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, photos.length]);

  // Touch/Swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (!currentPhoto) return null;

  // Check if photo has geolocation
  const hasGeolocation = currentPhoto?.latitude && currentPhoto?.longitude;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full h-full max-h-screen p-0 bg-black/95">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className="bg-primary mb-2">
                {currentPhoto.phase || 'Construcción'}
              </Badge>
              <h3 className="text-white font-semibold text-lg">
                {currentPhoto.description || currentPhoto.descripcion || 'Sin descripción'}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(currentPhoto.date || currentPhoto.fecha_foto), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
                {hasGeolocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Geolocalizada
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Main Content with Sidebar for Geolocated Photos */}
        <div className="flex h-full w-full">
          {/* Image Container */}
          <div 
            className={`flex items-center justify-center overflow-hidden ${hasGeolocation ? 'w-3/4 pr-4' : 'w-full'} p-16`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div 
              className="transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={currentPhoto.url}
                alt={currentPhoto.description || currentPhoto.descripcion}
                className="max-h-[80vh] max-w-full object-contain"
              />
            </div>
          </div>

          {/* Sidebar with Map (only if geolocated) */}
          {hasGeolocation && (
            <div className="w-1/4 bg-black/60 backdrop-blur-sm border-l border-white/10 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label className="text-white text-sm font-medium mb-2 block">
                    Ubicación de la Foto
                  </Label>
                  <MapPreview 
                    latitude={currentPhoto.latitude}
                    longitude={currentPhoto.longitude}
                    description={currentPhoto.description || currentPhoto.descripcion}
                    height="250px"
                  />
                </div>
                
                <div className="text-white/70 text-xs space-y-1">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>Lat: {currentPhoto.latitude.toFixed(6)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>Lng: {currentPhoto.longitude.toFixed(6)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {currentIndex < photos.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="text-white hover:bg-white/10"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="text-white hover:bg-white/10"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            {/* Photo Counter */}
            <span className="text-white text-sm">
              {currentIndex + 1} / {photos.length}
            </span>

            {/* Download Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleDownload}
              title="Descargar foto"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
