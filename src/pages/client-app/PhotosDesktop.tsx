import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { mockPhotos } from "@/lib/client-data";
import { Download, Maximize2 } from "lucide-react";

export default function PhotosDesktop() {
  const [selectedPhoto, setSelectedPhoto] = useState<typeof mockPhotos[0] | null>(null);
  const photos = mockPhotos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Galería de Fotos</h1>
          <p className="text-muted-foreground">{photos.length} fotos del progreso de tu obra</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Descargar Todas
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card 
            key={photo.id}
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="relative aspect-square">
              <img 
                src={photo.url} 
                alt={photo.description}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute top-2 right-2">
                <Badge>{photo.date}</Badge>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm">{photo.description}</h3>
              <p className="text-xs text-muted-foreground">{photo.phase}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.description}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              <div>
                <h3 className="font-bold text-xl mb-2">{selectedPhoto.description}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedPhoto.phase}</span>
                  <span>•</span>
                  <span>{selectedPhoto.date}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
