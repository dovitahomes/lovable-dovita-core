import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  description?: string;
  className?: string;
  height?: string;
}

export function MapPreview({ 
  latitude, 
  longitude, 
  description,
  className = "",
  height = "200px"
}: MapPreviewProps) {
  // Google Maps Embed API URL (gratuito para embeds estáticos)
  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${latitude},${longitude}&zoom=15&maptype=roadmap`;
  
  // URL para navegación nativa en Google Maps
  const navigationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative" style={{ height }}>
        {/* Mini-mapa embebido */}
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          allowFullScreen
          loading="lazy"
          title={description || "Ubicación de la foto"}
        />
        
        {/* Overlay con link para abrir en Google Maps nativo */}
        <div className="absolute bottom-2 right-2 z-10">
          <a
            href={navigationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 bg-background/90 rounded-md shadow-sm text-xs hover:bg-background transition-colors border border-border"
          >
            <MapPin className="h-3 w-3" />
            <span>Abrir en Maps</span>
          </a>
        </div>
      </div>
      
      {/* Coordenadas como texto secundario */}
      <div className="px-3 py-2 bg-muted/50 border-t text-xs text-muted-foreground text-center">
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </Card>
  );
}
