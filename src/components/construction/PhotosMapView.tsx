import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { getSignedUrl } from "@/lib/storage-helpers";

interface GeolocatedPhoto {
  id: string;
  latitude: number;
  longitude: number;
  descripcion: string | null;
  fecha_foto: string;
  file_url: string;
  categoria: string | null;
  stage_name: string | null;
}

interface PhotosMapViewProps {
  projectId: string;
  className?: string;
}

// Define google maps types
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function PhotosMapView({ projectId, className = "" }: PhotosMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GeolocatedPhoto | null>(null);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["geolocated-photos", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("construction_photos")
        .select(`
          id,
          latitude,
          longitude,
          descripcion,
          fecha_foto,
          file_url,
          categoria,
          stage_id,
          construction_stages (
            name
          )
        `)
        .eq("project_id", projectId)
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("fecha_foto", { ascending: false });

      if (error) throw error;

      return data?.map((photo: any) => ({
        id: photo.id,
        latitude: photo.latitude,
        longitude: photo.longitude,
        descripcion: photo.descripcion,
        fecha_foto: photo.fecha_foto,
        file_url: photo.file_url,
        categoria: photo.categoria,
        stage_name: photo.construction_stages?.name || null,
      })) as GeolocatedPhoto[];
    },
    enabled: !!projectId,
  });

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map when script loads and photos are available
  useEffect(() => {
    if (!isScriptLoaded || !photos || photos.length === 0 || !mapRef.current) return;

    // Initialize map centered on first photo
    const firstPhoto = photos[0];
    const center = { lat: Number(firstPhoto.latitude), lng: Number(firstPhoto.longitude) };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 16,
      mapTypeId: "hybrid", // Show satellite view with labels
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each photo
    const bounds = new window.google.maps.LatLngBounds();

    photos.forEach((photo) => {
      const position = { lat: Number(photo.latitude), lng: Number(photo.longitude) };
      
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: photo.descripcion || "Foto de obra",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add click listener to show photo info
      marker.addListener("click", () => {
        setSelectedPhoto(photo);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (photos.length > 1) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [isScriptLoaded, photos]);

  if (isLoading) {
    return (
      <Card className={`p-8 flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Sin fotos geolocalizadas</h3>
        <p className="text-muted-foreground">
          Las fotos con ubicación aparecerán en el mapa
        </p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="overflow-hidden">
        <div ref={mapRef} className="w-full h-[500px]" />
      </Card>

      {selectedPhoto && (
        <PhotoInfoCard
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}

function PhotoInfoCard({
  photo,
  onClose,
}: {
  photo: GeolocatedPhoto;
  onClose: () => void;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        const { url } = await getSignedUrl({
          bucket: "project_photos",
          path: photo.file_url,
          expiresInSeconds: 3600,
        });
        setSignedUrl(url);
      } catch (error) {
        console.error("Error fetching signed URL:", error);
      }
    };

    fetchSignedUrl();
  }, [photo.file_url]);

  return (
    <Card className="p-4 animate-fade-in">
      <div className="flex items-start gap-4">
        {signedUrl && (
          <img
            src={signedUrl}
            alt={photo.descripcion || "Foto de obra"}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {photo.descripcion || "Sin descripción"}
          </h3>
          {photo.stage_name && (
            <p className="text-sm text-muted-foreground">{photo.stage_name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(photo.fecha_foto).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </Card>
  );
}
