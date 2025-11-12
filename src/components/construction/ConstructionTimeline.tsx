import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, Calendar, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TimelineStage {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  photo_count: number;
  latest_photo_date: string | null;
}

interface ConstructionTimelineProps {
  projectId: string;
}

export function ConstructionTimeline({ projectId }: ConstructionTimelineProps) {
  const { data: stages, isLoading } = useQuery({
    queryKey: ["construction-timeline", projectId],
    queryFn: async () => {
      // Get stages with photo counts
      const { data: stagesData, error: stagesError } = await supabase
        .from("construction_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (stagesError) throw stagesError;

      // Get photo counts per stage
      const stageIds = stagesData?.map((s) => s.id) || [];
      const { data: photosData, error: photosError } = await supabase
        .from("construction_photos")
        .select("stage_id, fecha_foto")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .in("stage_id", stageIds);

      if (photosError) throw photosError;

      // Count photos per stage and get latest photo date
      const photosByStage = photosData?.reduce((acc, photo) => {
        if (!photo.stage_id) return acc;
        
        if (!acc[photo.stage_id]) {
          acc[photo.stage_id] = { count: 0, latestDate: null };
        }
        acc[photo.stage_id].count++;
        
        if (photo.fecha_foto) {
          const photoDate = new Date(photo.fecha_foto);
          if (!acc[photo.stage_id].latestDate || photoDate > acc[photo.stage_id].latestDate) {
            acc[photo.stage_id].latestDate = photoDate;
          }
        }
        
        return acc;
      }, {} as Record<string, { count: number; latestDate: Date | null }>) || {};

      return stagesData?.map((stage) => ({
        id: stage.id,
        name: stage.name,
        start_date: stage.start_date,
        end_date: stage.end_date,
        progress: stage.progress,
        photo_count: photosByStage[stage.id]?.count || 0,
        latest_photo_date: photosByStage[stage.id]?.latestDate?.toISOString() || null,
      })) as TimelineStage[];
    },
    enabled: !!projectId,
  });

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (progress > 0) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    return <Calendar className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 100) {
      return "bg-green-500";
    } else if (progress > 0) {
      return "bg-blue-500";
    }
    return "bg-muted";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-1/3 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Sin etapas registradas</h3>
        <p className="text-muted-foreground">
          Agrega etapas de construcción para visualizar el progreso
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <Card
          key={stage.id}
          className="relative overflow-hidden transition-all hover:shadow-md"
        >
          {/* Timeline connector line */}
          {index < stages.length - 1 && (
            <div className="absolute left-[29px] top-[60px] w-0.5 h-full bg-border -z-10" />
          )}

          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Timeline icon */}
              <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background ${getStatusColor(stage.progress)}`}>
                {getStatusIcon(stage.progress)}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{stage.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {stage.start_date && (
                        <span>
                          {format(new Date(stage.start_date), "dd MMM yyyy", { locale: es })}
                        </span>
                      )}
                      {stage.start_date && stage.end_date && <span>→</span>}
                      {stage.end_date && (
                        <span>
                          {format(new Date(stage.end_date), "dd MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Camera className="h-3 w-3" />
                      {stage.photo_count} {stage.photo_count === 1 ? "foto" : "fotos"}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{stage.progress}%</span>
                  </div>
                  <Progress value={stage.progress} className="h-2" />
                </div>

                {/* Latest photo info */}
                {stage.latest_photo_date && (
                  <p className="text-sm text-muted-foreground">
                    Última foto: {format(new Date(stage.latest_photo_date), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
