import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Photo {
  id: string;
  file_url: string;
  descripcion: string | null;
  fecha_foto: string;
  latitude: number | null;
  longitude: number | null;
}

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoViewer({ photos, initialIndex, isOpen, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const minSwipeDistance = 50;

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

    if (isLeftSwipe && currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(photos.length - 1, prev + 1));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose]);

  if (!photos.length) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl p-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
            onClick={onClose}
            aria-label="Cerrar visor"
          >
            <X className="h-4 w-4" />
          </Button>

          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={handlePrevious}
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {currentIndex < photos.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={handleNext}
              aria-label="Siguiente foto"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          <img
            src={currentPhoto.file_url}
            alt={currentPhoto.descripcion || `Foto ${currentIndex + 1}`}
            className="w-full max-h-[70vh] object-contain"
          />

          <div className="p-4 bg-background space-y-2">
            {currentPhoto.descripcion && (
              <p className="text-sm font-medium">{currentPhoto.descripcion}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {format(new Date(currentPhoto.fecha_foto), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
              <span>
                {currentIndex + 1} / {photos.length}
              </span>
            </div>

            {(currentPhoto.latitude || currentPhoto.longitude) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span>
                  {currentPhoto.latitude?.toFixed(6)}, {currentPhoto.longitude?.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
