import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Camera, DollarSign, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OutletContext {
  projectId: string | null;
}

export default function HomeCliente() {
  const { projectId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  // Financial summary
  const { data: financialSummary } = useQuery({
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

  // Next appointment
  const { data: nextEvent } = useQuery({
    queryKey: ["next-event", projectId],
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

  // Recent photos count
  const { data: photosCount } = useQuery({
    queryKey: ["photos-count", projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const { count, error } = await supabase
        .from("construction_photos")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!projectId,
  });

  // Documents status - simplified for now
  const documentsStatus = { uploaded: 0, required: 0 };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Bienvenido</h2>
        <p className="text-sm text-muted-foreground">Resumen de tu proyecto</p>
      </div>

      {/* Financial Card */}
      <Card className="backdrop-blur-sm bg-card/95 border-border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gastos Totales</span>
              <span className="font-semibold">
                ${financialSummary?.total_expenses?.toLocaleString('es-MX') || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Depósitos</span>
              <span className="font-semibold text-primary">
                ${financialSummary?.total_deposits?.toLocaleString('es-MX') || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Balance</span>
              <span className="font-bold text-lg">
                ${financialSummary?.balance?.toLocaleString('es-MX') || '0'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate("/portal/presupuesto")}
          >
            Ver presupuesto completo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Next Appointment Card */}
      <Card className="backdrop-blur-sm bg-card/95 border-border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próxima Cita
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextEvent ? (
            <div className="space-y-2">
              <p className="font-medium">{nextEvent.title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(nextEvent.start_at), "PPP 'a las' p", { locale: es })}
              </p>
              {nextEvent.notes && (
                <p className="text-xs text-muted-foreground">{nextEvent.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay citas próximas</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate("/portal/citas")}
          >
            Ver calendario
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card className="backdrop-blur-sm bg-card/95 border-border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Avances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {photosCount} {photosCount === 1 ? 'foto registrada' : 'fotos registradas'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate("/portal/avances")}
          >
            Ver avances
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card className="backdrop-blur-sm bg-card/95 border-border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cargados</span>
              <span className="font-semibold">{documentsStatus?.uploaded ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pendientes</span>
              <span className="font-semibold text-yellow-600">
                {documentsStatus?.required ?? 0}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate("/portal/documentos")}
          >
            Gestionar documentos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
