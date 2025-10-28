import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, FileText, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyProjects, useClientFinancialSummary } from "@/features/client/hooks";
import { useClientUpcomingEvents } from "@/hooks/useClientUpcomingEvents";
import { useClientDocuments } from "@/hooks/useClientDocuments";

export default function ClientHomeView() {
  const navigate = useNavigate();
  const { currentProject } = useMyProjects();
  const projectId = currentProject?.id || null;

  const { data: financialData, isLoading: loadingFinance } = useClientFinancialSummary(projectId);
  const { data: upcomingEvents, isLoading: loadingEvent } = useClientUpcomingEvents(projectId);
  const { data: documents, isLoading: loadingDocs } = useClientDocuments(projectId, 5);

  const financialSummary = financialData?.[0];
  const nextEvent = upcomingEvents?.[0];

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
    <div className="space-y-4 pb-6">
      <h1 className="text-xl font-semibold">Bienvenido</h1>

      <div className="grid gap-4">
        {/* Financial Summary Card */}
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" onClick={() => navigate('/client/finanzas')}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-1">Resumen Financiero</h3>
              {loadingFinance ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>
                  <p className="text-2xl font-semibold">
                    ${financialSummary?.total_expenses?.toLocaleString('es-MX') || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saldo: ${financialSummary?.balance?.toLocaleString('es-MX') || '0'}
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Next Event Card */}
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" onClick={() => navigate('/client/calendario')}>
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
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" onClick={() => navigate('/client/documentos')}>
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
                  {documents?.length || 0} {documents?.length === 1 ? 'documento' : 'documentos'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Chat Card */}
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" onClick={() => navigate('/client/chat')}>
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
