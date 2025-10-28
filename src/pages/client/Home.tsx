import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, FileText, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ClientHomeView() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
    };
    getUser();
  }, []);

  useEffect(() => {
    const storedProjectId = localStorage.getItem("client.activeProject");
    if (storedProjectId) {
      setProjectId(storedProjectId);
    }
  }, []);

  const { data: financialSummary, isLoading: loadingFinance } = useQuery({
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

  const { data: documents, isLoading: loadingDocs } = useQuery({
    queryKey: ["client-documents", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .eq("visibilidad", "cliente")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  if (!projectId) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center py-8">
          No hay proyecto seleccionado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bienvenido</h1>

      <div className="grid gap-4">
        {/* Financial Summary Card */}
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client/finanzas')}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Resumen Financiero</h3>
              {loadingFinance ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <p className="text-2xl font-semibold">
                  ${financialSummary?.total_expenses?.toLocaleString('es-MX') || '0'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Next Event Card */}
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client/calendario')}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Próxima Cita</h3>
              {loadingEvent ? (
                <Skeleton className="h-4 w-48" />
              ) : nextEvent ? (
                <div>
                  <p className="text-sm font-medium">{nextEvent.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(nextEvent.start_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay citas próximas</p>
              )}
            </div>
          </div>
        </Card>

        {/* Documents Card */}
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client/documentos')}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Documentos</h3>
              {loadingDocs ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <p className="text-sm">
                  {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Chat Card */}
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client/chat')}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Chat del Proyecto</h3>
              <p className="text-sm text-muted-foreground">Comunicación con el equipo</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
