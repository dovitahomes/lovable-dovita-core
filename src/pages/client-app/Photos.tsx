import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockPhotos } from '@/lib/client-data';
import { MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Photos() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Fotos de Avance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualiza el progreso de tu proyecto
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mockPhotos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <div className="relative aspect-square">
              <img
                src={photo.url}
                alt={photo.description}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-2 right-2 bg-primary/90">
                {photo.phase}
              </Badge>
            </div>
            <div className="p-2 space-y-1">
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
    </div>
  );
}
