import { DollarSign, TrendingDown, Scale, Calendar, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientFinancialSummary } from "@/hooks/useClientFinancialSummary";
import { useClientUpcomingEvents } from "@/hooks/useClientUpcomingEvents";
import { useClientRecentMessages } from "@/hooks/useClientRecentMessages";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[hsl(var(--dovita-blue))]">
          Hola, {clientName || "Cliente"} 👋
        </h2>
        <p className="text-[hsl(var(--dovita-dark))] opacity-70">
          Aquí puedes ver el resumen de tu proyecto.
        </p>
      </div>

      {/* Financial Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--dovita-dark))] opacity-60 uppercase tracking-wide">
          Resumen Financiero
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {/* Depósitos */}
          <Card className="min-w-[280px] snap-start border-[#E0E0E0] shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Depósitos</p>
                  {loadingFinancial ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <p className="text-2xl font-semibold text-[hsl(var(--dovita-blue))]">
                      {financial ? formatCurrency(financial.depositos) : "—"}
                    </p>
                  )}
                </div>
                <div className="rounded-full bg-blue-50 p-3">
                  <DollarSign className="h-6 w-6 text-[hsl(var(--dovita-blue))]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Egresos */}
          <Card className="min-w-[280px] snap-start border-[#E0E0E0] shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Egresos</p>
                  {loadingFinancial ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <p className="text-2xl font-semibold text-[hsl(var(--dovita-blue))]">
                      {financial ? formatCurrency(financial.egresos) : "—"}
                    </p>
                  )}
                </div>
                <div className="rounded-full bg-red-50 p-3">
                  <TrendingDown className="h-6 w-6 text-[hsl(var(--dovita-blue))]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo */}
          <Card className="min-w-[280px] snap-start border-[#E0E0E0] shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Saldo</p>
                  {loadingFinancial ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <p className="text-2xl font-semibold text-[hsl(var(--dovita-blue))]">
                      {financial ? formatCurrency(financial.saldo) : "—"}
                    </p>
                  )}
                </div>
                <div className="rounded-full bg-green-50 p-3">
                  <Scale className="h-6 w-6 text-[hsl(var(--dovita-blue))]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Próximas Citas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--dovita-dark))] opacity-60 uppercase tracking-wide">
          Próximas Citas
        </h3>
        <Card className="border-[#E0E0E0] shadow-sm">
          <CardContent className="pt-6">
            {loadingEvents ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-shrink-0">
                      <div className="rounded-full bg-[hsl(var(--dovita-blue))] bg-opacity-10 p-2">
                        <Calendar className="h-4 w-4 text-[hsl(var(--dovita-blue))]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[hsl(var(--dovita-dark))]">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(event.start_at).toLocaleDateString("es-MX", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Aún no tienes citas agendadas 📅
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimos Mensajes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--dovita-dark))] opacity-60 uppercase tracking-wide">
          Últimos Mensajes
        </h3>
        <Card className="border-[#E0E0E0] shadow-sm">
          <CardContent className="pt-6">
            {loadingMessages ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm text-[hsl(var(--dovita-blue))]">
                        {msg.sender_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Tu chat está vacío 💬
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
