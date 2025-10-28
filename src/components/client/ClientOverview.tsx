import {
  DollarSign,
  TrendingDown,
  Scale,
  Calendar,
  MessageCircle,
  TrendingUp,
  FolderOpen,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useClientFinancialSummary } from "@/hooks/useClientFinancialSummary";
import { useClientUpcomingEvents } from "@/hooks/useClientUpcomingEvents";
import { useClientRecentMessages } from "@/hooks/useClientRecentMessages";
import { useClientGanttProgress } from "@/hooks/useClientGanttProgress";
import { useClientBudget } from "@/hooks/useClientBudget";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { useClientPhotos } from "@/hooks/useClientPhotos";
import { ClientCard } from "./ClientCard";
import { Section } from "./Section";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ClientOverviewProps {
  projectId: string | null;
  clientName?: string;
}

export function ClientOverview({ projectId, clientName }: ClientOverviewProps) {
  const { data: financial, isLoading: loadingFinancial } = useClientFinancialSummary(projectId);
  const { data: events, isLoading: loadingEvents } = useClientUpcomingEvents(projectId);
  const { data: messages, isLoading: loadingMessages } = useClientRecentMessages(projectId);
  const { data: ganttProgress, isLoading: loadingGantt } = useClientGanttProgress(projectId);
  const { data: budget, isLoading: loadingBudget } = useClientBudget(projectId);
  const { data: documents, isLoading: loadingDocs } = useClientDocuments(projectId);
  const { data: photos, isLoading: loadingPhotos } = useClientPhotos(projectId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {clientName || "Cliente"} 👋
        </h1>
        <p className="text-slate-600">
          Aquí puedes ver el resumen de tu proyecto.
        </p>
      </div>

      {/* Financial Summary */}
      <Section title="Resumen Financiero">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
          <ClientCard
            title="Depósitos"
            icon={DollarSign}
            rightMetric={
              loadingFinancial ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                formatCurrency(financial?.depositos || 0)
              )
            }
            className="min-w-[160px] snap-start"
          />
          <ClientCard
            title="Egresos"
            icon={TrendingDown}
            rightMetric={
              loadingFinancial ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                formatCurrency(financial?.egresos || 0)
              )
            }
            className="min-w-[160px] snap-start"
          />
          <ClientCard
            title="Saldo"
            icon={Scale}
            rightMetric={
              loadingFinancial ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span className="flex items-center gap-1">
                  {formatCurrency(financial?.saldo || 0)}
                  {financial && financial.saldo < 0 && (
                    <Badge variant="secondary" className="bg-amber-400/90 text-amber-900 text-[10px] px-1.5 py-0">
                      !
                    </Badge>
                  )}
                </span>
              )
            }
            className="min-w-[160px] snap-start"
          />
        </div>
      </Section>

      {/* Timeline Progress */}
      {loadingGantt ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : ganttProgress ? (
        <ClientCard
          title="Avance del Cronograma"
          subtitle={ganttProgress.nextMinistration ? `Próximo: ${ganttProgress.nextMinistration.label}` : undefined}
          icon={TrendingUp}
        >
          <div className="space-y-2">
            <Progress value={ganttProgress.progressPct} className="h-2" />
            <div className="flex justify-between text-xs text-slate-600">
              <span>{ganttProgress.progressPct}% completado</span>
              <span>{ganttProgress.completed} de {ganttProgress.total} fases</span>
            </div>
            {ganttProgress.nextMinistration && (
              <p className="text-xs text-slate-500 mt-2">
                Siguiente hito: {new Date(ganttProgress.nextMinistration.date).toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </ClientCard>
      ) : null}

      {/* Budget */}
      {loadingBudget ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : budget ? (
        <ClientCard
          title="Presupuesto Ejecutivo"
          subtitle={`Versión ${budget.version}`}
          icon={FolderOpen}
        >
          <div className="space-y-2">
            {budget.subtotals.slice(0, 3).map((item) => (
              <div key={item.mayor_id} className="flex justify-between text-sm">
                <span className="text-slate-600">{item.mayor_name}</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(Number(item.subtotal))}
                </span>
              </div>
            ))}
            {budget.subtotals.length > 3 && (
              <p className="text-xs text-slate-500 pt-1">
                +{budget.subtotals.length - 3} conceptos más
              </p>
            )}
            <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-semibold">
              <span className="text-slate-900">Total</span>
              <span className="text-[hsl(var(--dovita-blue))]">
                {formatCurrency(budget.total)}
              </span>
            </div>
          </div>
        </ClientCard>
      ) : null}

      {/* Documents */}
      <Section
        title="Documentos"
        action={{
          label: "Ver todos",
          onClick: () => console.log("Navigate to documents"),
        }}
      >
        {loadingDocs ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="rounded-lg bg-white p-2 border border-slate-200">
                  <FileText className="h-4 w-4 text-[hsl(var(--dovita-blue))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {doc.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(doc.created_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">No hay documentos disponibles</p>
          </div>
        )}
      </Section>

      {/* Photos */}
      <Section
        title="Fotos de Obra"
        action={{
          label: "Ver galería",
          onClick: () => console.log("Navigate to photos"),
        }}
      >
        {loadingPhotos ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : photos && photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
              >
                <img
                  src={photo.file_url}
                  alt={photo.descripcion || "Foto de obra"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
            <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Aún no hay fotos disponibles</p>
          </div>
        )}
      </Section>

      {/* Upcoming Events */}
      <Section title="Próximas Citas">
        {loadingEvents ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : events && events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Calendar className="h-4 w-4 text-[hsl(var(--dovita-blue))]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    {new Date(event.start_at).toLocaleDateString("es-MX", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {event.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Aún no tienes citas agendadas 📅
            </p>
          </div>
        )}
      </Section>

      {/* Chat Preview */}
      <Section
        title="Chat"
        action={{
          label: "Abrir chat",
          onClick: () => console.log("Navigate to chat"),
        }}
      >
        {loadingMessages ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : messages && messages.length > 0 ? (
          <div className="space-y-2">
            {messages.slice(0, 3).map((msg) => (
              <div
                key={msg.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-sm text-[hsl(var(--dovita-blue))]">
                    {msg.sender_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
            <MessageCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Tu chat está vacío 💬
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}
