import { useParams, useNavigate } from "react-router-dom";
import { useProjectById } from "@/hooks/useProjects";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Grid3x3, Map, Activity } from "lucide-react";
import { ConstructionPhotosTab } from "@/components/construction/ConstructionPhotosTab";
import { ConstructionTimeline } from "@/components/construction/ConstructionTimeline";
import { PhotosMapView } from "@/components/construction/PhotosMapView";
import ConstruccionFotosMobile from "./ConstruccionFotosMobile";

export default function ConstruccionFotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project } = useProjectById(id!);
  const isMobile = useIsMobile();

  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
      </div>
    );
  }

  // Render mobile version for touch devices
  if (isMobile) {
    return <ConstruccionFotosMobile />;
  }

  // Desktop version
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(`/construccion/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Fotografías de Obra</h1>
          {project && (
            <p className="text-muted-foreground">
              {project.clients?.name || "Sin nombre"}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="gallery" className="gap-2">
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Galería</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Mapa</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-6">
          <ConstructionPhotosTab projectId={id} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <ConstructionTimeline projectId={id} />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <PhotosMapView projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
