import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OutletContext {
  projectId: string | null;
}

export default function Avances() {
  const { projectId } = useOutletContext<OutletContext>();

  const { data: photos, isLoading } = useQuery({
    queryKey: ["construction-photos", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("construction_photos")
        .select("*")
        .eq("project_id", projectId)
        .order("fecha_foto", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Avances de Obra</h2>
        <p className="text-sm text-muted-foreground">
          {photos?.length || 0} {photos?.length === 1 ? 'foto' : 'fotos'} registradas
        </p>
      </div>

      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <CardContent className="p-0">
                {photo.file_url && (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <p className="font-medium">{photo.descripcion || "Sin descripción"}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(photo.fecha_foto), "PPP", { locale: es })}
                  </p>
                  {photo.latitude && photo.longitude && (
                    <p className="text-xs text-muted-foreground">
                      📍 Ubicación registrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay fotos de avance registradas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
