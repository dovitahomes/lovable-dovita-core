import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, Image, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientHome() {
  const navigate = useNavigate();
  const projectId = localStorage.getItem("client.activeProject");

  const { data: financialSummary, isLoading: loadingFinances } = useQuery({
    queryKey: ["client-financial-summary", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("vw_client_financial_summary")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: nextEvent, isLoading: loadingEvent } = useQuery({
    queryKey: ["client-next-event", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("project_id", projectId)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: recentPhotos, isLoading: loadingPhotos } = useQuery({
    queryKey: ["client-recent-photos", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("construction_photos")
        .select("*")
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Simplified document count - just show placeholder for now
  const documents = { uploaded: 0, required: 0 };
  const loadingDocs = false;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">¡Hola!</h1>
        <p className="text-sm text-muted-foreground">Aquí está tu resumen</p>
      </div>

      {/* Financial Summary */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#0B5ED7]" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFinances ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : financialSummary ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">
                ${financialSummary.balance?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Saldo actual
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          )}
        </CardContent>
      </Card>

      {/* Next Event */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#0B5ED7]" />
            Próxima Cita
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEvent ? (
            <Skeleton className="h-16 w-full" />
          ) : nextEvent ? (
            <div className="space-y-2">
              <div className="font-medium text-foreground">{nextEvent.title}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(nextEvent.start_at), "PPp", { locale: es })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/portal/calendario")}
                className="w-full mt-2"
              >
                Ver calendario
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No hay citas próximas</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/portal/calendario")}
                className="w-full"
              >
                Ver calendario
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Photos */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4 text-[#0B5ED7]" />
            Últimos Avances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPhotos ? (
            <Skeleton className="h-16 w-full" />
          ) : recentPhotos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {recentPhotos.length} fotos recientes
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/portal/avances")}
                className="w-full"
              >
                Ver avances
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay avances recientes</p>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0B5ED7]" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDocs ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {documents.uploaded} de {documents.required} documentos cargados
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/portal/documentos")}
                className="w-full"
              >
                Ver documentos
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
