import { useState } from 'react';
import { Eye, MapPin, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCategoryLabel, getCategoryIcon } from '@/lib/constants/photo-categories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PhotoCardMobileProps {
  photo: any;
  onView: (photo: any) => void;
  onDelete?: (photoId: string, filePath: string) => void;
}

export function PhotoCardMobile({ photo, onView, onDelete }: PhotoCardMobileProps) {
  const [imageError, setImageError] = useState(false);
  const CategoryIcon = getCategoryIcon(photo.categoria);

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-video bg-muted">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <CategoryIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Imagen no disponible</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground animate-pulse">Cargando...</div>
          </div>
        )}

        {/* Badges en esquina superior */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {photo.categoria && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <CategoryIcon className="h-3 w-3" />
              {getCategoryLabel(photo.categoria)}
            </Badge>
          )}
          {photo.construction_stages?.name && (
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
              {photo.construction_stages.name}
            </Badge>
          )}
        </div>

        {/* Ubicación badge */}
        {photo.latitude && photo.longitude && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="default" className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              GPS
            </Badge>
          </div>
        )}
      </div>

      {/* Info y acciones */}
      <div className="p-3 space-y-2">
        {photo.descripcion && (
          <p className="text-sm line-clamp-2">{photo.descripcion}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(new Date(photo.fecha_foto), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
        </p>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(photo)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver
          </Button>
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(photo.id, photo.file_url)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
